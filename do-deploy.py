"""Upload V2 files to NAS and trigger Docker rebuild."""
import paramiko, os, tarfile, io, time, sys

HOST, PORT = "100.66.1.6", 6884
USER, PWD = "wuxiaojun66", "wu@xj123"
NAS = "/vol2/1000/ZY/occupational-health"
LOCAL = r"C:\Users\Administrator\WorkBuddy\2026-06-03-15-53-30"
SUDO = "echo wu@xj123 | sudo -S"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PWD, timeout=15)

def run(cmd, desc=""):
    if desc: print(f"\n>>> {desc}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    for line in out.strip().split("\n")[-12:]:
        print(f"  {line}")
    if err.strip():
        for line in err.strip().split("\n")[-2:]:
            print(f"  [e] {line[:200]}")
    return stdout.channel.recv_exit_status()

# Step 1: Check current state
print("=== Current NAS state ===")
run(f"ls {NAS}/server/routes/ 2>&1 || echo NO_ROUTES_DIR")

# Step 2: Build tar
print("\n=== Building archive ===")
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    tar.add(os.path.join(LOCAL, "Dockerfile"), "Dockerfile")
    tar.add(os.path.join(LOCAL, "docker-compose.yml"), "docker-compose.yml")
    # Server
    sd = os.path.join(LOCAL, "server")
    for root, dirs, files in os.walk(sd):
        dirs[:] = [d for d in dirs if d not in ("node_modules", "data", "uploads", "__pycache__")]
        for f in files:
            if f == "package-lock.json":
                continue
            full = os.path.join(root, f)
            arc = os.path.join("server", os.path.relpath(full, sd))
            tar.add(full, arc)
    # Client
    cd = os.path.join(LOCAL, "client")
    for root, dirs, files in os.walk(cd):
        dirs[:] = [d for d in dirs if d not in ("node_modules", "dist", "__pycache__")]
        for f in files:
            if f == "package-lock.json":
                continue
            full = os.path.join(root, f)
            arc = os.path.join("client", os.path.relpath(full, cd))
            tar.add(full, arc)

kb = buf.tell() / 1024
buf.seek(0)
print(f"  {kb:.0f} KB")

# Step 3: Upload
print("\n>>> Uploading...")
sftp = ssh.open_sftp()
sftp.putfo(buf, f"{NAS}/deploy.tar.gz")
sftp.close()
print("  Upload OK!")

# Step 4: Stop container
run(f"{SUDO} docker stop occupational-health 2>/dev/null; {SUDO} docker rm occupational-health 2>/dev/null || true", "Stop container")

# Step 5: Extract files
run(f"cd {NAS} && sudo rm -rf server client Dockerfile docker-compose.yml && tar xzf deploy.tar.gz && rm deploy.tar.gz", "Extract files")

# Step 6: Verify
run(f"ls {NAS}/server/routes/admin.js {NAS}/server/routes/dashboard.js {NAS}/server/repositories/userRepo.js && echo 'V2_FILES_OK'", "Verify V2 files")

# Step 7: Docker build
print("\n>>> Docker build (this will take 5-10 minutes)...")
ec = run(f"cd {NAS} && {SUDO} docker build --no-cache -t occupational-health . 2>&1", "Build")

if ec != 0:
    print("\n!!! Build failed. Check output above.")
    sys.exit(1)

# Step 8: Start
run(f"{SUDO} docker run -d --name occupational-health -p 3001:3001 -v {NAS}/data:/app/server/data --restart unless-stopped occupational-health", "Start container")

# Step 9: Wait and verify
time.sleep(8)
run(f"{SUDO} docker ps --filter name=occupational-health --format '{{{{.Names}}}} {{{{.Status}}}}'", "Container status")
run("curl -s -o /dev/null -w 'HTTP_%{http_code}' http://localhost:3001/; echo", "Health check")
run(f"{SUDO} docker logs --tail 10 occupational-health 2>&1", "Logs")

# Step 10: API test
print("\n>>> API test...")
run("curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}' | head -c 250", "Login test")

print("\n" + "=" * 55)
print("  DEPLOY COMPLETE!  http://100.66.1.6:3001")
print("  admin/admin123  factory1/123456")
print("  agent1/123456   cunit1/123456")
print("=" * 55)
ssh.close()
