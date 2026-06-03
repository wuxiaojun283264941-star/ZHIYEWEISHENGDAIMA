# 职业健康体检管理平台 - 部署文档

## 1. 系统概述

| 项目 | 说明 |
|------|------|
| 项目名称 | 职业健康体检管理平台 (Occupational Health Examination Management System) |
| 架构 | 前后端一体部署（Fastify 同时服务 API 和前端静态文件） |
| 后端 | Fastify 4 + better-sqlite3 (Node.js 18+) |
| 前端 | React 18 + MUI 5 + Tailwind CSS (Vite 构建) |
| 数据库 | SQLite (文件型，无需独立数据库服务) |
| 默认端口 | 3001 |

---

## 2. 服务器配置要求

### 最低配置

| 项目 | 要求 |
|------|------|
| CPU | 1 核 |
| 内存 | 1 GB |
| 磁盘 | 20 GB SSD |
| 带宽 | 1 Mbps |
| 操作系统 | Ubuntu 22.04 LTS / CentOS 7+ / Debian 12 |

### 推荐配置

| 项目 | 要求 |
|------|------|
| CPU | 2 核 |
| 内存 | 2 GB |
| 磁盘 | 40 GB SSD |
| 带宽 | 3 Mbps |
| 操作系统 | Ubuntu 22.04 LTS |

### 腾讯云推荐方案

| 方案 | 配置 | 价格 | 适用场景 |
|------|------|------|---------|
| 入门型 2核2G3M | 2核/2GB/40GB SSD/3Mbps | ~68-79元/年 | 10人以下团队日常使用 |
| 标准型 4核4G3M | 4核/4GB/40GB SSD/3Mbps | ~79-112元/年 | 10-50人并发，PDF上传频繁 |

> 腾讯云轻量应用服务器购买地址：https://cloud.tencent.com/product/lighthouse

---

## 3. 部署步骤

### 3.1 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证版本
node -v   # 应输出 v20.x.x
npm -v    # 应输出 10.x.x

# 安装构建工具（better-sqlite3 原生编译需要）
sudo apt install -y build-essential python3

# 安装 Git
sudo apt install -y git

# 安装进程管理器
sudo npm install -g pm2
```

### 3.2 获取代码

```bash
# 创建应用目录
sudo mkdir -p /opt/occupational-health
sudo chown $USER:$USER /opt/occupational-health
cd /opt/occupational-health

# 方式一：从 Git 仓库拉取（推荐）
git clone <你的仓库地址> .

# 方式二：从本地上传
# 在本地打包（排除 node_modules）
# tar -czf project.tar.gz --exclude=node_modules --exclude=dist .
# scp project.tar.gz user@服务器IP:/opt/occupational-health/
# 在服务器上解压
# tar -xzf project.tar.gz
```

### 3.3 安装依赖 & 构建

```bash
# 安装服务端依赖
cd /opt/occupational-health/server
npm install

# 安装客户端依赖并构建
cd /opt/occupational-health/client
npm install
npm run build
```

### 3.4 配置环境变量

```bash
# 编辑服务端环境变量
cd /opt/occupational-health/server
cp .env .env.production
nano .env.production
```

`.env.production` 内容：

```env
# 服务端口
PORT=3001

# JWT 配置（务必修改为随机强密钥）
JWT_SECRET=你的随机密钥-至少32位-建议用openssl生成
JWT_EXPIRES_IN=24h

# 文件上传
UPLOAD_DIR=uploads/reports
MAX_FILE_SIZE=20971520

# 数据库路径（默认即可，数据库会自动创建）
# DB_PATH=./data/occupational_health.db
```

生成安全的 JWT 密钥：

```bash
openssl rand -hex 32
# 输出示例：a1b2c3d4e5f6...64位十六进制字符串
```

### 3.5 初始化数据库

```bash
cd /opt/occupational-health/server

# 方式一：启动服务时自动创建表结构（首次运行自动执行）
# 数据库文件会自动创建在 server/data/occupational_health.db

# 方式二：使用种子数据初始化（可选，用于演示/测试）
npm run seed
```

### 3.6 配置前端静态文件服务

将前端构建产物复制到服务端静态目录：

```bash
# 创建静态文件目录
mkdir -p /opt/occupational-health/server/public

# 复制构建产物
cp -r /opt/occupational-health/client/dist/* /opt/occupational-health/server/public/
```

修改 `server/index.js`，添加前端静态文件服务（在已有静态文件服务之后添加）：

```javascript
// 在现有 staticPlugin 注册之后添加：

import staticPlugin from '@fastify/static';
// ... 已有代码 ...

// 服务前端构建产物
const publicDir = path.join(__dirname, 'public');
await app.register(staticPlugin, {
  root: publicDir,
  prefix: '/',
  decorateReply: false
});

// SPA 回退：所有未匹配的路由返回 index.html
app.setNotFoundHandler((request, reply) => {
  if (!request.url.startsWith('/api') && !request.url.startsWith('/uploads')) {
    return reply.sendFile('index.html');
  }
  return reply.code(404).send({ code: 1, message: 'Not Found' });
});
```

> **注意**：上述代码需由工程师集成到项目中。当前架构下，也可以使用 Nginx 反向代理方式（见 3.8），无需修改服务端代码。

### 3.7 使用 PM2 启动服务

```bash
cd /opt/occupational-health/server

# 创建 PM2 配置文件
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'occupational-health',
    script: 'index.js',
    cwd: '/opt/occupational-health/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/opt/occupational-health/logs/error.log',
    out_file: '/opt/occupational-health/logs/out.log',
    merge_logs: true
  }]
};
EOF

# 创建日志目录
mkdir -p /opt/occupational-health/logs

# 启动服务
pm2 start ecosystem.config.cjs

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs occupational-health
```

### 3.8 Nginx 反向代理（推荐）

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/occupational-health
```

Nginx 配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # 前端静态文件
    root /opt/occupational-health/client/dist;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 文件上传超时设置
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        client_max_body_size 20M;
    }

    # 上传文件访问代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
```

启用配置并重启 Nginx：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/occupational-health /etc/nginx/sites-enabled/

# 删除默认站点（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 3.9 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（需先将域名解析到服务器 IP）
sudo certbot --nginx -d your-domain.com

# 证书自动续期已由 certbot timer 管理
sudo certbot renew --dry-run
```

---

## 4. 目录结构

```
/opt/occupational-health/
├── server/                         # 后端代码
│   ├── index.js                    # 入口文件
│   ├── .env                        # 环境变量
│   ├── package.json
│   ├── data/
│   │   └── occupational_health.db  # SQLite 数据库文件
│   ├── uploads/
│   │   └── reports/                # 上传的体检报告 PDF
│   ├── routes/                     # API 路由
│   ├── services/                   # 业务逻辑
│   ├── repositories/               # 数据访问层
│   ├── middleware/                  # 中间件
│   ├── utils/                      # 工具函数
│   └── db/                         # 数据库初始化 & 种子数据
├── client/                         # 前端代码
│   ├── dist/                       # 构建产物（Nginx 直接服务）
│   └── src/
├── logs/                           # PM2 日志
└── ecosystem.config.cjs            # PM2 配置
```

---

## 5. 运维操作

### 日常管理

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs occupational-health

# 重启服务
pm2 restart occupational-health

# 停止服务
pm2 stop occupational-health
```

### 更新部署

```bash
cd /opt/occupational-health

# 拉取最新代码
git pull origin main

# 更新后端依赖
cd server && npm install --production

# 构建前端
cd ../client && npm install && npm run build

# 重启服务
pm2 restart occupational-health
```

### 数据库备份

```bash
# 手动备份（SQLite 在线备份命令）
sqlite3 /opt/occupational-health/server/data/occupational_health.db ".backup /opt/occupational-health/backups/backup_$(date +%Y%m%d_%H%M%S).db"

# 创建自动备份脚本
mkdir -p /opt/occupational-health/backups

cat > /opt/occupational-health/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/occupational-health/backups"
DB_FILE="/opt/occupational-health/server/data/occupational_health.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.db"

# 使用 SQLite 内置备份（安全，不锁表）
sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"

# 压缩备份
gzip "$BACKUP_FILE"

# 保留最近 30 天的备份
find "$BACKUP_DIR" -name "*.db.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x /opt/occupational-health/backup.sh

# 添加定时任务（每天凌晨 2 点自动备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/occupational-health/backup.sh >> /opt/occupational-health/logs/backup.log 2>&1") | crontab -
```

### 上传文件备份

```bash
# 备份上传的 PDF 报告
tar -czf /opt/occupational-health/backups/reports_$(date +%Y%m%d).tar.gz \
  /opt/occupational-health/server/uploads/reports/
```

### 磁盘空间监控

```bash
# 查看磁盘使用
df -h

# 查看上传目录大小
du -sh /opt/occupational-health/server/uploads/reports/

# 查看数据库大小
du -sh /opt/occupational-health/server/data/
```

---

## 6. 安全加固

### 防火墙配置

```bash
# 使用 UFW 防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh          # 22 端口
sudo ufw allow http        # 80 端口
sudo ufw allow https       # 443 端口
sudo ufw enable

# 不要开放 3001 端口（通过 Nginx 反向代理访问）
```

### 系统安全

```bash
# 禁用 root SSH 登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 创建专用部署用户（可选）
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
```

### 应用安全

- **JWT 密钥**：生产环境务必使用强随机密钥，禁止使用默认值
- **CORS 配置**：生产环境建议限制 `origin` 为具体域名
- **文件上传**：当前已限制仅接受 PDF 格式，单文件最大 20MB
- **HTTPS**：强烈建议启用 HTTPS，防止 JWT Token 被窃听

---

## 7. 性能调优

### SQLite 优化

当前已启用 WAL 模式（Write-Ahead Logging），支持并发读取。如需进一步优化：

```javascript
// 在 db/init.js 中可添加以下配置
db.pragma('cache_size = -64000');   // 64MB 缓存
db.pragma('busy_timeout = 5000');    // 忙等待 5 秒
```

### 并发能力

| 配置 | 预估并发 |
|------|---------|
| 2核2G | 同时在线 ~30 人 |
| 4核4G | 同时在线 ~80 人 |

> SQLite 适合中小规模使用。如果同时在线超过 50 人且写入频繁，建议迁移至 PostgreSQL。

### 磁盘空间规划

| 数据类型 | 单条大小 | 1000 条估算 | 10000 条估算 |
|---------|---------|-----------|------------|
| 员工记录 | ~0.5 KB | 0.5 MB | 5 MB |
| 体检报告 PDF | ~2 MB | 2 GB | 20 GB |
| 数据库文件 | - | ~5 MB | ~50 MB |

> **关键**：PDF 报告是磁盘消耗大户。建议 40GB SSD 起，并定期归档旧报告。

---

## 8. 故障排查

### 常见问题

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| `NOT NULL constraint failed` | 参数命名不一致 | 确保 snake_case/camelCase 映射正确 |
| `SqliteError: SQLITE_BUSY` | 数据库并发写入冲突 | 检查是否有多个进程访问同一 DB 文件 |
| `FOREIGN KEY constraint failed` | 外键引用不存在 | 检查关联记录是否已删除 |
| 上传文件 413 错误 | Nginx 限制请求体大小 | 在 Nginx 配置中设置 `client_max_body_size 20M` |
| 页面刷新 404 | Nginx 未配置 SPA 回退 | 确保 `try_files $uri $uri/ /index.html` 存在 |
| PM2 启动失败 | better-sqlite3 原生绑定 | 在服务器上重新 `npm install`（不要从本地上传 node_modules） |

### 日志查看

```bash
# 应用日志
pm2 logs occupational-health --lines 100

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# PM2 日志文件
tail -f /opt/occupational-health/logs/error.log
```

---

## 9. 快速部署脚本（一键版）

> ⚠️ 适用于全新 Ubuntu 22.04 服务器，请先修改脚本中的变量

```bash
#!/bin/bash
set -e

# ============ 配置区 ============
PROJECT_DIR="/opt/occupational-health"
REPO_URL="你的Git仓库地址"    # 修改此处
BRANCH="main"
JWT_SECRET=$(openssl rand -hex 32)  # 自动生成
# ================================

echo ">>> 1/7 更新系统 & 安装依赖..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential python3 git nginx sqlite3
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

echo ">>> 2/7 获取代码..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR
git clone -b $BRANCH $REPO_URL .

echo ">>> 3/7 安装服务端依赖..."
cd $PROJECT_DIR/server
npm install --production

echo ">>> 4/7 构建前端..."
cd $PROJECT_DIR/client
npm install
npm run build

echo ">>> 5/7 配置环境变量..."
cd $PROJECT_DIR/server
cat > .env << EOF
PORT=3001
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
UPLOAD_DIR=uploads/reports
MAX_FILE_SIZE=20971520
EOF

mkdir -p $PROJECT_DIR/logs $PROJECT_DIR/backups

echo ">>> 6/7 配置 PM2..."
cd $PROJECT_DIR/server
cat > ecosystem.config.cjs << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'occupational-health',
    script: 'index.js',
    cwd: '/opt/occupational-health/server',
    env: { NODE_ENV: 'production', PORT: 3001 },
    instances: 1,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/opt/occupational-health/logs/error.log',
    out_file: '/opt/occupational-health/logs/out.log',
    merge_logs: true
  }]
};
EOFPM2

pm2 start ecosystem.config.cjs
pm2 startup
pm2 save

echo ">>> 7/7 配置 Nginx..."
sudo tee /etc/nginx/sites-available/occupational-health > /dev/null << 'EOFNGINX'
server {
    listen 80;
    server_name _;

    root /opt/occupational-health/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        client_max_body_size 20M;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
EOFNGINX

sudo ln -sf /etc/nginx/sites-available/occupational-health /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx && sudo systemctl enable nginx

echo ""
echo "========================================="
echo "  部署完成！"
echo "  访问地址: http://服务器IP"
echo "  JWT 密钥已自动生成并写入 .env"
echo "  默认种子数据: npm run seed (在 server 目录下)"
echo "========================================="
```

---

## 10. 生产环境 Checklist

- [ ] 修改 JWT_SECRET 为强随机密钥
- [ ] 配置 HTTPS（Certbot / 自定义证书）
- [ ] 配置防火墙（仅开放 22/80/443）
- [ ] 配置数据库自动备份（crontab）
- [ ] 配置 PM2 进程守护 & 开机自启
- [ ] 修改 CORS origin 为具体域名
- [ ] 设置日志轮转（PM2 logrotate 或 logrotate）
- [ ] 接入真实短信服务（替换 Mock 实现）
- [ ] 监控磁盘空间（PDF 报告持续增长）
- [ ] 配置 Nginx 访问日志轮转
