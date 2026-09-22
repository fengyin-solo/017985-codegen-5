# syntax=docker/dockerfile:1

# ============================================================
# 构建阶段：固定依赖版本，产出 Web 版与离线单文件版静态包
# ============================================================
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# 仅复制依赖清单，npm ci 严格按 package-lock.json 安装（可复现）
# lockfile 与 package.json 不一致时 npm ci 会直接报错并指出冲突依赖
COPY package.json package-lock.json ./

# npm 缓存挂载在构建期之外，不进入任何镜像层
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund || { \
      echo '=========================================='; \
      echo '依赖安装失败，常见原因：'; \
      echo '  1. package-lock.json 与 package.json 不一致 -> 本地执行 npm install 同步锁文件'; \
      echo '  2. 网络无法访问 npm registry -> 检查网络或配置镜像源'; \
      echo '=========================================='; \
      exit 1; \
    }

# 复制源代码（.dockerignore 已排除 node_modules / dist / 缓存）
COPY . .

# 构建 Web 版（dist/）与离线单文件版（dist-offline/），构建脚本内含产物校验
RUN npm run build:all || { \
      echo '=========================================='; \
      echo '前端构建失败，请根据上方日志定位：'; \
      echo '  - 环境检查失败：Node 版本需 >= 20，且依赖需用 npm ci 安装'; \
      echo '  - vite 编译错误：检查报错对应的源文件'; \
      echo '  - 离线产物校验失败：dist-offline/index.html 未完全自包含'; \
      echo '=========================================='; \
      exit 1; \
    }

# ============================================================
# 离线单文件分发包：仅含静态产物，无任何依赖与构建缓存
# 导出方式（BuildKit）：
#   docker build --target offline --output type=local,dest=./offline-package ./frontend-user
# 导出后 offline-package/index.html 双击即可离线打开使用
# ============================================================
FROM scratch AS offline
COPY --from=builder /app/dist-offline /

# ============================================================
# 运行阶段：nginx 仅提供静态文件，不安装任何 npm 依赖
# ============================================================
FROM --platform=$TARGETPLATFORM nginx:1.27-alpine

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制 Web 版构建产物（纯静态文件）
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口（与本地开发端口 8081 保持一致）
EXPOSE 8081

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
