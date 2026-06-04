"""Deploy V2 to NAS — full redeploy"""
import paramiko, os, time, tarfile, io

HOST, PORT = "100.66.1.6", 6884
USER, PWD = "wuxiaojun66", "wu@xj123"
NAS = "/vol2/1000/ZY/occupational-health"
LOCAL = r"C:\Users\Administrator\WorkBuddy\2026-06-03-15-53-30"
SUDO = f"echo {PWD} | sudo -S"

def run(ssh, cmd, desc=""):
    if desc:
        print(f"\n>>> {desc}")
    print(f"    CMD: {cmd[:150]}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    if out.strip():
        for l in out.strip().split("\n")[-20:]:
            print(f"    {l}")
    return stdout.channel.recv_exit_status()

# Build archive
print(">>> Creating deploy archive...")
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    # NAS-optimized Dockerfile
    tar.add(os.path.join(LOCAL, "Dockerfile.nas"), "Dockerfile")
    tar.add(os.path.join(LOCAL, "docker-compose.yml"), "docker-compose.yml")

    dot_dockerignore = os.path.join(LOCAL, ".dockerignore")
    if os.path.exists(dot_dockerignore):
        tar.add(dot_dockerignore, ".dockerignore")

    # Server source (exclude node_modules, data, uploads, test)
    sd = os.path.join(LOCAL, "server")
    for root, dirs, files in os.walk(sd):
        dirs[:] = [d for d in dirs if d not in ("node_modules", "data", "uploads", "__pycache__", "test")]
        for f in files:
            if f == "package-lock.json":
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, sd)
            arc = "server/" + rel.replace("\\", "/")
            tar.add(full, arc)

    # Pre-built client dist
    dist_dir = os.path.join(LOCAL, "client", "dist")
    for root, dirs, files in os.walk(dist_dir):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, dist_dir)
            arc = "client/dist/" + rel.replace("\\", "/")
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

# Stop old container
run(ssh, f"{SUDO} docker stop occupational-health 2>/dev/null; {SUDO} docker rm occupational-health 2>/dev/null; echo cleaned", "Stop old container")

# Upload
print("\n>>> Uploading...")
sftp = ssh.open_sftp()
sftp.putfo(buf, f"{NAS}/deploy.tar.gz")
sftp.close()
print("Upload OK!")

# Clean old files and extract
run(ssh,
    f"cd {NAS} && "
    f"rm -rf server client Dockerfile docker-compose.yml .dockerignore 2>/dev/null; "
    f"tar xzf deploy.tar.gz && rm deploy.tar.gz && "
    f"echo '=== Verify ===' && "
    f"ls -la server/index.js client/dist/index.html Dockerfile && echo Extract_OK",
    "Extract files")

# Verify Dockerfile content
run(ssh, f"head -5 {NAS}/Dockerfile", "Verify Dockerfile (should be NAS version)")

# Build Docker image (no-cache for V2)
print("\n>>> Docker build (this may take 3-5 min for better-sqlite3)...")
ec = run(ssh, f"cd {NAS} && {SUDO} docker build --no-cache -t occupational-health . 2>&1", "Docker build")

if ec != 0:
    print("!!! BUILD FAILED, retrying with cache...")
    ec = run(ssh, f"cd {NAS} && {SUDO} docker build -t occupational-health . 2>&1", "Retry build (with cache)")

# Start
run(ssh, f"cd {NAS} && {SUDO} docker compose up -d 2>&1", "Start container")

# Wait and verify
time.sleep(8)
run(ssh, f'{SUDO} docker ps --filter name=occupational-health --format "table {{{{.Names}}}}\t{{{{.Status}}}}\t{{{{.Ports}}}}"', "Container status")
run(ssh, 'curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3001/; echo', "Health check")
run(ssh, f"{SUDO} docker logs --tail 25 occupational-health 2>&1", "Container logs")

print("\n" + "=" * 55)
print("  DEPLOYED!  http://100.66.1.6:3001")
print("  admin/admin123  |  factory1/123456")
print("  agent1/123456   |  cunit1/123456")
print("=" * 55)
ssh.close()
