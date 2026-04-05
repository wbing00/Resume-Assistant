# Supabase 初始化执行说明

## 1. 执行顺序
1. 打开 Supabase 项目的 `SQL Editor`
2. 执行 [01_init_schema.sql](D:\Resume Assistant\supabase\01_init_schema.sql)
3. 确认所有表、索引、触发器和策略创建成功

## 2. 初始化后需要手动做的事

### 创建管理员
首次用你的邮箱登录产品后，Supabase 会自动在 `profiles` 表中创建一条记录，默认角色是 `user`。

然后在 SQL Editor 中执行：

```sql
update public.profiles
set role = 'admin'
where email = '你的登录邮箱';
```

### 推荐创建 Storage bucket
V1 建议创建一个私有 bucket：

- bucket name: `resumes`
- public: `false`

用途：
- 存放用户上传的简历文件

## 3. 权限边界

- 普通用户只能读写自己的业务数据
- 管理员看板不依赖放宽 RLS，而是通过服务端聚合查询实现
- `service_role key` 只能用于服务端逻辑，不能出现在浏览器端

## 4. 当前表说明

- `profiles`: 用户资料和角色
- `resumes`: 简历文件与解析结果
- `job_descriptions`: JD 原文与结构化结果
- `analyses`: 匹配分析和生成内容
- `applications`: 投递记录
- `feedbacks`: 结果反馈
- `events`: 埋点事件

## 5. 下一步开发对应关系

- 第四步：接入登录与页面守卫
- 第五步：接入简历上传，使用 `resumes` bucket 和 `resumes` 表
- 第六步：接入 JD 表单和 `job_descriptions`
- 第七步：接入 `analyses`
- 第八步：接入 `applications` 和 `feedbacks`