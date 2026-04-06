import Link from "next/link";
import { redirect } from "next/navigation";

import { SubmitButton } from "@/components/ui/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { signInWithPassword, signUpWithPassword } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const message = params.message;

  return (
    <main className="page-shell">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card-dark flex flex-col justify-between rounded-[36px] p-8 sm:p-10">
          <div className="space-y-5">
            <span className="badge-soft border-white/15 bg-white/10 text-slate-200">JobMatch AI</span>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              从一份基础简历开始，持续用真实投递结果优化你的求职策略。
            </h1>
            <p className="max-w-lg text-base leading-8 text-slate-300">
              当前版本使用邮箱和密码登录，适合反复本地测试与演示，不依赖邮件验证码。
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">先注册你自己的账号。</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">如需管理看板权限，在 `profiles` 中把角色改为 `admin`。</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">登录后进入完整求职闭环工作台。</div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="card-primary w-full rounded-[32px] p-8 sm:p-10">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-text-secondary">登录</p>
              <h2 className="text-3xl font-semibold text-text-strong">邮箱与密码</h2>
              <p className="text-sm leading-7 text-text-secondary">
                使用同一组账号信息，方便重复测试。密码至少 8 位。
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <form action={signInWithPassword} className="space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">邮箱</span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="input-primary"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">密码</span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="至少 8 位字符"
                    className="input-primary"
                  />
                </label>

                <SubmitButton className="btn-primary w-full" pendingText="登录中...">
                  登录
                </SubmitButton>
              </form>

              <form action={signUpWithPassword} className="space-y-5 rounded-3xl border border-border-light bg-surface-medium/90 p-5">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">邮箱</span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="input-primary"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">密码</span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="至少 8 位字符"
                    className="input-primary"
                  />
                </label>

                <SubmitButton className="btn-secondary w-full" pendingText="注册中...">
                  注册账号
                </SubmitButton>
              </form>
            </div>

            <div className="mt-5 min-h-6 text-sm text-text-secondary">{message ?? ""}</div>

            <div className="panel-note mt-6">
              测试说明：简历和 JD 会被保存用于产品验证，请不要上传身份证、家庭住址等不必要的敏感信息。
            </div>

            <div className="mt-8 border-t border-border-light pt-5 text-sm text-text-secondary">
              <Link href="/" className="font-medium text-text-primary transition hover:text-text-strong">
                返回首页
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
