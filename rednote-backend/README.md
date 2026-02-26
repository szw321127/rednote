# RedNote AI Studio Backend

基于 NestJS + LangChain 的小红书内容生成后端服务。

## 功能特性

- 根据主题生成创意大纲（支持流式响应）
- 根据大纲生成配图和文案
- 支持多个 AI 模型提供商：
  - Google Gemini (文本生成)
  - OpenAI GPT-4 (文本生成)
  - DALL-E 3 (图像生成)
- 集成 LangChain 框架
- RESTful API 设计
- CORS 支持
- **用户配置同步**（基于浏览器指纹）

## 技术栈

- **框架**: NestJS
- **AI 集成**: LangChain, @langchain/google-genai, @langchain/openai
- **语言**: TypeScript
- **验证**: class-validator, class-transformer

## 项目结构

```
rednote-backend/
├── src/
│   ├── main.ts                      # 应用入口
│   ├── app.module.ts                # 根模块
│   ├── health/                      # 健康检查模块
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── generate/                    # 生成模块
│   │   ├── generate.controller.ts
│   │   ├── generate.service.ts
│   │   ├── generate.module.ts
│   │   └── dto/
│   │       ├── generate-outline.dto.ts
│   │       └── generate-content.dto.ts
│   ├── config-storage/              # 用户配置存储模块
│   │   ├── config-storage.controller.ts
│   │   ├── config-storage.service.ts
│   │   ├── config-storage.module.ts
│   │   └── dto/
│   │       ├── save-config.dto.ts
│   │       └── get-config.dto.ts
│   ├── ai/                          # AI 服务模块
│   │   ├── ai.module.ts
│   │   └── services/
│   │       ├── langchain.service.ts  # LangChain 集成
│   │       └── image.service.ts      # 图像生成服务
│   └── common/
│       └── interfaces/
│           ├── outline.interface.ts
│           ├── model-config.interface.ts
│           └── user-config.interface.ts
├── .env                             # 环境变量
├── .env.example                     # 环境变量示例
├── CONFIG_SYNC.md                   # 配置同步功能说明
└── package.json
```

## 安装

```bash
# 安装依赖
npm install
```

## 配置

1. 复制 `.env.example` 到 `.env`
2. 填写你的 API 密钥：

```env
# Server Configuration
PORT=3000

# Google Gemini API Key
GOOGLE_API_KEY=your_google_api_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Required secrets (>= 32 chars, defaults are rejected)
JWT_SECRET=replace-with-a-random-32-plus-character-secret
SESSION_SECRET=replace-with-another-random-32-plus-character-secret

# Optional additional trusted AI hosts (comma-separated)
# Defaults already include: api.openai.com, generativelanguage.googleapis.com
AI_BASE_URL_ALLOWLIST=
```

### 获取 API 密钥

- **Google Gemini**: 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
- **OpenAI**: 访问 [OpenAI Platform](https://platform.openai.com/api-keys)

## 运行

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务将运行在 `http://localhost:3000`

## API 接口

### 1. 健康检查

```http
GET /api/health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "rednote-backend"
}
```

### 2. 生成大纲（流式响应）

```http
POST /api/generate/outline
Content-Type: application/json
```

**请求体**:
```json
{
  "topic": "春日穿搭指南",
  "modelConfig": {
    "provider": "google",
    "modelName": "gemini-2.5-flash",
    "apiKey": "optional_override_key"
  },
  "parameters": {
    "temperature": 0.7,
    "topP": 0.95
  }
}
```

**响应**: 流式文本（包含 JSON 数组）

### 3. 生成图片和文案

```http
POST /api/generate/content
Content-Type: application/json
```

**请求体**:
```json
{
  "outline": {
    "title": "春日清新穿搭",
    "content": "适合春天的清新穿搭方案",
    "emoji": "🌸",
    "tags": ["穿搭", "春天", "时尚"]
  },
  "textModelConfig": {
    "provider": "google",
    "modelName": "gemini-2.5-flash"
  },
  "imageModelConfig": {
    "provider": "openai",
    "modelName": "dall-e-3"
  }
}
```

**响应示例**:
```json
{
  "imageUrl": "https://...",
  "caption": "生成的文案内容..."
}
```

### 4. 保存用户配置（需要登录）

```http
POST /api/config/save
Authorization: Bearer <access_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "config": {
    "backendUrl": "http://localhost:3000",
    "activeTextModelId": "default-gemini",
    "activeImageModelId": "default-image",
    "models": [...],
    "temperature": 0.7,
    "topP": 0.95
  }
}
```

> 配置按 `userId` 隔离存储，不再通过 fingerprint 读取他人配置。

### 5. 获取当前用户配置（需要登录）

```http
GET /api/config/get
Authorization: Bearer <access_token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "Configuration retrieved successfully",
  "config": {
    "backendUrl": "http://localhost:3000",
    "models": [
      {
        "id": "default-gemini",
        "name": "gemini",
        "displayName": "Gemini"
      }
    ],
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

> 出于安全考虑，接口返回会移除 `models[*].apiKey`。

### 6. 配置统计（需要登录）

```http
GET /api/config/stats
Authorization: Bearer <access_token>
```

**响应示例**:
```json
{
  "totalConfigs": 5,
  "message": "Currently storing 5 user configuration(s)"
}
```

## 用户配置同步说明

配置同步已改为**登录态绑定（userId）**，防止通过 fingerprint 枚举读取配置。前端可继续保留本地 IndexedDB 做离线缓存，在线时将配置同步到当前登录用户。

## 与前端集成

1. 确保前端项目 `rednote-ai-studio` 的 `types.ts` 中 `backendUrl` 设置为：
```typescript
backendUrl: 'http://localhost:3000'
```

2. 启动后端服务：
```bash
cd rednote-backend
npm run start:dev
```

3. 启动前端服务：
```bash
cd rednote-ai-studio
npm run dev
```

## 开发说明

### 添加新的 AI 提供商

1. 在 `src/ai/services/langchain.service.ts` 中添加新的模型配置逻辑
2. 更新 `getModel()` 方法以支持新的提供商
3. 在 `.env` 中添加相应的 API 密钥配置

### 自定义提示词

提示词位于 `src/ai/services/langchain.service.ts` 中的各个生成方法：
- `generateOutlines()` - 大纲生成提示词
- `generateCaption()` - 文案生成提示词
- `generateImagePrompt()` - 图像提示词生成

## 注意事项

1. **API 密钥安全**: 不要将 `.env` 文件提交到版本控制系统
2. **图像生成**: Gemini 图像生成使用占位图服务，生产环境建议使用 DALL-E 或其他图像生成 API
3. **速率限制**: 注意各 AI 提供商的速率限制和配额
4. **错误处理**: 生产环境中建议添加更完善的错误处理和日志记录

## 许可证

MIT
