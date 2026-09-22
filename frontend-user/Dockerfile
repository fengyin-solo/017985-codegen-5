# 构建阶段
FROM --platform=$BUILDPLATFORM node:20.20-alpine3.21 AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（严格按 package-lock.json 中锁定的精确版本安装）
RUN npm ci --no-audit --no-fund

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段 - 使用 nginx 提供静态文件服务
FROM --platform=$TARGETPLATFORM nginx:1.27-alpine3.21

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 8081

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
