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
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">匹配分析</p>
            <h1 className="text-3xl font-semibold text-slate-950">生成简历与 JD 匹配分析</h1>
            <p className="text-sm leading-7 text-slate-600">
              当前账号：<span className="font-medium text-slate-900">{profile.email}</span>。选择一份简历和一条 JD，生成定制化分析结果。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-white border border-slate-300 text-slate-950 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:shadow-md"
            >
              返回首页
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full bg-white border border-slate-300 text-slate-950 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:shadow-md"
              >
                退出登录
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-slate-600">{params.message ?? ""}</div>

        <section className="rounded-[28px] border border-black/10 bg-white/80 p-8 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">输入</p>
          <div className="mt-3 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">创建匹配分析</h2>
              <p className="mt-2 text-lg leading-8 text-slate-700">
                选择一份已解析简历和一条已解析 JD。系统会生成匹配分、优势、差距、修改建议以及投递文案。
              </p>
            </div>
            <form action={createAnalysis} className="space-y-6 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">简历</span>
                <select name="resumeId" required className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="">选择简历</option>
                  {resumeList.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.original_file_name}{resume.is_default ? "（默认）" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">岗位 JD</span>
                <select name="jdId" required className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <option value="">选择 JD</option>
                  {jobList.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_title || "未命名岗位"} · {job.company_name || "未知公司"}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-white border border-slate-300 text-slate-950 px-5 py-3 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:shadow-md"
              >
                生成分析
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-8 text-white shadow-[0_12px_50px_rgba(20,33,61,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">分析记录</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">已生成的匹配结果</h2>
            </div>
            <p className="text-sm text-slate-400">这些结果可以直接用于后续投递记录。</p>
          </div>

          <div className="mt-6 space-y-5">
            {analysisList.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
                还没有分析记录。请先准备一份简历和一条 JD。
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
                        <h3 className="text-lg font-semibold text-white">{job?.job_title || "未命名岗位"}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          简历: {resume?.original_file_name || "未知简历"} · 公司：{job?.company_name || "未知公司"} · 生成时间：{formatDate(analysis.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="rounded-full bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200">
                          匹配分：{analysis.match_score ?? "-"}
                        </div>
                        <Link
                          href={`/applications?analysisId=${analysis.id}`}
                          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                        >
                          创建投递记录
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-8">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">自我介绍</p>
                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {analysis.generated_intro || "当前没有生成自我介绍。"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">打招呼 / 投递附言</p>
                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {outreachMessage || "当前没有生成投递附言。"}
                          </p>
                        </div>
                        <ListBlock title="简历修改建议" items={bullets} emptyText="当前没有生成简历改写建议。" />
                      </div>

                      <div className="space-y-4">
                        <ListBlock title="匹配优势" items={strengths} emptyText="当前没有识别出优势项。" />
                        <ListBlock title="能力差距" items={gaps} emptyText="当前没有识别出差距项。" />
                        <ListBlock title="优化建议" items={suggestions} emptyText="当前没有识别出优化建议。" />
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


