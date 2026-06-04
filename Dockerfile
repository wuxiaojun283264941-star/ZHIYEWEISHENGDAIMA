# ===== 构建阶段 =====
FROM node:20-alpine AS builder

WORKDIR /app

# 复制客户端代码并构建
COPY client/package.json client/package-lock.json* ./client/
WORKDIR /app/client
RUN npm install
COPY client/ .
RUN npm run build

# ===== 运行阶段 =====
FROM node:20-alpine

# 替换 Alpine 软件源为国内镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装 better-sqlite3 编译依赖
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制服务端代码并安装依赖
COPY server/package.json server/package-lock.json* ./server/
WORKDIR /app/server
RUN npm install --production

# 复制服务端源码
COPY server/ .

# 从构建阶段复制前端产物
COPY --from=builder /app/client/dist ./public

# 创建数据目录和上传目录
RUN mkdir -p /app/server/data /app/server/uploads/reports

# 环境变量（可通过 docker-compose 或 -e 覆盖）
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

# 启动服务
CMD ["node", "index.js"]
