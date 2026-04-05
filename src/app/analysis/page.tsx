import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { getCurrentProfile } from "@/lib/auth";
import type { AnalysisRecord, JobDescriptionRecord, JsonValue, ResumeRecord } from "@/types";

import { createAnalysis } from "./actions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function asStringArray(value: JsonValue | null) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function parseSuggestions(value: JsonValue | null) {
  if (Array.isArray(value)) {
    return {
      suggestions: value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())),
      outreachMessage: "",
    };
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, JsonValue>;
    const suggestionItems = Array.isArray(object.suggestions)
      ? object.suggestions.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];

    return {
      suggestions: suggestionItems,
      outreachMessage: typeof object.outreach_message === "string" ? object.outreach_message.trim() : "",
    };
  }

  return {
    suggestions: [],
    outreachMessage: "",
  };
}

function ListBlock({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
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

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { supabase, profile } = await getCurrentProfile();
  const params = await searchParams;

  const [
    { data: resumes, error: resumesError },
    { data: jobs, error: jobsError },
    { data: analyses, error: analysesError },
  ] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, user_id, original_file_name, is_default, created_at, updated_at, parsed_text, structured_json, file_path")
      .eq("user_id", profile.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("job_descriptions")
      .select("id, user_id, raw_text, company_name, job_title, structured_json, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("analyses")
      .select("id, user_id, resume_id, jd_id, match_score, strengths_json, gaps_json, suggestions_json, generated_intro, generated_resume_bullets, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  if (resumesError) throw new Error(resumesError.message);
  if (jobsError) throw new Error(jobsError.message);
  if (analysesError) throw new Error(analysesError.message);

  const resumeList = (resumes ?? []) as ResumeRecord[];
  const jobList = (jobs ?? []) as JobDescriptionRecord[];
  const analysisList = (analyses ?? []) as AnalysisRecord[];

  const resumeMap = new Map(resumeList.map((resume) => [resume.id, resume]));
  const jobMap = new Map(jobList.map((job) => [job.id, job]));

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f3ea_0%,_#f1ede3_48%,_#ebe4d7_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Analysis workspace</p>
            <h1 className="text-3xl font-semibold text-slate-950">Run resume-to-JD matching</h1>
            <p className="text-sm leading-7 text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{profile.email}</span>. Pair one parsed resume with one parsed JD and generate tailored content.
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
              <h2 className="text-2xl font-semibold text-slate-950">Create a match analysis</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Select one parsed resume and one parsed JD. The system will generate a match score, highlight strengths and gaps, suggest edits, and draft tailored content for the application.
              </p>
            </div>
            <form action={createAnalysis} className="space-y-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Resume</span>
                <select name="resumeId" required className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="">Select a resume</option>
                  {resumeList.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.original_file_name}{resume.is_default ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Job description</span>
                <select name="jdId" required className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="">Select a JD</option>
                  {jobList.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_title || "Untitled role"} · {job.company_name || "Unknown company"}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Generate analysis
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-8 text-white shadow-[0_12px_50px_rgba(20,33,61,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Analysis library</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Generated match results</h2>
            </div>
            <p className="text-sm text-slate-400">Use these outputs as the basis for the later application-record step.</p>
          </div>

          <div className="mt-6 space-y-5">
            {analysisList.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
                No analyses yet. Create one above after you have at least one parsed resume and one parsed JD.
              </div>
            ) : (
              analysisList.map((analysis) => {
                const resume = resumeMap.get(analysis.resume_id);
                const job = jobMap.get(analysis.jd_id);
                const strengths = asStringArray(analysis.strengths_json);
                const gaps = asStringArray(analysis.gaps_json);
                const { suggestions, outreachMessage } = parseSuggestions(analysis.suggestions_json);
                const bullets = asStringArray(analysis.generated_resume_bullets);

                return (
                  <article key={analysis.id} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job?.job_title || "Untitled role"}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          Resume: {resume?.original_file_name || "Unknown resume"} · Company: {job?.company_name || "Unknown company"} · Generated {formatDate(analysis.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="rounded-full bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200">
                          Match score: {analysis.match_score ?? "-"}
                        </div>
                        <Link
                          href={`/applications?analysisId=${analysis.id}`}
                          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                        >
                          Create application record
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Self introduction</p>
                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {analysis.generated_intro || "No tailored self-introduction was generated."}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Outreach message</p>
                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {outreachMessage || "No outreach message was generated."}
                          </p>
                        </div>
                        <ListBlock title="Resume edit suggestions" items={bullets} emptyText="No tailored resume bullets were generated." />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ListBlock title="Strengths" items={strengths} emptyText="No strengths were mapped." />
                        <ListBlock title="Gaps" items={gaps} emptyText="No gaps were mapped." />
                        <ListBlock title="Suggestions" items={suggestions} emptyText="No suggestions were mapped." />
                      </div>
                    </div>
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