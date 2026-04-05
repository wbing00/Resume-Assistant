import Link from "next/link";
import { redirect } from "next/navigation";

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
    redirect("/dashboard");
  }

  const params = await searchParams;
  const message = params.message;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f3ea_0%,_#f1ede3_48%,_#ebe4d7_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between rounded-[36px] bg-slate-950 p-8 text-white shadow-[0_25px_80px_rgba(15,23,42,0.25)] sm:p-10">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Resume Assistant</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Start with a base resume. Iterate from real application outcomes.
            </h1>
            <p className="max-w-lg text-base leading-8 text-slate-300">
              Development mode now uses email and password auth so you can test login repeatedly without hitting email delivery limits.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Register one account for yourself first.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Promote that account to `admin` in `profiles`.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Then sign in and keep building the workflow.</div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Authentication</p>
              <h2 className="text-3xl font-semibold text-slate-950">Email and password</h2>
              <p className="text-sm leading-7 text-slate-600">
                Use the same credentials for repeat local testing. Password must be at least 8 characters.
              </p>
            </div>

            <form className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-0 transition focus:border-amber-500"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-0 transition focus:border-amber-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  formAction={signInWithPassword}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Sign in
                </button>
                <button
                  formAction={signUpWithPassword}
                  className="rounded-full border border-slate-900/15 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Create account
                </button>
              </div>
            </form>

            <div className="mt-5 min-h-6 text-sm text-slate-600">{message ?? ""}</div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
              Test build notice: uploaded resumes and job descriptions are stored for product validation.
              Do not use highly sensitive personal data beyond what is necessary for resume testing.
            </div>

            <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">
              <Link href="/" className="font-medium text-slate-700 transition hover:text-slate-950">
                Back to overview
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
