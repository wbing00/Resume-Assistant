import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { FormPendingHint, SubmitButton } from "@/components/ui/submit-button";
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
    <div className="result-card-muted">
      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-text-secondary">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm leading-7 text-text-primary">
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
    <main className="page-shell">
      <div className="page-wrap">
        <header className="page-header flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">匹配分析</p>
            <h1 className="text-3xl font-semibold text-text-strong">生成简历与 JD 匹配分析</h1>
            <p className="text-sm leading-7 text-text-secondary">
              当前账号：<span className="font-medium text-text-primary">{profile.email}</span>。选择一份简历和一条 JD，生成定制化分析结果。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="btn-secondary"
            >
              返回首页
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="btn-secondary"
              >
                退出登录
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-text-secondary">{params.message ?? ""}</div>

        <section className="content-section">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">输入</p>
          <div className="mt-3 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-text-strong">创建匹配分析</h2>
              <p className="mt-2 text-lg leading-8 text-text-secondary">
                选择一份已解析简历和一条已解析 JD。系统会生成匹配分、优势、差距、修改建议以及投递文案。
              </p>
            </div>
            <form action={createAnalysis} className="space-y-6 rounded-[24px] border border-border-light bg-surface-medium p-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-primary">简历</span>
                <select name="resumeId" required className="select-primary">
                  <option value="">选择简历</option>
                  {resumeList.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.original_file_name}{resume.is_default ? "（默认）" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-primary">岗位 JD</span>
                <select name="jdId" required className="select-primary">
                  <option value="">选择 JD</option>
                  {jobList.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_title || "未命名岗位"} · {job.company_name || "未知公司"}
                    </option>
                  ))}
                </select>
              </label>

              <SubmitButton
                className="btn-primary w-full"
                pendingText="正在生成分析..."
              >
                生成分析
              </SubmitButton>
              <FormPendingHint text="分析会调用 AI 和数据库，请等待结果返回。" />
            </form>
          </div>
        </section>

        <section className="card-medium">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">分析记录</p>
              <h2 className="mt-2 text-2xl font-semibold text-text-strong">已生成的匹配结果</h2>
            </div>
            <p className="text-sm text-text-secondary">这些结果可以直接用于后续投递记录。</p>
          </div>

          <div className="mt-6 space-y-5">
            {analysisList.length === 0 ? (
              <div className="result-card-muted">
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
                  <article key={analysis.id} className="rounded-[24px] border border-border-light bg-surface p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-text-strong">{job?.job_title || "未命名岗位"}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          简历: {resume?.original_file_name || "未知简历"} · 公司：{job?.company_name || "未知公司"} · 生成时间：{formatDate(analysis.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="info-chip">
                          匹配分：{analysis.match_score ?? "-"}
                        </div>
                        <Link href={`/applications?analysisId=${analysis.id}`} className="btn-secondary">
                          创建投递记录
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-8">
                      <div className="space-y-4">
                        <div className="result-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">自我介绍</p>
                          <p className="mt-3 text-sm leading-7 text-text-primary">
                            {analysis.generated_intro || "当前没有生成自我介绍。"}
                          </p>
                        </div>
                        <div className="result-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">打招呼 / 投递附言</p>
                          <p className="mt-3 text-sm leading-7 text-text-primary">
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
