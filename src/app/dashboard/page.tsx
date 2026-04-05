import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { getCurrentProfile } from "@/lib/auth";

const upcomingModules = [
  { title: "Resume management", description: "Upload, parse, and set a default resume version.", href: "/resume" },
  { title: "JD analysis", description: "Turn raw job descriptions into structured requirements.", href: "/jd" },
  { title: "Match analysis", description: "Pair a parsed resume with a parsed JD and generate tailored content.", href: "/analysis" },
  { title: "Applications", description: "Create application records, update status, and save feedback.", href: "/applications" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { profile } = await getCurrentProfile();
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f3ea_0%,_#f1ede3_48%,_#ebe4d7_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">User workspace</p>
            <h1 className="text-3xl font-semibold text-slate-950">Dashboard</h1>
            <p className="text-sm leading-7 text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{profile.email}</span>.
              Current role: <span className="font-mono uppercase text-slate-900">{profile.role}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-full border border-slate-900/15 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Open admin
            </Link>
            <form action={signOut}>
              <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-slate-600">{params.message ?? ""}</div>

        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-800">Beta notice</p>
          <p className="mt-3">
            This is a V1 validation build. Resume files and job descriptions are stored in Supabase for product testing.
            Do not upload IDs, home addresses, or other unnecessary sensitive data.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-black/10 bg-white/75 p-8 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Core workflow</p>
            <div className="mt-5 grid gap-4">
              {upcomingModules.map((module) => (
                <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-950">{module.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{module.description}</p>
                  <Link href={module.href} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                    Open
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] bg-slate-950 p-8 text-white shadow-[0_12px_50px_rgba(20,33,61,0.22)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current status</p>
            <dl className="mt-5 space-y-5">
              <div>
                <dt className="text-sm text-slate-300">Auth flow</dt>
                <dd className="mt-1 text-2xl font-semibold">Ready</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-300">Resume upload</dt>
                <dd className="mt-1 text-sm leading-7 text-slate-300">Ready for PDF, TXT, and MD parsing.</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-300">JD parsing</dt>
                <dd className="mt-1 text-sm leading-7 text-slate-300">Ready for raw JD input and structured extraction.</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-300">Match analysis</dt>
                <dd className="mt-1 text-sm leading-7 text-slate-300">Ready to generate scoring, gaps, and tailored content.</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-300">Applications feedback loop</dt>
                <dd className="mt-1 text-sm leading-7 text-slate-300">Ready to track outcomes and save post-application feedback.</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-300">Instrumentation</dt>
                <dd className="mt-1 text-sm leading-7 text-slate-300">Core V1 events now land in the events table for admin review.</dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}
