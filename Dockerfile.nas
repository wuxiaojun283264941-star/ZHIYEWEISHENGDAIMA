# NAS 生产 Dockerfile — 前端已在本地预构建
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

# 复制预构建的前端产物
COPY client/dist ./public

# 创建数据目录和上传目录
RUN mkdir -p /app/server/data /app/server/uploads/reports

# 环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "index.js"]
