# 职业健康体检管理平台

> Occupational Health Examination Management System

职业健康体检全流程数字化管理平台，覆盖工厂、体检对接人、C单位三方协作场景。

## 功能概览

- **工厂端**：员工管理、对接人管理、体检任务推送与跟踪
- **体检对接人端**：任务拉取、报告上传、任务完成确认
- **C单位端**：员工体检报告查询与查看

## 技术栈

- 后端：Fastify 4 + better-sqlite3 (Node.js 18+)
- 前端：React 18 + MUI 5 + Tailwind CSS + Vite
- 数据库：SQLite (WAL 模式)
- 认证：JWT + bcryptjs + 角色权限控制

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/你的用户名/occupational-health.git
cd occupational-health

# 服务端
cd server
npm install
cp .env.example .env
# 编辑 .env 修改 JWT_SECRET
node index.js

# 客户端（开发模式）
cd ../client
npm install
npm run dev
```

### 初始化种子数据

```bash
cd server
npm run seed
```

默认账号：
- 工厂：`factory1` / `password123`
- 体检对接人：手机号 `13800000001` / 验证码 `123456`
- C单位：`cunit1` / `password123`

### 生产构建

```bash
# 构建前端
cd client && npm run build

# 启动服务（自动服务前端静态文件）
cd ../server && node index.js
```

## Docker 部署

```bash
# 使用 Docker Compose 一键启动
docker-compose up -d

# 访问 http://localhost:3001
```

详细部署文档：
- [云服务器部署指南](docs/deployment.md)
- [飞牛 NAS 部署指南](docs/deployment-fnnas.md)

## 项目结构

```
├── server/                 # 后端
│   ├── index.js            # 入口
│   ├── routes/             # API 路由
│   ├── services/           # 业务逻辑
│   ├── repositories/       # 数据访问层
│   ├── middleware/         # 认证 & 权限
│   ├── db/                 # 数据库初始化 & 种子
│   └── utils/              # 工具函数
├── client/src/             # 前端
│   └── pages/              # 三种角色页面
├── docs/                   # 文档
├── Dockerfile
└── docker-compose.yml
```

## License

Private - All rights reserved
