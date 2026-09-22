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

## Services

| 服务名称 | 端口 | 描述 |
|---------|------|------|
| frontend-user | 8081 | 古琴音频分析软件用户端 |

## 离线单文件分发版（推荐给不能连网的斫琴师）

离线版本在**构建阶段**把全部 JavaScript、CSS（含 Chart.js）内联进**唯一一个**
`index.html`；运行阶段只有这一个静态文件，**无需安装任何软件、无需联网**，
拷到 U 盘里双击即可用浏览器打开。

### 制作离线包（需要在有网络的机器上执行一次）

依赖版本全部固定（精确版本 + `package-lock.json` 完整性校验），构建可复现：

```bash
cd frontend-user
npm ci              # 严格按 lockfile 安装，仅构建时需要
npm run package:offline
```

产物：

- `frontend-user/dist-offline/index.html` —— 自包含单文件，可直接双击打开
- `frontend-user/release/guqin-audio-analyzer-offline-<版本号>.zip` —— 分发包
  （内含 `index.html` 和 `README.txt`，由 Node 内置库零依赖打包）

构建脚本会校验产物：必须只有一个 `index.html`、无任何外部（http/相对文件）
资源引用、JS/CSS 均已内联；校验不通过或构建出错时会打印**明确的失败原因**
并以非零状态退出。

### 分发给离线用户

把 zip 拷贝到离线电脑（U 盘均可），解压后双击 `index.html`，
用 Chrome / Edge / Firefox / Safari 打开即可。所有音频分析都在本机浏览器内完成。

### 用容器运行离线版（端口与入口不变）

离线镜像为多阶段构建：构建阶段用固定版本的 Node 镜像产出单文件；
运行阶段基于 `nginx:1.27-alpine`，镜像内**只有静态 index.html**，
不含 Node、`node_modules`、构建缓存或开发依赖：

```bash
docker compose -f docker-compose.offline.yml up --build -d
```

访问入口与本地开发、在线版容器完全一致：**http://localhost:8081**
（8081 端口同一时间只能启动一个版本，离线版与在线版二选一即可）。

离线镜像也可导出后搬到无网机器加载：

```bash
docker compose -f docker-compose.offline.yml build
docker save guqin-audio-analyzer-offline:1.0.0 | gzip > offline-image.tar.gz
# 拷贝到离线机器后：
docker load < offline-image.tar.gz && docker compose -f docker-compose.offline.yml up -d
```

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
│   ├── index.html          # HTML 模板
│   ├── Dockerfile          # 在线版 Docker 构建文件
│   ├── Dockerfile.offline  # 离线单文件版 Docker 构建（运行层仅静态文件）
│   ├── nginx.conf          # 在线版 Nginx 配置
│   ├── nginx-offline.conf  # 离线版 Nginx 配置（同样监听 8081）
│   ├── package.json        # 项目配置（依赖版本全部固定）
│   ├── vite.config.js      # Vite 配置（本地开发 / 普通构建）
│   ├── vite.config.offline.js  # 离线单文件构建配置（资源全部内联）
│   └── scripts/            # 离线构建与打包脚本
│       ├── build-offline.mjs    # 构建 + 产物校验，失败给出明确原因
│       └── package-offline.mjs  # 零依赖生成可分发 zip
├── docker-compose.yml          # 在线版 Docker Compose
├── docker-compose.offline.yml  # 离线版 Docker Compose（同为 8081 端口）
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
