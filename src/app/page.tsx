import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const quickStats = [
  { label: "JD analysis", value: "0", hint: "Waiting for first run" },
  { label: "Resume versions", value: "0", hint: "No uploaded files yet" },
  { label: "Applications", value: "0", hint: "Tracking starts in V1" },
];

const nextSteps = [
  "Connect Supabase auth and database tables.",
  "Add resume upload and structured parsing flow.",
  "Implement JD analysis, match scoring, and application tracking.",
];

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Open dashboard" : "Sign in to start";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.18),_transparent_30%),linear-gradient(180deg,_#f7f3ea_0%,_#f1ede3_48%,_#ebe4d7_100%)] px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.24em] text-amber-700">
            <span>Resume Assistant</span>
            <span className="h-1 w-1 rounded-full bg-amber-700" />
            <span>V1 foundation</span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Build a closed-loop AI job application product before adding automation.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                This workspace is set up for a focused V1: upload a base resume, analyze a JD,
                generate tailored edits, and connect those edits to real application outcomes.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={primaryHref}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  {primaryLabel}
                </Link>
                <Link
                  href="/admin"
                  className="rounded-full border border-slate-900/15 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/60"
                >
                  Admin preview
                </Link>
              </div>
            </div>
            <div className="rounded-[28px] bg-slate-950 p-6 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current state</p>
              <ul className="mt-5 space-y-4">
                {quickStats.map((item) => (
                  <li key={item.label} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-end justify-between gap-4">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <span className="font-mono text-3xl">{item.value}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{item.hint}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-black/10 bg-white/70 p-8 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Build order</p>
            <ol className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
              {nextSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="font-mono text-slate-400">0{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-[#14213d] p-8 text-slate-50 shadow-[0_12px_50px_rgba(20,33,61,0.22)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Foundation files</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <p>`src/lib/env.ts` validates required environment variables.</p>
              <p>`src/lib/supabase` contains browser and server client factories.</p>
              <p>`src/lib/ai/client.ts` prepares model access through an OpenAI-compatible SDK.</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}