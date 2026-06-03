# 飞牛 NAS 部署指南

## 适用环境

- 飞牛 OS (fnOS) 0.8.x 及以上
- Docker 管理功能已启用
- NAS 内存 ≥ 2GB（推荐 4GB）

---

## 方式一：Docker Compose 部署（推荐）

### 步骤 1：准备项目文件

在电脑上下载项目代码，确保以下文件存在：

```
项目根目录/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── client/          # 前端代码
├── server/          # 后端代码
└── docs/            # 文档
```

> ⚠️ **不要**包含 `node_modules` 目录，Docker 构建时会自动安装依赖。

### 步骤 2：上传到飞牛 NAS

1. 在飞牛**文件管理**中，选择一个**非系统盘**的存储卷
2. 创建项目文件夹，路径示例：`/vol1/docker/occupational-health`
3. 将整个项目文件夹上传到该目录

最终目录结构：

```
/vol1/docker/occupational-health/
├── Dockerfile
├── docker-compose.yml
├── client/
├── server/
└── docs/
```

### 步骤 3：修改 docker-compose.yml

用飞牛文件管理器打开 `docker-compose.yml`，**修改以下内容**：

```yaml
version: '3.8'

services:
  occupational-health:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: occupational-health
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      # ⚠️ 务必修改为强随机密钥！可用以下命令生成：
      # openssl rand -hex 32
      - JWT_SECRET=你的强随机密钥至少32位字符
      - JWT_EXPIRES_IN=24h
      - UPLOAD_DIR=uploads/reports
      - MAX_FILE_SIZE=20971520
    volumes:
      # 冒号左侧改为飞牛上的实际路径
      # ⚠️ 只修改冒号左侧，右侧保持不变
      - /vol1/docker/occupational-health/data:/app/server/data
      - /vol1/docker/occupational-health/uploads:/app/server/uploads/reports
```

**必须修改**：
1. `JWT_SECRET` → 替换为强随机密钥
2. `volumes` 冒号左侧 → 替换为飞牛上的实际路径

**获取路径方法**：在飞牛文件管理器中，右键 `data` 文件夹 → **查看详细信息** → **复制原始路径**

### 步骤 4：配置 Docker 镜像源（重要！）

国内网络下 Docker 构建经常失败，需要先换镜像源：

1. 打开飞牛 **Docker 管理**
2. 点击 **镜像仓库** → **仓库设置**
3. 添加或替换为以下镜像源：
   - `https://docker.1ms.run`
   - `https://docker.1panel.live`
4. 重启 Docker 服务（Docker 面板右上角）

### 步骤 5：创建数据子目录

在项目目录下创建 `data` 和 `uploads` 子文件夹（与 `docker-compose.yml` 同级）：

```
/vol1/docker/occupational-health/
├── docker-compose.yml    ← 同级
├── data/                 ← 同级
├── uploads/              ← 同级
├── Dockerfile
├── client/
└── server/
```

### 步骤 6：构建并启动

1. 打开飞牛 **Docker 管理**
2. 点击 **创建项目**
3. 填写：
   - **项目名称**：`occupational-health`
   - **路径**：选择项目根文件夹 `/vol1/docker/occupational-health`（⚠️ 不是子文件夹）
4. 点击确定，等待镜像构建

> 构建时间约 3-10 分钟（取决于网络速度和 NAS 性能）。首次构建需下载 Node.js 基础镜像 + 安装依赖 + 编译 better-sqlite3。

### 步骤 7：验证运行

- 项目和容器状态显示**绿色** → 正常运行
- 点击容器右侧 `...` → **查看日志**，应看到：
  ```
  Server running on http://0.0.0.0:3001
  ```

### 步骤 8：访问系统

在浏览器中打开：

```
http://飞牛内网IP:3001
```

例如飞牛 IP 为 `192.168.1.100`，则访问 `http://192.168.1.100:3001`

---

## 方式二：预构建镜像部署（更简单）

如果 Docker 构建在飞牛上太慢或失败，可以在电脑上先构建好镜像，再导入飞牛。

### 在电脑上构建并导出

```bash
# 在项目根目录下构建
docker build -t occupational-health:latest .

# 导出为 tar 文件
docker save occupational-health:latest -o occupational-health.tar

# 传输到飞牛 NAS（通过 SMB 共享或 SCP）
# 将 occupational-health.tar 放到飞牛的某个目录
```

### 在飞牛上导入并运行

1. 打开飞牛 **Docker 管理** → **镜像** → **导入**
2. 选择 `occupational-health.tar` 文件，等待导入完成
3. 修改 `docker-compose.yml`，将 `build` 部分替换为 `image`：

```yaml
services:
  occupational-health:
    image: occupational-health:latest
    container_name: occupational-health
    # ... 其余配置不变
```

4. 按方式一的步骤 5-8 继续操作

---

## 初始化种子数据（可选）

系统首次启动时会自动创建数据库表结构。如需导入演示数据：

1. 在飞牛 Docker 管理中，点击容器的 **终端** 按钮
2. 执行：

```bash
cd /app/server
npm run seed
```

3. 默认账号：
   - 工厂账号：`factory1` / `password123`
   - 体检对接人：手机号 `13800000001` / 验证码 `123456`
   - C单位账号：`cunit1` / `password123`

---

## 数据备份

### 自动备份方案

1. 在飞牛**任务计划**中创建定时任务
2. 执行以下脚本：

```bash
#!/bin/bash
BACKUP_DIR="/vol1/docker/occupational-health/backups"
DB_FILE="/vol1/docker/occupational-health/data/occupational_health.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 使用 docker exec 执行 SQLite 在线备份
docker exec occupational-health sqlite3 /app/server/data/occupational_health.db \
  ".backup '/app/server/data/backup_${TIMESTAMP}.db'"

# 复制备份文件到备份目录
cp /vol1/docker/occupational-health/data/backup_${TIMESTAMP}.db \
   ${BACKUP_DIR}/backup_${TIMESTAMP}.db

# 删除容器内的临时备份
docker exec occupational-health rm /app/server/data/backup_${TIMESTAMP}.db

# 压缩备份
gzip ${BACKUP_DIR}/backup_${TIMESTAMP}.db

# 保留最近 30 天的备份
find ${BACKUP_DIR} -name "*.db.gz" -mtime +30 -delete
```

### 手动备份

直接在飞牛文件管理器中复制以下目录：
- `/vol1/docker/occupational-health/data/` → 数据库文件
- `/vol1/docker/occupational-health/uploads/` → 体检报告 PDF

---

## 更新部署

```bash
# 1. 拉取最新代码到项目目录
# 2. 在飞牛 Docker 管理中，停止并删除当前项目
# 3. 重新创建项目（会自动重新构建镜像）
```

或使用终端：

```bash
cd /vol1/docker/occupational-health
docker-compose down
docker-compose up -d --build
```

---

## 常见问题

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 构建失败/超时 | Docker 镜像源不可用 | 更换镜像源（见步骤 4），或使用方式二预构建 |
| `npm install` 报错 | better-sqlite3 编译失败 | 确保基础镜像包含 `python3 make g++`，Dockerfile 已包含 |
| 容器启动后立即退出 | JWT_SECRET 未设置 | 检查 docker-compose.yml 环境变量 |
| 页面刷新 404 | SPA 路由回退未生效 | 确认使用最新代码（index.js 已含 SPA fallback） |
| 上传文件失败 | uploads 目录权限不足 | 检查飞牛文件权限，确保 Docker 可写入 |
| 端口冲突 | 3001 端口被占用 | 修改 docker-compose.yml 中 `ports: "xxxx:3001"` |
| 构建太慢 | NAS 性能有限 | 使用方式二在电脑上预构建镜像 |

---

## 飞牛 NAS 硬件建议

| NAS 配置 | 适用场景 |
|---------|---------|
| 2核 ARM + 2GB | 5人以下轻量使用 |
| 4核 ARM/x86 + 4GB | 10-20 人日常使用 ✅ |
| 4核 x86 + 8GB+ | 30+ 人高频使用 |

> **注意**：如果 NAS 同时运行多个 Docker 容器（Jellyfin、Nextcloud 等），建议 4GB+ 内存。

---

## 网络访问扩展

### 内网访问（默认）

飞牛 NAS 在局域网内直接通过 IP:3001 访问即可。

### 外网访问（可选）

| 方案 | 说明 |
|------|------|
| 飞牛远程访问 | 飞牛自带远程访问功能，启用后可外网访问 |
| Tailscale | 安装 Tailscale Docker 容器组网，安全便捷 |
| FRP 内网穿透 | 需要有公网服务器做中转 |
| 路由器端口转发 | 路由器中转发 3001 端口，⚠️ 安全风险较高 |

> **强烈建议**：外网访问务必启用 HTTPS，防止 JWT Token 被窃听。
