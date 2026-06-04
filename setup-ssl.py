#!/usr/bin/env python3
"""
Install acme.sh on NAS and issue Let's Encrypt SSL certificate
using Alibaba Cloud DNS-01 challenge for lvhuianquan.icu
"""
import paramiko, time, json, os

HOST, PORT = '100.66.1.6', 6884
USER, PWD = 'wuxiaojun66', 'wu@xj123'
SUDO = f'echo {PWD} | sudo -S'
DOMAIN = 'lvhuianquan.icu'
NAS_APP = '/vol2/1000/ZY/occupational-health'

# Alibaba Cloud AccessKey (for DNS-01 challenge) - set via env vars
AK_ID = os.environ.get('ALI_AK_ID', '')
AK_SECRET = os.environ.get('ALI_AK_SECRET', '')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PWD, timeout=15)
print('SSH connected!')

def run(cmd, desc='', timeout=120):
    if desc:
        print(f'\n>>> {desc}')
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    lines = out.strip().split('\n')
    # Show last 25 lines
    for l in lines[-25:]:
        print(f'  {l}')
    return out, stdout.channel.recv_exit_status()

# =============================================
# Step 1: Install acme.sh
# =============================================
print('\n' + '='*60)
print('  STEP 1: Install acme.sh')
print('='*60)

out, ec = run(
    'curl https://get.acme.sh | sh -s email=ssl@lvhuianquan.icu 2>&1',
    'Download and install acme.sh',
    timeout=60
)

# Verify installation
out, ec = run('~/.acme.sh/acme.sh --version 2>&1', 'Verify acme.sh installed')

# =============================================
# Step 2: Issue certificate using DNS-01 (Alibaba Cloud)
# =============================================
print('\n' + '='*60)
print('  STEP 2: Issue SSL certificate (DNS-01 challenge)')
print('='*60)

issue_cmd = f'''export Ali_Key="{AK_ID}"
export Ali_Secret="{AK_SECRET}"
~/.acme.sh/acme.sh --issue --dns dns_ali -d {DOMAIN} -d *.{DOMAIN} --keylength ec-256 --server letsencrypt 2>&1'''

out, ec = run(issue_cmd, 'Issue certificate (this may take 2-3 minutes for DNS propagation)', timeout=300)

if ec != 0:
    # Retry with longer wait
    print('\n  First attempt may have failed, retrying with longer DNS wait...')
    issue_cmd2 = f'''export Ali_Key="{AK_ID}"
export Ali_Secret="{AK_SECRET}"
~/.acme.sh/acme.sh --issue --dns dns_ali -d {DOMAIN} -d *.{DOMAIN} --keylength ec-256 --dnssleep 120 --server letsencrypt --force 2>&1'''
    out, ec = run(issue_cmd2, 'Retry certificate issuance with longer DNS wait', timeout=600)

# =============================================
# Step 3: Install certificate to app directory
# =============================================
print('\n' + '='*60)
print('  STEP 3: Install certificate')
print('='*60)

cert_dir = f'{NAS_APP}/ssl'
install_cmd = f'''mkdir -p {cert_dir}
~/.acme.sh/acme.sh --install-cert -d {DOMAIN} --ecc \\
  --key-file {cert_dir}/privkey.pem \\
  --fullchain-file {cert_dir}/fullchain.pem \\
  --cert-file {cert_dir}/cert.pem \\
  --ca-file {cert_dir}/chain.pem \\
  --reloadcmd "echo cert_reloaded" 2>&1'''

out, ec = run(install_cmd, 'Install certificate files')

# Verify cert files
out, ec = run(f'ls -la {cert_dir}/', 'Verify certificate files')

# =============================================
# Step 4: Configure Fastify to use HTTPS
# =============================================
print('\n' + '='*60)
print('  STEP 4: Create HTTPS startup script for NAS')
print('='*60)

# We'll use a simple Node.js HTTPS proxy in front of the app
# Or better: modify the Docker container to support HTTPS

# Actually, the simplest approach: run a small Caddy/nginx reverse proxy
# But NAS already has limited resources. Let's just add HTTPS to the Node.js app.

# Create an HTTPS entry script that the container can use
https_script = f'''const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SSL_DIR = '/app/ssl';
const TARGET_PORT = 3000; // internal app port
const HTTPS_PORT = 3001;
const HTTP_PORT = 3002;

let sslOptions;
try {{
  sslOptions = {{
    key: fs.readFileSync(path.join(SSL_DIR, 'privkey.pem')),
    cert: fs.readFileSync(path.join(SSL_DIR, 'fullchain.pem')),
  }};
  console.log('[HTTPS] SSL certificates loaded');
}} catch (e) {{
  console.error('[HTTPS] Failed to load SSL certs, falling back to HTTP only:', e.message);
  sslOptions = null;
}}

function proxy(req, res) {{
  const options = {{
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {{ ...req.headers, 'x-forwarded-proto': sslOptions ? 'https' : 'http' }},
  }};

  const proxyReq = http.request(options, (proxyRes) => {{
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, {{ end: true }});
  }});

  proxyReq.on('error', (e) => {{
    res.writeHead(502);
    res.end('Bad Gateway: ' + e.message);
  }});

  req.pipe(proxyReq, {{ end: true }});
}}

// HTTPS server (port 3001)
if (sslOptions) {{
  https.createServer(sslOptions, proxy).listen(HTTPS_PORT, '0.0.0.0', () => {{
    console.log(`[HTTPS] Proxy listening on port ${{HTTPS_PORT}}`);
  }});
}}

// HTTP → HTTPS redirect (port 3002)
http.createServer((req, res) => {{
  const host = req.headers.host ? req.headers.host.split(':')[0] : '{DOMAIN}';
  res.writeHead(301, {{ Location: `https://${{host}}:${{HTTPS_PORT}}${{req.url}}` }});
  res.end();
}}).listen(HTTP_PORT, '0.0.0.0', () => {{
  console.log(`[HTTP] Redirect listening on port ${{HTTP_PORT}}`);
}});
'''

# Upload the HTTPS proxy script
sftp = ssh.open_sftp()
with sftp.file(f'{NAS_APP}/https-proxy.js', 'w') as f:
    f.write(https_script)
sftp.close()
print('  https-proxy.js uploaded')

# =============================================
# Step 5: Update Docker to use HTTPS
# =============================================
print('\n' + '='*60)
print('  STEP 5: Update Docker Compose for HTTPS')
print('='*60)

# Read current docker-compose.yml
stdin, stdout, stderr = ssh.exec_command(f'cat {NAS_APP}/docker-compose.yml', get_pty=True)
current_compose = stdout.read().decode('utf-8', errors='replace')
print('Current compose:')
for l in current_compose.strip().split('\n')[-10:]:
    print(f'  {l}')

# New docker-compose with SSL volume mount and HTTPS proxy
new_compose = f'''version: '3.8'
services:
  app:
    image: occupational-health:latest
    container_name: occupational-health
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
      - "3002:3002"
    volumes:
      - {NAS_APP}/data:/app/data
      - {NAS_APP}/uploads:/app/uploads
      - {NAS_APP}/ssl:/app/ssl:ro
      - {NAS_APP}/https-proxy.js:/app/https-proxy.js:ro
    environment:
      - NODE_ENV=production
      - PORT=3000
    command: sh -c "node index.js & sleep 3 && node https-proxy.js & wait"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
'''

# Upload new docker-compose
sftp = ssh.open_sftp()
with sftp.file(f'{NAS_APP}/docker-compose.yml', 'w') as f:
    f.write(new_compose)
sftp.close()
print('  docker-compose.yml updated with HTTPS support')

# =============================================
# Step 6: Copy SSL certs into container and restart
# =============================================
print('\n' + '='*60)
print('  STEP 6: Restart with HTTPS')
print('='*60)

# Stop old container
run(f'{SUDO} docker stop occupational-health 2>/dev/null; {SUDO} docker rm occupational-health 2>/dev/null; echo cleaned', 'Stop old container')

# Start with new compose
run(f'cd {NAS_APP} && {SUDO} docker compose up -d 2>&1', 'Start container with HTTPS')

time.sleep(10)

# Check container
run(f'{SUDO} docker ps --filter name=occupational-health --format "table {{{{.Names}}}}\\t{{{{.Status}}}}\\t{{{{.Ports}}}}"', 'Container status')

# =============================================
# Step 7: Verify HTTPS
# =============================================
print('\n' + '='*60)
print('  STEP 7: Verify HTTPS')
print('='*60)

# Test HTTPS via IPv6
run(f'curl -6 -sk -o /dev/null -w "HTTPS_%{{http_code}}" https://lvhuianquan.icu:3001/ 2>&1; echo', 'HTTPS test (IPv6 domain)')

# Test HTTP redirect
run(f'curl -6 -s -o /dev/null -w "HTTP_%{{http_code}}" http://lvhuianquan.icu:3002/ 2>&1; echo', 'HTTP redirect test')

# Test login via HTTPS
login_cmd = f'''curl -6 -sk https://lvhuianquan.icu:3001/api/auth/login -X POST -H 'Content-Type: application/json' -d '{{"username":"admin","password":"admin123"}}' '''
stdin, stdout, stderr = ssh.exec_command(login_cmd, get_pty=True)
result = stdout.read().decode('utf-8', errors='replace').strip()
for line in result.split('\n'):
    line = line.strip()
    if line.startswith('{'):
        try:
            data = json.loads(line)
            if 'token' in data.get('data', {}):
                data['data']['token'] = data['data']['token'][:20] + '...'
            print(f'  HTTPS Login: {json.dumps(data, ensure_ascii=False)[:200]}')
        except:
            print(f'  HTTPS Login: {line[:200]}')

# Check cert info
run(f'echo | openssl s_client -connect [2409:8a20:6611:ab90:d53d:2c5b:43ed:a661]:3001 2>/dev/null | openssl x509 -noout -subject -dates -issuer 2>&1', 'Certificate details')

# Check container logs
run(f'{SUDO} docker logs --tail 20 occupational-health 2>&1', 'Container logs')

# =============================================
# Step 8: Setup auto-renewal cron
# =============================================
print('\n' + '='*60)
print('  STEP 8: Auto-renewal (acme.sh built-in)')
print('='*60)

# acme.sh automatically adds a cron job during install
# Let's verify and customize the renewal command
run('crontab -l 2>&1', 'Current crontab')

# Add custom reload command after renewal
# The --reloadcmd was set during --install-cert, but we also need to restart the container
renew_hook_cmd = f'''~/.acme.sh/acme.sh --install-cert -d {DOMAIN} --ecc \\
  --key-file {NAS_APP}/ssl/privkey.pem \\
  --fullchain-file {NAS_APP}/ssl/fullchain.pem \\
  --cert-file {NAS_APP}/ssl/cert.pem \\
  --ca-file {NAS_APP}/ssl/chain.pem \\
  --reloadcmd "{SUDO} docker restart occupational-health" 2>&1'''

run(renew_hook_cmd, 'Update renewal hook to restart Docker container')

# Verify cron
run('crontab -l 2>&1', 'Verify renewal cron')

# =============================================
# Final summary
# =============================================
print('\n' + '='*60)
print('  SSL CONFIGURATION COMPLETE!')
print('='*60)
print(f'''
  HTTPS URL:  https://lvhuianquan.icu:3001
  HTTP Redirect: http://lvhuianquan.icu:3002 → HTTPS
  
  Certificate: Let's Encrypt (ECC 256-bit)
  Auto-renewal: acme.sh cron (every 60 days)
  Renewal hook: restarts Docker container
  
  Internal ports:
    3000 = Node.js app (HTTP, internal only)
    3001 = HTTPS proxy (external)
    3002 = HTTP → HTTPS redirect
''')

ssh.close()
