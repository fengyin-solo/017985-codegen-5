## How to Run

1. 确保已安装 Docker 和 Docker Compose

2. 在项目根目录执行：
```bash
docker-compose up --build -d
```

3. 访问应用：
- 用户端: http://localhost:8081

4. 停止服务：
```bash
docker-compose down
```

## 离线单文件分发版

为不方便联网的斫琴师提供完全自包含的离线版本：所有 JS/CSS 内联进单个 HTML 文件，
**双击即可在浏览器中打开使用**，无需联网、无需安装任何依赖、无需启动服务器。

### 方式一：Docker 导出（推荐，可复现）

```bash
docker build --target offline --output type=local,dest=./offline-package ./frontend-user
```

产物在 `offline-package/` 目录：
- `index.html` —— 离线单文件应用（约 300KB，完全自包含）
- `test-guqin.wav` —— 测试音频（可选，用于验证功能）

将 `index.html` 拷贝到 U 盘/离线电脑，用浏览器直接打开即可。

### 方式二：本地构建

```bash
cd frontend-user
npm ci                  # 严格按锁文件安装，保证可复现
npm run build:offline   # 产出 frontend-user/dist-offline/
```

### 可复现与纯净性保证

- 所有依赖在 `package.json` 中固定为精确版本，并由 `package-lock.json` 锁定，`npm ci` 严格按锁文件安装
- 构建产物仅含静态文件：`.dockerignore` 排除了 `node_modules/`、构建缓存与本地产物，
  运行镜像（nginx）中不安装任何 npm 依赖，离线导出包基于 `scratch` 空镜像
- 构建脚本内置环境检查与产物校验，失败时会输出明确原因（Node 版本、锁文件缺失、内联未生效等）

## Services

| 服务名称 | 端口 | 描述 |
|---------|------|------|
| frontend-user | 8081 | 古琴音频分析软件用户端 |

> 端口与访问入口保持一致：本地开发（`npm run dev`）、本地预览（`npm run preview`）
> 与容器启动均为 **http://localhost:8081**；离线单文件版无需端口，直接打开 HTML 即可。

## 测试

### 测试音频

项目提供了测试音频文件 `frontend-user/public/test-guqin.wav`，可直接用于测试：
- 基频: 130.81 Hz (接近 C3)
- 时长: 3 秒
- 包含 13 次谐波，模拟古琴音色

### 功能测试

1. 上传音频文件
   - 支持 MP3、WAV、OGG 等常见音频格式
   - 文件大小建议不超过 10MB
   - 音频时长建议在 5 秒以内

2. 区间选择
   - 使用输入框精确输入起止时间（毫秒）
   - 使用滑块快速选择区间
   - 实时显示选中时长

3. 音频分析
   - 点击"分析音频"按钮开始分析
   - 自动检测基频
   - 显示最多 13 倍频

4. 图表验证
   - 波形图：显示选中区间的音频波形
   - 频谱图：显示基频和倍频的相对强度
   - 热力图：显示声强随时间的变化
   - 频率区域图：分别显示低频区、中频区、高频区

### 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

# 古琴音频分析软件

专为斫琴师设计的音频频谱分析工具，用于分析古琴音色的基频、倍频和声强变化。

## 功能特性

- **音频上传**：支持 MP3、WAV、OGG 等常见音频格式
- **精确截取**：以毫秒为单位精确选择分析区间
- **基频检测**：自动检测音频的基频
- **倍频分析**：显示最多 13 倍频，过滤其他频率
- **可视化图表**：
  - 波形图：显示音频波形
  - 频谱图：显示基频和倍频的强度分布
  - 热力图：显示声强随时间的变化
  - 频率区域图：分别显示低频区、中频区、高频区

## 技术栈

- 原生 JavaScript (ES6+)
- Web Audio API
- Chart.js
- Vite
- Nginx
- Docker

## 项目结构

```
├── frontend-user/          # 用户端前端项目
│   ├── src/
│   │   ├── modules/        # 功能模块
│   │   │   ├── audioAnalyzer.js   # 音频分析器
│   │   │   ├── chartManager.js    # 图表管理器
│   │   │   └── uiController.js    # UI 控制器
│   │   ├── utils/          # 工具函数
│   │   │   └── logger.js   # 日志工具
│   │   ├── styles/         # 样式文件
│   │   │   └── main.css    # 主样式
│   │   └── main.js         # 入口文件
│   ├── scripts/            # 构建脚本
│   │   ├── check-env.mjs        # 构建前环境检查
│   │   └── verify-offline.mjs   # 离线单文件产物校验
│   ├── index.html          # HTML 模板
│   ├── Dockerfile          # Docker 构建文件（含离线包导出阶段）
│   ├── .dockerignore       # 构建上下文排除（依赖/缓存/产物）
│   ├── nginx.conf          # Nginx 配置
│   ├── package.json        # 项目配置（依赖固定为精确版本）
│   ├── vite.config.js      # Vite 配置（Web 版）
│   └── vite.config.offline.js  # Vite 配置（离线单文件版）
├── docker-compose.yml      # Docker Compose 配置
├── .gitignore              # Git 忽略文件
└── README.md               # 项目说明
```

## 本地开发

```bash
cd frontend-user
npm install
npm run dev
```

访问 http://localhost:8081

## 频率区域说明

- **低频区**：基频 ~ 4倍频
- **中频区**：5倍频 ~ 8倍频
- **高频区**：9倍频 ~ 13倍频

这三个区域共享同一个基频，用于分析古琴音色在不同频率范围的特征。
