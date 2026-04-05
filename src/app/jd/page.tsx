import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { getCurrentProfile } from "@/lib/auth";
import type { JobDescriptionRecord, JsonValue } from "@/types";

import { createJobDescriptionAnalysis } from "./actions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type JsonObject = Record<string, JsonValue>;

function isObject(value: JsonValue | undefined | null): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: JsonValue | undefined | null): JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: JsonValue | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: JsonValue | undefined | null): string[] {
  return asArray(value)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeJobDescription(structured: JsonValue | null) {
  const object = isObject(structured) ? structured : {};

  return {
    summary:
      asString(object.summary) ||
      asString(object.overview) ||
      asString(object.description) ||
      "No summary generated.",
    responsibilities: stringList(object.responsibilities ?? object.key_responsibilities),
    requiredSkills: stringList(object.required_skills ?? object.must_have_skills ?? object.skills),
    preferredSkills: stringList(object.preferred_skills ?? object.nice_to_have_skills),
    qualifications: stringList(object.qualifications ?? object.requirements),
    keywords: stringList(object.keywords ?? object.tags),
    raw: object,
  };
}

function ListSection({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-slate-400">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function JobDescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { supabase, profile } = await getCurrentProfile();
  const params = await searchParams;
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("id, user_id, raw_text, company_name, job_title, structured_json, created_at, updated_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const jobs = (data ?? []) as JobDescriptionRecord[];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f3ea_0%,_#f1ede3_48%,_#ebe4d7_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">JD workspace</p>
            <h1 className="text-3xl font-semibold text-slate-950">Paste and parse a target JD</h1>
            <p className="text-sm leading-7 text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{profile.email}</span>. Paste a raw JD and extract the role requirements you will match against your resume.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-900/15 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to dashboard
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-slate-600">{params.message ?? ""}</div>

        <section className="rounded-[28px] border border-black/10 bg-white/80 p-8 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Input</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Create a JD parsing record</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Start with the raw job description. The system will extract job title, company, responsibilities, required skills, preferred skills, qualifications, and keywords.
              </p>
            </div>
            <form action={createJobDescriptionAnalysis} className="space-y-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Company name</span>
                  <input
                    name="companyName"
                    type="text"
                    placeholder="Optional override"
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Job title</span>
                  <input
                    name="jobTitle"
                    type="text"
                    placeholder="Optional override"
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Raw JD text</span>
                <textarea
                  name="rawText"
                  required
                  rows={16}
                  placeholder="Paste the full job description here"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Parse JD
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-8 text-white shadow-[0_12px_50px_rgba(20,33,61,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">JD library</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Extracted role requirements</h2>
            </div>
            <p className="text-sm text-slate-400">Review the mapped structure below each stored JD.</p>
          </div>

          <div className="mt-6 space-y-5">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
                No JD records yet. Paste one above to build the next analysis step.
              </div>
            ) : (
              jobs.map((job) => {
                const normalized = normalizeJobDescription(job.structured_json);

                return (
                  <article key={job.id} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job.job_title || "Untitled role"}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {job.company_name || "Unknown company"} · Parsed {formatDate(job.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role overview</p>
                          <p className="mt-3 text-sm leading-7 text-slate-300">{normalized.summary}</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Keywords</p>
                          {normalized.keywords.length === 0 ? (
                            <p className="mt-3 text-sm leading-7 text-slate-400">No keywords were mapped.</p>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {normalized.keywords.map((keyword) => (
                                <span key={keyword} className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ListSection title="Responsibilities" items={normalized.responsibilities} emptyText="No responsibilities were mapped." />
                        <ListSection title="Required skills" items={normalized.requiredSkills} emptyText="No required skills were mapped." />
                        <ListSection title="Preferred skills" items={normalized.preferredSkills} emptyText="No preferred skills were mapped." />
                        <ListSection title="Qualifications" items={normalized.qualifications} emptyText="No qualifications were mapped." />
                      </div>
                    </div>

                    <details className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
                      <summary className="cursor-pointer text-sm font-medium text-slate-200">Inspect raw structured JSON</summary>
                      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
                        {JSON.stringify(normalized.raw, null, 2)}
                      </pre>
                    </details>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}