# RedNote AI Studio

基于 React + NestJS + LangChain 的小红书内容生成工具。

## 项目结构

```
rednote/
├── rednote-ai-studio/          # 前端项目 (React + Vite)
│   ├── components/             # React 组件
│   ├── services/               # API 服务和工具
│   │   ├── geminiService.ts    # API 服务
│   │   ├── fingerprint.ts      # 浏览器指纹生成
│   │   └── db.ts               # IndexedDB 存储
│   ├── views/                  # 页面视图
│   │   ├── Generator.tsx       # 内容生成页面
│   │   ├── History.tsx         # 历史记录页面
│   │   └── Settings.tsx        # 设置页面
│   └── types.ts                # TypeScript 类型定义
│
├── rednote-backend/            # 后端项目 (NestJS + LangChain)
│   ├── src/
│   │   ├── health/             # 健康检查模块
│   │   ├── generate/           # 内容生成模块
│   │   ├── config-storage/     # 配置存储模块
│   │   ├── ai/                 # AI 服务模块
│   │   └── common/             # 公共接口和工具
│   ├── .env                    # 环境变量配置
│   └── README.md               # 后端详细文档
│
└── package.json                # 根目录配置 (启动脚本)
```

## 快速开始

### 前提条件

- Node.js (推荐 v18 或更高版本)
- npm 或 pnpm
- Google Gemini API Key 或 OpenAI API Key

### 1. 安装所有依赖

在根目录执行：

```bash
npm run install:all
```

这会安装根目录、前端和后端的所有依赖。

### 2. 配置环境变量

进入后端目录，配置 API 密钥：

```bash
cd rednote-backend
# 编辑 .env 文件，填入你的 API Key
```

`.env` 文件示例：

```env
PORT=3000
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. 同时启动前后端

回到根目录执行：

```bash
npm run dev
```

这会同时启动：
- 后端服务: http://localhost:3000
- 前端服务: http://localhost:5173

你会看到彩色的日志输出，分别显示后端和前端的运行状态。

## 可用命令

在根目录下可以使用以下命令：

### 开发环境

```bash
# 同时启动前后端开发服务器
npm run dev

# 单独启动后端
npm run dev:backend

# 单独启动前端
npm run dev:frontend
```

### 生产环境

```bash
# 构建所有项目
npm run build:all

# 单独构建后端
npm run build:backend

# 单独构建前端
npm run build:frontend

# 启动生产环境后端
npm run start:backend

# 预览生产环境前端
npm run start:frontend
```

### 依赖管理

```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

## 功能特性

### 前端 (rednote-ai-studio)

- 基于主题生成创意大纲
- 选择大纲生成配图和文案
- 历史记录管理
- 多模型支持（Gemini、GPT-4、DALL-E）
- 配置管理和云端同步
- 浏览器指纹识别（无需登录）

### 后端 (rednote-backend)

- NestJS 框架
- LangChain 集成
- 流式响应支持
- 多 AI 提供商支持
- 用户配置存储（基于浏览器指纹）
- RESTful API 设计

## 主要 API 接口

### 健康检查
```
GET http://localhost:3000/api/health
```

### 生成大纲
```
POST http://localhost:3000/api/generate/outline
```

### 生成内容
```
POST http://localhost:3000/api/generate/content
```

### 保存配置
```
POST http://localhost:3000/api/config/save
```

### 获取配置
```
GET http://localhost:3000/api/config/get?fingerprint=xxx
```

详细的 API 文档请查看 `rednote-backend/README.md`。

## 配置同步功能

本系统支持基于浏览器指纹的配置同步：

1. 打开设置页面，系统自动生成浏览器指纹
2. 配置 API Key 和其他设置
3. 点击保存，配置自动同步到服务端
4. 下次访问时自动加载配置

详细说明请查看 `rednote-backend/CONFIG_SYNC.md`。

## 开发说明

### 添加新的 AI 模型

1. 后端：在 `rednote-backend/src/ai/services/langchain.service.ts` 中添加新的模型配置
2. 前端：在 `rednote-ai-studio/types.ts` 的 `DEFAULT_MODELS` 中添加模型定义
3. 在设置页面测试连接

### 自定义提示词

提示词位于 `rednote-backend/src/ai/services/langchain.service.ts`：
- `generateOutlines()` - 大纲生成提示词
- `generateCaption()` - 文案生成提示词
- `generateImagePrompt()` - 图像提示词生成

### 修改界面样式

前端使用 Tailwind CSS，样式定义在各个组件文件中。主题色定义在 `rednote-ai-studio/index.css`。

## 故障排除

### 问题：前端无法连接后端

1. 确认后端服务正在运行
2. 检查后端地址配置（默认 http://localhost:3000）
3. 查看浏览器控制台的错误信息
4. 确认 CORS 配置正确

### 问题：API 调用失败

1. 检查 `.env` 文件中的 API Key 是否正确
2. 确认网络连接正常
3. 查看后端日志（`npm run dev:backend`）
4. 检查 API 配额是否用尽

### 问题：配置无法同步

1. 确认后端 `/api/config/save` 接口可访问
2. 查看浏览器控制台的指纹信息
3. 检查网络请求是否成功
4. 确认浏览器没有禁用 sessionStorage

### 问题：npm run dev 无法启动

1. 确认已安装所有依赖（`npm run install:all`）
2. 检查 Node.js 版本（需要 v18+）
3. 尝试分别启动前后端查看具体错误
4. 删除 node_modules 重新安装

## 性能优化建议

### 生产环境

1. **数据持久化**：将配置存储从内存迁移到 Redis 或 MongoDB
2. **图片存储**：使用对象存储服务（如 AWS S3、阿里云 OSS）
3. **缓存优化**：添加 Redis 缓存层
4. **日志管理**：集成日志服务（如 ELK、Sentry）
5. **负载均衡**：使用 Nginx 或云负载均衡器

### 安全性

1. **API 密钥加密**：对存储的 API Key 进行加密
2. **请求限流**：添加 rate limiting
3. **HTTPS**：在生产环境启用 HTTPS
4. **输入验证**：加强前后端输入验证
5. **用户认证**：考虑添加真正的用户系统

## 技术栈

### 前端
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (图标)
- IndexedDB (本地存储)

### 后端
- NestJS
- LangChain
- TypeScript
- @langchain/google-genai
- @langchain/openai
- class-validator

## 获取 API 密钥

- **Google Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持 Gemini 和 OpenAI 模型
- 实现基于浏览器指纹的配置同步
- 流式响应支持
- 完整的前后端集成
