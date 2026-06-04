"""Deploy V2 to NAS — pre-built client + sudo docker."""
import paramiko, os, time, tarfile, io

HOST, PORT = "100.66.1.6", 6884
USER, PWD = "wuxiaojun66", "wu@xj123"
NAS = "/vol2/1000/ZY/occupational-health"
LOCAL = r"C:\Users\Administrator\WorkBuddy\2026-06-03-15-53-30"
SUDO = f"echo {PWD} | sudo -S"

def run(ssh, cmd, desc=""):
    if desc: print(f"\n>>> {desc}")
    print(f"    {cmd[:200]}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        for l in out.strip().split("\n")[-40:]:
            print(f"    {l}")
    if err.strip():
        e = err.strip().split("\n")
        for line in e[-3:]: print(f"    [stderr] {line[:200]}")
    return stdout.channel.recv_exit_status()

# Build archive
print(">>> Creating deploy archive...")
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    # Use NAS-optimized Dockerfile (no client build step)
    tar.add(os.path.join(LOCAL, "Dockerfile.nas"), "Dockerfile")
    tar.add(os.path.join(LOCAL, "docker-compose.yml"), "docker-compose.yml")
    
    # Server source
    sd = os.path.join(LOCAL, "server")
    for root, dirs, files in os.walk(sd):
        dirs[:] = [d for d in dirs if d not in ("node_modules","data","uploads","__pycache__")]
        for f in files:
            if f == "package-lock.json": continue
            full = os.path.join(root, f)
            arc = "server/" + os.path.relpath(full, sd).replace("\\", "/")
            tar.add(full, arc)
    
    # Pre-built client dist → will be server/public
    dist = os.path.join(LOCAL, "client", "dist")
    for root, dirs, files in os.walk(dist):
        for f in files:
            full = os.path.join(root, f)
            arc = "client/dist/" + os.path.relpath(full, dist).replace("\\", "/")
            tar.add(full, arc)

kb = buf.tell() / 1024
buf.seek(0)
print(f"Archive: {kb:.0f} KB")

# Connect
print(f"\n>>> SSH {USER}@{HOST}:{PORT}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PWD, timeout=15)
print("Connected!")

# Upload
print(">>> Uploading...")
sftp = ssh.open_sftp()
sftp.putfo(buf, f"{NAS}/deploy.tar.gz")
sftp.close()
print("Upload OK!")

# Stop old
run(ssh, f"{SUDO} docker stop occupational-health 2>/dev/null; {SUDO} docker rm occupational-health 2>/dev/null; echo cleaned", "Stop old container")

# Extract (preserve data dir)
run(ssh,
    f"cd {NAS} && "
    f"sudo rm -rf server client Dockerfile docker-compose.yml 2>/dev/null; "
    f"tar xzf deploy.tar.gz && rm deploy.tar.gz && "
    f"ls server/index.js client/dist/index.html Dockerfile && echo Extract_OK",
    "Extract files")

# Build Docker image
ec = run(ssh, f"cd {NAS} && {SUDO} docker build -t occupational-health . 2>&1", "Docker build")
if ec != 0:
    print("!!! BUILD FAILED, trying compose...")
    ec = run(ssh, f"cd {NAS} && {SUDO} docker compose build 2>&1", "Compose build")

# Start
run(ssh, f"cd {NAS} && {SUDO} docker compose up -d 2>&1", "Start container")

# Verify
time.sleep(6)
run(ssh, f"{SUDO} docker ps --filter name=occupational-health --format '{{{{.Names}}}} {{{{.Status}}}}'", "Container status")
run(ssh, "curl -s -o /dev/null -w 'HTTP_%{http_code}' http://localhost:3001/; echo", "Health check")
run(ssh, f"{SUDO} docker logs --tail 20 occupational-health 2>&1", "Container logs")

print("\n" + "="*55)
print("  DEPLOYED!  http://100.66.1.6:3001")
print("  admin/admin123  |  factory1/123456")
print("  agent1/123456   |  cunit1/123456")
print("="*55)
ssh.close()
