import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const quickLinks = [
  { title: "投递记录", description: "查看历史投递、更新状态并回填反馈。", href: "/applications" },
  { title: "简历管理", description: "维护你的基础简历，设置默认版本。", href: "/resume" },
  { title: "历史分析", description: "查看之前生成过的匹配分析结果。", href: "/analysis" },
  { title: "JD 记录", description: "查看或单独管理历史 JD 解析记录。", href: "/jd" },
];

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/apply" : "/login";
  const primaryLabel = user ? "快速开始一次投递" : "登录后开始投递";

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-white px-6 py-10 text-text-primary sm:px-10 lg:px-16">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* 顶部英雄区域 - 65%/35% 布局 */}
        <section className="grid gap-6 lg:grid-cols-[65%_35%] items-stretch">
          {/* 左侧主区域 */}
          <div className="card-primary">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Resume Assistant</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              先解决这次投递要写什么，再决定是否记录和复盘。
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-text-secondary">
              如果你已经确定好要投哪个岗位，现在只需要输入 JD 并选择一份简历，系统就会快速生成更贴合岗位的介绍、附言和简历修改建议。
            </p>
            <div className="mt-8 flex justify-center">
              <Link href={primaryHref} className="btn-primary">
                {primaryLabel}
              </Link>
            </div>
          </div>

          {/* 右侧说明区域 */}
          <aside className="card-dark">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">使用说明</p>
            <ol className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
              <li>1. 点击"快速开始一次投递"。</li>
              <li>2. 选择一份基础简历，并粘贴目标岗位 JD。</li>
              <li>3. 系统会自动生成自我介绍、投递附言和简历修改建议。</li>
              <li>4. 如果你真的投递了，再进入投递记录补充状态和反馈。</li>
            </ol>
          </aside>
        </section>

        {/* 辅助功能区域 */}
        <section className="content-section">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">辅助入口</p>
              <h2 className="mt-3 text-2xl font-semibold text-text-primary">按需进入其他功能</h2>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <article key={item.title} className="card-secondary">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">{item.description}</p>
                </div>
                <div className="mt-6">
                  <Link href={item.href} className="btn-secondary w-full text-center">
                    进入
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

