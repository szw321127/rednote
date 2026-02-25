# RedNote AI Studio 商业化升级计划

## 项目现状分析

### 技术栈
- **后端**: NestJS 11 + TypeScript + LangChain + TypeORM + SQLite
- **前端**: React 19 + Vite + Tailwind CSS
- **AI**: Gemini (2.5/3) + GPT-4o + DALL-E 3
- **部署**: Docker Compose + GitHub Actions
- **认证**: JWT (Passport) + bcrypt
- **安全**: @nestjs/throttler 限流

### 原始项目不足（已修复）
1. ~~无持久化存储~~ -> TypeORM + SQLite
2. ~~无用户认证~~ -> JWT + 注册/登录/权限
3. ~~无 API 安全~~ -> 限流 + Auth Guard
4. ~~无付费体系~~ -> 配额管理系统
5. ~~无数据分析~~ -> 统计分析 API
6. ~~零测试覆盖~~ -> 9 个单元测试通过

---

## 升级计划

### P0 - 基础设施

#### 1. 数据持久化层
- [x] 引入 TypeORM + SQLite（开发）/ PostgreSQL（生产）
- [x] User 实体（用户、配额、计划）
- [x] Content 实体（生成内容、大纲、质量评分）
- [x] DatabaseModule 自动建表

#### 2. 用户认证系统
- [x] JWT 认证（access token + refresh token）
- [x] 用户注册/登录 API（/api/auth/register, /api/auth/login）
- [x] 密码加密（bcrypt）
- [x] JwtAuthGuard + OptionalJwtGuard
- [x] JwtStrategy (Passport)
- [x] 前端 AuthView 登录/注册页面
- [x] 前端 auth.ts Token 管理服务
- [x] Sidebar 用户信息展示 + 登出

### P1 - 核心增强

#### 3. API 安全与限流
- [x] @nestjs/throttler 全局限流（60次/分钟）
- [x] OptionalJwtGuard 兼容匿名和认证用户
- [x] 输入校验（ValidationPipe + whitelist）
- [x] CORS 策略配置

#### 4. AI 能力增强
- [x] ContentQualityService 内容质量评估（创意/互动/清晰度评分）
- [x] GenerateService 并行生成（caption + imagePrompt 并行）
- [x] 生成历史数据库持久化（认证用户）
- [x] 质量评分自动附加到生成结果

### P2 - 商业化功能

#### 5. 数据统计分析
- [x] StatsService 用户统计 API（/api/stats/me）
- [x] 管理员统计 API（/api/stats/admin）
- [x] 用户计划分布统计

#### 6. 配额与订阅系统
- [x] User 实体内置配额字段（quotaLimit, quotaUsed, quotaResetAt）
- [x] 按月自动重置配额
- [x] 生成时自动扣减配额
- [x] 配额超限拒绝请求
- [x] 免费层 50 次/月

### P3 - 质量保障

#### 7. 测试覆盖
- [x] AuthService 单元测试（注册、登录、凭证验证）
- [x] StatsService 单元测试（用户统计、管理员统计）
- [x] 全部 9 个测试通过

---

## 进度追踪

| 模块 | 优先级 | 状态 | 完成度 |
|------|--------|------|--------|
| 数据持久化层 | P0 | ✅ 已完成 | 100% |
| 用户认证系统 | P0 | ✅ 已完成 | 100% |
| API 安全与限流 | P1 | ✅ 已完成 | 100% |
| AI 能力增强 | P1 | ✅ 已完成 | 100% |
| 数据统计分析 | P2 | ✅ 已完成 | 100% |
| 配额与订阅系统 | P2 | ✅ 已完成 | 100% |
| 测试覆盖 | P3 | ✅ 已完成 | 100% |

---

## 新增文件清单

### 后端
| 文件 | 说明 |
|------|------|
| `src/database/database.module.ts` | TypeORM + SQLite 数据库模块 |
| `src/database/entities/user.entity.ts` | 用户实体（含配额字段） |
| `src/database/entities/content.entity.ts` | 内容实体（含质量评分） |
| `src/auth/auth.module.ts` | 认证模块 |
| `src/auth/auth.service.ts` | 认证服务（注册/登录/刷新） |
| `src/auth/auth.controller.ts` | 认证 API 控制器 |
| `src/auth/dto/register.dto.ts` | 注册 DTO |
| `src/auth/dto/login.dto.ts` | 登录 DTO |
| `src/auth/guards/jwt-auth.guard.ts` | JWT 认证守卫 |
| `src/auth/guards/optional-jwt.guard.ts` | 可选 JWT 守卫 |
| `src/auth/strategies/jwt.strategy.ts` | Passport JWT 策略 |
| `src/auth/auth.service.spec.ts` | 认证服务测试 |
| `src/ai/services/content-quality.service.ts` | 内容质量评估服务 |
| `src/stats/stats.module.ts` | 统计模块 |
| `src/stats/stats.service.ts` | 统计服务 |
| `src/stats/stats.controller.ts` | 统计 API 控制器 |
| `src/stats/stats.service.spec.ts` | 统计服务测试 |

### 前端
| 文件 | 说明 |
|------|------|
| `views/AuthView.tsx` | 登录/注册页面 |
| `services/auth.ts` | Token 管理和认证工具 |

### 修改文件
| 文件 | 变更 |
|------|------|
| `src/app.module.ts` | 集成 Database/Auth/Stats/Throttler 模块 |
| `src/main.ts` | 添加 data 目录创建 |
| `src/generate/generate.controller.ts` | 添加 OptionalJwtGuard + 配额检查 + 内容持久化 |
| `src/generate/generate.module.ts` | 引入 TypeORM 实体 |
| `src/generate/generate.service.ts` | 集成质量评估 + 并行生成优化 |
| `src/ai/ai.module.ts` | 注册 ContentQualityService |
| `App.tsx` | 集成认证流程 |
| `components/Sidebar.tsx` | 用户信息展示 + 登出 |
| `.env.example` | 添加 JWT_SECRET, DATABASE_PATH |

---

## API 端点总览

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 无 | 用户注册 |
| POST | `/api/auth/login` | 无 | 用户登录 |
| POST | `/api/auth/refresh` | JWT | 刷新 Token |
| GET | `/api/auth/profile` | JWT | 获取用户信息 |
| POST | `/api/generate/outline` | 可选 | 生成大纲（流式） |
| POST | `/api/generate/content` | 可选 | 生成内容（图片+文案+评分） |
| GET | `/api/stats/me` | JWT | 用户统计 |
| GET | `/api/stats/admin` | JWT | 管理员统计 |
| GET | `/api/health` | 无 | 健康检查 |
| POST | `/api/session/set-model-config` | 无 | 设置模型配置 |
| POST | `/api/config/save` | 无 | 保存用户配置 |
| GET | `/api/config/get` | 无 | 获取用户配置 |
