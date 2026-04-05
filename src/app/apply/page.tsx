import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { getCurrentProfile } from "@/lib/auth";
import type { AnalysisRecord, JobDescriptionRecord, JsonValue, ResumeRecord } from "@/types";

import { createApplyResult } from "./actions";

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

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; analysisId?: string }>;
}) {
  const { supabase, profile } = await getCurrentProfile();
  const params = await searchParams;

  const [
    { data: resumes, error: resumesError },
    { data: analyses, error: analysesError },
    { data: jobs, error: jobsError },
  ] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, user_id, original_file_name, is_default, created_at, updated_at, parsed_text, structured_json, file_path")
      .eq("user_id", profile.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("analyses")
      .select("id, user_id, resume_id, jd_id, match_score, strengths_json, gaps_json, suggestions_json, generated_intro, generated_resume_bullets, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("job_descriptions")
      .select("id, user_id, raw_text, company_name, job_title, structured_json, created_at, updated_at")
      .eq("user_id", profile.id),
  ]);

  if (resumesError) throw new Error(resumesError.message);
  if (analysesError) throw new Error(analysesError.message);
  if (jobsError) throw new Error(jobsError.message);

  const resumeList = (resumes ?? []) as ResumeRecord[];
  const analysisList = (analyses ?? []) as AnalysisRecord[];
  const jobList = (jobs ?? []) as JobDescriptionRecord[];

  const jobMap = new Map(jobList.map((job) => [job.id, job]));
  const resumeMap = new Map(resumeList.map((resume) => [resume.id, resume]));
  const latestAnalysisId = params.analysisId ?? analysisList[0]?.id;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-white px-6 py-10 text-text-primary sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="page-header">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">开始投递</p>
            <h1 className="text-3xl font-semibold text-text-primary">根据目标岗位，快速生成投递内容</h1>
            <p className="text-sm leading-7 text-text-secondary">
              当前账号：<span className="font-medium text-text-primary">{profile.email}</span>。输入 JD，选择简历，系统会直接生成你这次投递最需要的内容。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="btn-secondary">
              返回首页
            </Link>
            <form action={signOut}>
              <button type="submit" className="btn-text">
                退出登录
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-text-secondary">{params.message ?? ""}</div>

        <section className="content-section">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">核心任务</p>
              <h2 className="mt-3 text-2xl font-semibold text-text-primary">开始一次投递准备</h2>
              <p className="mt-2 text-lg leading-8 text-text-secondary">
                你现在只需要做两件事：粘贴目标岗位 JD，选择一份基础简历。系统会自动完成岗位解析和匹配分析，并输出可直接使用的介绍和修改建议。
              </p>
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
                适合的场景：你已经确定好要投哪个岗位，现在只想快速得到一段更贴合 JD 的介绍和投递内容。
              </div>
            </div>

            <form action={createApplyResult} className="space-y-6 rounded-[24px] border border-border-light bg-slate-50 p-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-primary">选择简历</span>
                <select name="resumeId" required className="select-primary">
                  <option value="">请选择一份简历</option>
                  {resumeList.map((resume) => (
                    <option key={resume.id} value={resume.id}>{resume.original_file_name}{resume.is_default ? "（默认）" : ""}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">公司名称</span>
                  <input name="companyName" placeholder="可选，便于结果更清晰" className="input-primary" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">岗位名称</span>
                  <input name="jobTitle" placeholder="可选，便于结果更清晰" className="input-primary" />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-primary">岗位 JD</span>
                <textarea name="rawText" required rows={14} placeholder="将目标岗位 JD 粘贴到这里" className="textarea-primary" />
              </label>

              <button type="submit" className="btn-primary w-full">
                生成本次投递内容
              </button>
            </form>
          </div>
        </section>

        <section className="card-dark">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">结果区</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">最近生成的投递内容</h2>
            </div>
            <p className="text-sm text-slate-400">先解决当下的投递需求，再决定是否记录为一次正式投递。</p>
          </div>

          <div className="mt-6 space-y-5">
            {analysisList.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
                还没有生成记录。先在上方输入 JD 并选择简历，系统会直接生成可用内容。
              </div>
            ) : (
              analysisList.map((analysis) => {
                const job = jobMap.get(analysis.jd_id);
                const resume = resumeMap.get(analysis.resume_id);
                const strengths = asStringArray(analysis.strengths_json);
                const gaps = asStringArray(analysis.gaps_json);
                const bullets = asStringArray(analysis.generated_resume_bullets);
                const { suggestions, outreachMessage } = parseSuggestions(analysis.suggestions_json);
                const isFocused = analysis.id === latestAnalysisId;

                return (
                  <article key={analysis.id} className={`rounded-[24px] border p-6 ${isFocused ? "border-accent bg-white/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job?.job_title || "未命名岗位"}</h3>
                        <p className="mt-1 text-sm text-slate-300">公司：{job?.company_name || "未知公司"} · 简历：{resume?.original_file_name || "未知简历"} · 生成时间：{formatDate(analysis.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="rounded-full bg-accent/20 px-4 py-2 text-sm font-semibold text-accent-light">匹配分：{analysis.match_score ?? "-"}</div>
                        <Link href={`/applications?analysisId=${analysis.id}`} className="btn-secondary">
                          记录这次投递
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">自我介绍</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{analysis.generated_intro || "当前没有生成自我介绍。"}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">打招呼 / 投递附言</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{outreachMessage || "当前没有生成投递附言。"}</p>
                      </div>
                      <ListBlock title="简历修改建议" items={bullets} emptyText="当前没有生成简历修改建议。" />
                      <div className="grid gap-4 md:grid-cols-3">
                        <ListBlock title="匹配优势" items={strengths} emptyText="当前没有识别出匹配优势。" />
                        <ListBlock title="能力差距" items={gaps} emptyText="当前没有识别出能力差距。" />
                        <ListBlock title="优化建议" items={suggestions} emptyText="当前没有识别出优化建议。" />
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/applications" className="card-secondary">
            <span className="block text-lg font-semibold text-slate-950">查看投递记录</span>
            记录是否使用了 AI 建议，以及后续回复、面试和 offer 结果。
          </Link>
          <Link href="/resume" className="card-secondary">
            <span className="block text-lg font-semibold text-slate-950">管理简历</span>
            在这里维护你的基础简历版本，设置默认简历供后续快速使用。
          </Link>
          <Link href="/analysis" className="card-secondary">
            <span className="block text-lg font-semibold text-slate-950">查看历史分析</span>
            如果你想单独管理分析记录，也可以继续使用原有分析页。
          </Link>
        </section>
      </div>
    </main>
  );
}
