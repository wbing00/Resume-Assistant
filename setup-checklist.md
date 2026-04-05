# Step 1 环境准备清单

这份清单对应 [plan.md](D:\Resume Assistant\plan.md) 中的第一阶段：`环境准备`。

目标是把开发前必须准备的账号、密钥、本地环境和配置项一次整理清楚，避免后续开发时反复返工。

## 1. 需要准备的账号

### 1.1 Supabase
用途：
- 用户登录
- Postgres 数据库
- 文件存储
- 行级权限控制

你需要完成：
- 注册 Supabase 账号
- 新建一个 project
- 记录以下信息：
  - `Project URL`
  - `anon key`
  - `service_role key`

注意：
- `service_role key` 只能放服务端，不能暴露到前端

### 1.2 大模型 API 平台
用途：
- 简历结构化解析
- JD 结构化解析
- 匹配分析
- 简历改写和文案生成

可选：
- OpenAI API
- 兼容 OpenAI 接口的模型平台

你需要完成：
- 注册账号
- 开通 API 调用权限
- 获取：
  - `API Base URL`
  - `API Key`
  - 默认使用的模型名

### 1.3 部署平台
V1 本地开发阶段不是必须，但建议提前明确。

推荐：
- Vercel

用途：
- 部署 Next.js 应用
- 配置线上环境变量

## 2. 本地开发环境

### 2.1 必装工具
- Node.js 20.x 或以上
- npm
- Git
- VS Code 或其他编辑器

### 2.2 验证命令
本地执行以下命令，确认环境正常：

```powershell
node -v
npm -v
git --version
```

建议记录结果，确保后续初始化时版本一致。

## 3. 需要准备的环境变量

建议在项目根目录创建 `.env.local`，变量模板见 `.env.example`。

当前 V1 至少需要：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

按使用的平台不同，可能还需要：
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

## 4. 数据与隐私注意事项

这个项目会处理简历和投递数据，属于敏感度较高的个人信息。

开发阶段至少做到：
- 普通用户只能访问自己的数据
- 管理看板只允许管理员访问
- API Key 不写死在前端
- 测试阶段提醒用户不要上传额外敏感信息

建议在产品中补一段提示：

`上传的简历仅用于生成分析和改写建议，测试阶段请勿上传身份证号、家庭住址等额外敏感信息。`

## 5. 你需要提供给我的信息

在开始代码实现前，我需要你提供以下内容中的至少一部分：

### 必需信息
- Supabase `Project URL`
- Supabase `anon key`
- Supabase `service_role key`
- 大模型 `API Key`

### 建议一并提供
- 大模型 `Base URL`
- 默认模型名
- 是否优先使用 OpenAI 官方接口

## 6. 完成标准

当以下条件满足时，第一步可以视为完成：
- 已注册并创建 Supabase 项目
- 已拿到 Supabase 关键配置
- 已准备好大模型 API Key
- 本地 Node.js / npm / Git 可用
- 已确认将使用 `.env.local` 管理密钥

## 7. 下一步

第一步完成后，进入第二步：
- 初始化 Next.js 项目
- 配置 Tailwind CSS
- 接入 Supabase 客户端
- 建立基础目录结构
