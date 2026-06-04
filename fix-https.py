#!/usr/bin/env python3
"""Fix HTTPS proxy on NAS and restart"""
import paramiko, time, json, os

HOST, PORT = '100.66.1.6', 6884
USER, PWD = 'wuxiaojun66', 'wu@xj123'
SUDO = f'echo {PWD} | sudo -S'
NAS = '/vol2/1000/ZY/occupational-health'
LOCAL = r'C:\Users\Administrator\WorkBuddy\2026-06-03-15-53-30'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PWD, timeout=15)
print('SSH OK')

# Upload https-proxy.js
sftp = ssh.open_sftp()
sftp.put(os.path.join(LOCAL, 'https-proxy.js'), f'{NAS}/https-proxy.js')
sftp.close()
print('https-proxy.js uploaded')

# Upload updated docker-compose.yml
compose = f'''services:
  app:
    image: occupational-health:latest
    container_name: occupational-health
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
      - "3002:3002"
    volumes:
      - {NAS}/data:/app/server/data
      - {NAS}/uploads:/app/server/uploads/reports
      - {NAS}/ssl:/app/ssl:ro
      - {NAS}/https-proxy.js:/app/https-proxy.js:ro
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=change_me_to_a_strong_random_key_at_least_32_chars
      - JWT_EXPIRES_IN=24h
      - UPLOAD_DIR=uploads/reports
      - MAX_FILE_SIZE=20971520
    command: sh -c "node server/index.js & sleep 3 && node https-proxy.js & wait"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
'''

sftp = ssh.open_sftp()
with sftp.file(f'{NAS}/docker-compose.yml', 'w') as f:
    f.write(compose)
sftp.close()
print('docker-compose.yml uploaded')

# Stop and remove old container
print('\n>>> Stopping old container...')
stdin, stdout, stderr = ssh.exec_command(f'{SUDO} docker stop occupational-health 2>/dev/null; {SUDO} docker rm occupational-health 2>/dev/null; echo done', get_pty=True)
stdout.read()

# Start new container
print('>>> Starting container...')
stdin, stdout, stderr = ssh.exec_command(f'cd {NAS} && {SUDO} docker compose up -d 2>&1', get_pty=True)
print(stdout.read().decode('utf-8', errors='replace'))

time.sleep(12)

# Verify container
print('>>> Container status:')
stdin, stdout, stderr = ssh.exec_command(f'{SUDO} docker ps --filter name=occupational-health --format "table {{{{.Names}}}}\\t{{{{.Status}}}}\\t{{{{.Ports}}}}"', get_pty=True)
print(stdout.read().decode('utf-8', errors='replace'))

# Check logs
print('>>> Logs:')
stdin, stdout, stderr = ssh.exec_command(f'{SUDO} docker logs --tail 25 occupational-health 2>&1', get_pty=True)
print(stdout.read().decode('utf-8', errors='replace'))

# Test HTTPS
print('>>> HTTPS test:')
stdin, stdout, stderr = ssh.exec_command('curl -6 -sk -o /dev/null -w "HTTP_%{http_code}" https://lvhuianquan.icu:3001/ 2>&1; echo', get_pty=True)
print('  HTTPS root:', stdout.read().decode('utf-8', errors='replace').strip())

# Test HTTPS login
print('>>> HTTPS login:')
cmd = """curl -6 -sk https://lvhuianquan.icu:3001/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' """
stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
result = stdout.read().decode('utf-8', errors='replace').strip()
for line in result.split('\n'):
    line = line.strip()
    if line.startswith('{'):
        try:
            data = json.loads(line)
            if 'token' in data.get('data', {}):
                data['data']['token'] = data['data']['token'][:20] + '...'
            print('  Login:', json.dumps(data, ensure_ascii=False)[:300])
        except:
            print('  Login:', line[:200])

# Test HTTP redirect
stdin, stdout, stderr = ssh.exec_command('curl -6 -s -o /dev/null -w "HTTP_%{http_code}" http://lvhuianquan.icu:3002/ 2>&1; echo', get_pty=True)
print('  Redirect:', stdout.read().decode('utf-8', errors='replace').strip())

# Certificate info
print('>>> Certificate info:')
stdin, stdout, stderr = ssh.exec_command('echo | openssl s_client -connect [2409:8a20:6611:ab90:d53d:2c5b:43ed:a661]:3001 -servername lvhuianquan.icu 2>/dev/null | openssl x509 -noout -subject -dates -issuer 2>&1', get_pty=True)
print(stdout.read().decode('utf-8', errors='replace'))

# Internal HTTP test (port 3000)
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "HTTP_%{http_code}" http://localhost:3000/api/health 2>&1; echo', get_pty=True)
print('  Internal health:', stdout.read().decode('utf-8', errors='replace').strip())

ssh.close()

print('\n' + '='*55)
print('  HTTPS: https://lvhuianquan.icu:3001')
print('  Redirect: http://lvhuianquan.icu:3002 → HTTPS')
print('  Internal: http://100.66.1.6:3000')
print('='*55)
