# 配置同步功能说明

> ⚠️ 安全更新（P0）
>
> 当前后端已切换为 **JWT 登录态绑定 userId** 的配置同步策略：`/api/config/save` 和 `/api/config/get` 都需要认证，配置按用户隔离，不再支持通过 fingerprint 直接读取配置。
>
> 文档下方旧的 fingerprint 方案仅作历史参考，生产环境请以登录态方案为准。

## 功能概述

RedNote AI Studio 支持在前端配置模型参数并同步到服务端。为了避免指纹枚举带来的越权风险，服务端现在默认采用用户登录态来绑定配置。

同时，出于密钥安全考虑，服务端不会持久化 `models[*].apiKey`（保存时会剥离）。API Key 建议仅保存在前端安全存储或通过环境变量注入。

## 工作原理

### 1. 浏览器指纹生成
- 使用多种浏览器特征生成唯一标识符（指纹）
- 包含的特征：User Agent、屏幕分辨率、时区、语言、平台、CPU 核心数、Canvas 指纹等
- 指纹通过 SHA-256 哈希算法生成，确保唯一性
- 指纹存储在 sessionStorage 中，确保同一会话内的一致性

### 2. 配置同步流程

#### 进入设置页面时：
1. 生成或获取浏览器指纹
2. 向服务端请求该指纹对应的配置
3. 如果服务端有配置，则与本地配置合并
4. 更新本地 IndexedDB 和界面显示

#### 保存配置时：
1. 保存到本地 IndexedDB（离线可用）
2. 同步到服务端（与指纹关联）
3. 显示同步状态（同步中/已同步/失败）

### 3. 后端存储
- 使用内存 Map 存储配置（重启后丢失）
- 每个指纹对应一个配置对象
- 配置包含：后端地址、活动模型、模型库、API Key、生成参数等

## API 接口

### 保存配置
```http
POST /api/config/save
Content-Type: application/json

{
  "fingerprint": "abc123...",
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

### 获取配置
```http
GET /api/config/get?fingerprint=abc123...
```

### 查看统计
```http
GET /api/config/stats
```

## 前端文件说明

### services/fingerprint.ts
- 浏览器指纹生成器
- 收集多种浏览器特征
- 使用 SHA-256 生成唯一标识

### services/geminiService.ts
- 添加了 `saveConfig()` 和 `getConfig()` 方法
- 用于与后端同步配置

### views/Settings.tsx
- 在 `useEffect` 中初始化指纹并加载远程配置
- 保存时自动同步到服务端
- 显示同步状态指示器
- 显示设备指纹（前 16 位）

## 后端文件说明

### config-storage/ 模块
- **config-storage.controller.ts**: 配置管理控制器
- **services/config-storage.service.ts**: 配置存储服务
- **dto/**: 数据传输对象（DTO）
- **interfaces/user-config.interface.ts**: 用户配置接口

## 使用示例

### 场景 1：首次使用
1. 打开设置页面
2. 系统生成浏览器指纹
3. 配置 API Key 和其他设置
4. 点击"保存更改"
5. 配置同步到服务端，显示"已同步到云端"

### 场景 2：换浏览器访问
1. 使用不同浏览器或设备打开应用
2. 生成新的浏览器指纹
3. 服务端没有该指纹的配置
4. 使用默认配置或重新配置

### 场景 3：重新访问（同一浏览器）
1. 打开设置页面
2. 系统识别出相同的浏览器指纹
3. 自动从服务端加载之前的配置
4. 无需重新配置 API Key

## 注意事项

1. **指纹稳定性**：
   - 指纹在同一浏览器中较为稳定
   - 清除浏览器数据可能导致指纹变化
   - 使用隐私模式会生成不同的指纹

2. **数据持久化**：
   - 当前后端使用内存存储
   - 服务重启后配置会丢失
   - 生产环境建议使用数据库（Redis、MongoDB 等）

3. **安全性**：
   - API Key 存储在后端内存中
   - 建议在生产环境添加加密
   - 考虑添加过期时间和清理机制

4. **离线支持**：
   - 配置始终保存在本地 IndexedDB
   - 即使后端不可用，应用仍可使用本地配置
   - 在线时自动同步到服务端

## 改进建议

### 短期改进
1. 添加配置过期时间
2. 实现配置加密存储
3. 添加配置导入/导出功能

### 长期改进
1. 迁移到数据库存储（Redis/MongoDB）
2. 实现真正的用户账户系统
3. 支持多设备配置同步
4. 添加配置历史记录和版本管理

## 测试配置同步

```bash
# 1. 启动后端
cd rednote-backend
npm run start:dev

# 2. 启动前端
cd rednote-ai-studio
npm run dev

# 3. 在浏览器中：
# - 打开设置页面（查看控制台日志）
# - 配置 API Key
# - 点击保存（观察同步状态）
# - 刷新页面（验证配置加载）

# 4. 查看后端统计
curl http://localhost:3000/api/config/stats
```

## 故障排除

### 问题：配置没有同步到服务端
- 检查浏览器控制台是否有错误
- 确认后端服务正常运行
- 检查 CORS 配置是否正确
- 查看后端日志

### 问题：每次刷新指纹都变化
- 检查 sessionStorage 是否被清除
- 确认浏览器没有禁用存储
- 查看控制台日志中的指纹值

### 问题：配置加载失败
- 确认后端 `/api/config/get` 接口可访问
- 检查网络请求是否成功
- 查看后端是否有该指纹的配置
