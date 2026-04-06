# JobMatch AI - 智能求职匹配平台

JobMatch AI 是一个基于 AI 的智能求职辅助平台，帮助求职者优化简历、分析岗位匹配度、生成定制化求职内容，并跟踪投递进度。

## 核心功能

- **简历智能解析** - 上传简历并提取结构化信息
- **JD 深度分析** - 解析岗位描述，提取关键要求
- **AI 匹配分析** - 智能分析简历与岗位的匹配度
- **内容生成** - 生成定制化的自我介绍、投递附言和简历优化建议
- **投递记录管理** - 跟踪求职申请状态和反馈
- **数据分析看板** - 查看历史分析和投递结果

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **AI 集成**: OpenAI API
- **部署**: Vercel

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
