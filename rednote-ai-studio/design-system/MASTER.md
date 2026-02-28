# RedNote AI Studio — Design System (v0)

目标：给 `rednote-ai-studio` 提供一套“可落地、可持续迭代”的 UI 规范。

定位：Creator Studio / Productivity Tool。
风格：Soft UI Evolution + Minimalism/Swiss（工具型、信息清晰、轻阴影、少装饰）。

---

## 1) Design Tokens

### 1.1 颜色（Colors）

**语义角色（推荐）**
- `brand`：品牌强调色（主按钮/高亮/关键 icon）
- `bg`：页面背景
- `surface`：卡片/面板背景
- `border`：边框/分割线
- `text`：主文本
- `muted`：次要文本
- `success / warning / danger`：状态色（尽量克制）

**当前建议值**
- `brand`: `#ff2442`
- `bg`: `#f5f5f7`
- `surface`: `#ffffff`
- `border`: `#e5e7eb`
- `text`: `#111827`
- `muted`: `#6b7280`

**可访问性**
- 正文对比度至少 `4.5:1`
- 图标按钮必须有 `hover + focus-visible` 状态

### 1.2 字体（Typography）

- 默认字体：`Inter`（英文/数字更利落） + `Noto Sans SC`（中文稳定）
- 字重建议：
  - `400` 正文
  - `500` 次标题/按钮
  - `700` 主标题
- 行高：正文 `1.5–1.75`，标题 `1.2–1.35`

**字号阶梯（参考）**
- `text-xs` 12
- `text-sm` 14
- `text-base` 16（移动端尽量不低于 16）
- `text-lg` 18
- `text-xl` 20
- `text-2xl` 24
- `text-3xl` 30

### 1.3 间距（Spacing）

- 以 `8px` 为基准（Tailwind：`2 = 8px`, `3 = 12px`, `4 = 16px`）
- 页面模块间距：`24–40px`
- 卡片内边距：`16–24px`

### 1.4 圆角（Radius）

- 输入框：`rounded-xl`（12px）
- 卡片：`rounded-2xl`（16px）
- 胶囊标签：`rounded-full`

### 1.5 阴影（Shadow）

Soft UI 的关键：阴影“轻、短、分层”。
- Card 默认：`0 1px 2px rgba(17,24,39,0.06), 0 6px 16px rgba(17,24,39,0.06)`
- Hover：略增强（不要夸张）

### 1.6 动效（Motion）

- 过渡：`150–300ms`，优先 `transform/opacity`
- 禁止：大幅位移、刺眼闪烁
- 尊重：`prefers-reduced-motion`

### 1.7 焦点（Focus）

- 所有可交互元素必须具备：
  - `focus-visible:ring-2`
  - `focus-visible:ring-xhs-red/30`
  - `focus-visible:ring-offset-2` + 合理 `ring-offset-*`

### 1.8 z-index（建议）

- `10` dropdown
- `20` sticky
- `40` overlay
- `50` modal/toast

---

## 2) Component Guidelines

### 2.1 Button

**Primary**（主按钮）
- 背景：brand
- 文本：white
- hover：略加深
- disabled：`opacity-50 cursor-not-allowed`

**Secondary**（次按钮）
- 背景：surface
- 边框：border
- hover：轻微背景变化

**Ghost**（幽灵按钮）
- 背景透明，hover 给浅色底

**必须**
- `min-h` 建议 `40px+`
- icon-only 按钮要 `aria-label`

### 2.2 Input

- 默认：surface + border
- focus：brand ring（不要仅靠边框颜色）
- placeholder：灰度更轻

### 2.3 Card

- 表面：surface
- 边框：border
- 阴影：soft
- 交互卡片：hover 提升阴影 + border 轻微变色

### 2.4 Tag / Badge

- 轻量背景（如 `bg-red-50 text-xhs-red`）
- 字号 `text-xs`

### 2.5 Sidebar

- 信息层级：
  - 顶部品牌区
  - 主导航（高频）
  - 底部账号/状态
- Active 状态：
  - `bg` 轻底色 + brand 文本 + 右侧/左侧细条

### 2.6 Steps（选题/大纲/成品）

- 使用 `button`（而不是可点击 `div`），保证键盘可达
- 禁用态要明确（颜色更浅 + `cursor-not-allowed`）

---

## 3) Page Patterns

### Generator
- Page header：标题 + 说明（保持简洁）
- 内容区：卡片化（输入卡、列表卡、结果卡）

### History
- 卡片网格：统一卡片比例、统一 hover、提供清晰状态 badge

### Settings
- 分组清晰：后端配置 / 模型 / 参数

---

## 4) Implementation Notes (当前项目约束)

- 当前项目使用 Tailwind CDN（`index.html` 引入）
- 建议：先用轻量 tokens + 组件规范落地，不立刻引入 Tailwind 构建链
- 全局样式放在 `index.css`（存在即会被 Vite 打包）

---

## 5) Definition of Done（改版验收）

- 所有交互元素：hover + focus-visible 完整
- 页面背景/卡片/按钮：风格统一
- 关键页面（Generator/History/Settings）：视觉层级一致
- 375 / 768 / 1024 / 1440 宽度无水平滚动
