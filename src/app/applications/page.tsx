import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { FormPendingHint, SubmitButton } from "@/components/ui/submit-button";
import { getCurrentProfile } from "@/lib/auth";
import type {
  AnalysisRecord,
  ApplicationRecord,
  FeedbackRecord,
  JobDescriptionRecord,
  ResumeRecord,
} from "@/types";

import { createApplication, saveFeedback, updateApplicationStatus } from "./actions";

function formatDate(value: string | null) {
  if (!value) {
    return "未设置";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const statuses = ["draft", "applied", "responded", "interviewing", "rejected", "offer"] as const;
const statusLabels: Record<string, string> = {
  draft: "草稿",
  applied: "已投递",
  responded: "已回复",
  interviewing: "面试中",
  rejected: "已拒绝",
  offer: "已录用",
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; analysisId?: string }>;
}) {
  const { supabase, profile } = await getCurrentProfile();
  const params = await searchParams;

  const [
    { data: analyses, error: analysesError },
    { data: applications, error: applicationsError },
    { data: feedbacks, error: feedbacksError },
    { data: jobs, error: jobsError },
    { data: resumes, error: resumesError },
  ] = await Promise.all([
    supabase
      .from("analyses")
      .select(
        "id, user_id, resume_id, jd_id, match_score, strengths_json, gaps_json, suggestions_json, generated_intro, generated_resume_bullets, created_at, updated_at",
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("applications")
      .select("id, user_id, analysis_id, company_name, job_title, channel, applied_at, used_ai_suggestion, status, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("feedbacks")
      .select("id, user_id, application_id, response_result, interview_stage, user_rating, user_comment, created_at, updated_at")
      .eq("user_id", profile.id),
    supabase
      .from("job_descriptions")
      .select("id, user_id, raw_text, company_name, job_title, structured_json, created_at, updated_at")
      .eq("user_id", profile.id),
    supabase
      .from("resumes")
      .select("id, user_id, original_file_name, is_default, created_at, updated_at, parsed_text, structured_json, file_path")
      .eq("user_id", profile.id),
  ]);

  if (analysesError) throw new Error(analysesError.message);
  if (applicationsError) throw new Error(applicationsError.message);
  if (feedbacksError) throw new Error(feedbacksError.message);
  if (jobsError) throw new Error(jobsError.message);
  if (resumesError) throw new Error(resumesError.message);

  const analysisList = (analyses ?? []) as AnalysisRecord[];
  const applicationList = (applications ?? []) as ApplicationRecord[];
  const feedbackList = (feedbacks ?? []) as FeedbackRecord[];
  const jobList = (jobs ?? []) as JobDescriptionRecord[];
  const resumeList = (resumes ?? []) as ResumeRecord[];

  const analysisMap = new Map(analysisList.map((analysis) => [analysis.id, analysis]));
  const feedbackMap = new Map(feedbackList.map((feedback) => [feedback.application_id, feedback]));
  const jobMap = new Map(jobList.map((job) => [job.id, job]));
  const resumeMap = new Map(resumeList.map((resume) => [resume.id, resume]));

  const selectedAnalysis = params.analysisId ? analysisMap.get(params.analysisId) : undefined;
  const selectedJob = selectedAnalysis ? jobMap.get(selectedAnalysis.jd_id) : undefined;

  const summaryMetrics = {
    total: applicationList.length,
    usedAi: applicationList.filter((application) => application.used_ai_suggestion).length,
    interviewing: applicationList.filter((application) => application.status === "interviewing").length,
    offers: applicationList.filter((application) => application.status === "offer").length,
  };

  return (
    <main className="page-shell">
      <div className="page-wrap">
        <header className="page-header">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">投递记录</p>
            <h1 className="text-3xl font-semibold text-text-strong">记录投递过程与真实结果</h1>
            <p className="text-sm leading-7 text-text-secondary">
              当前账号：<span className="font-medium text-text-primary">{profile.email}</span>。把匹配分析转成真实投递记录，并持续回填反馈。
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
              <button type="submit" className="btn-secondary">
                退出登录
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-text-secondary">{params.message ?? ""}</div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">投递总数</p>
            <p className="mt-3 text-3xl font-semibold text-text-strong">{summaryMetrics.total}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">使用 AI 建议</p>
            <p className="mt-3 text-3xl font-semibold text-text-strong">{summaryMetrics.usedAi}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">面试中</p>
            <p className="mt-3 text-3xl font-semibold text-text-strong">{summaryMetrics.interviewing}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Offer</p>
            <p className="mt-3 text-3xl font-semibold text-text-strong">{summaryMetrics.offers}</p>
          </article>
        </section>

        <section className="content-section">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">新建记录</p>
          <div className="mt-3 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-text-strong">创建投递记录</h2>
              <p className="mt-2 text-lg leading-8 text-text-secondary">
                将分析结果与真实投递关联起来，方便后续比较 AI 建议与实际结果。
              </p>
            </div>
            <form action={createApplication} className="space-y-6 rounded-[24px] border border-border-light bg-surface-medium p-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-primary">关联分析</span>
                <select
                  name="analysisId"
                  defaultValue={params.analysisId ?? ""}
                  className="select-primary"
                >
                  <option value="">不关联分析</option>
                  {analysisList.map((analysis) => {
                    const job = jobMap.get(analysis.jd_id);
                    const resume = resumeMap.get(analysis.resume_id);

                    return (
                      <option key={analysis.id} value={analysis.id}>
                        {(job?.job_title || "未命名岗位") +
                          " / " +
                          (job?.company_name || "未知公司") +
                          " / " +
                          (resume?.original_file_name || "未知简历")}
                      </option>
                    );
                  })}
                </select>
              </label>

              {selectedAnalysis ? (
                <div className="panel-note">
                  该记录将关联分析 <span className="font-medium">{selectedAnalysis.id.slice(0, 8)}</span>。
                  {selectedJob
                    ? ` 公司和岗位已根据所选分析自动预填：${selectedJob.company_name || "所选公司"} / ${selectedJob.job_title || "所选岗位"}。`
                    : ""}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">公司</span>
                  <input
                    name="companyName"
                    required
                    defaultValue={selectedJob?.company_name ?? ""}
                    className="input-primary"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">岗位名称</span>
                  <input
                    name="jobTitle"
                    required
                    defaultValue={selectedJob?.job_title ?? ""}
                    className="input-primary"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">投递渠道</span>
                  <input
                    name="channel"
                    placeholder="Boss / LinkedIn / Email"
                    className="input-primary"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">投递时间</span>
                  <input
                    name="appliedAt"
                    type="datetime-local"
                    className="input-primary"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">状态</span>
                  <select
                    name="status"
                    defaultValue={selectedAnalysis ? "applied" : "draft"}
                    className="select-primary"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm text-text-primary">
                <input
                  name="usedAiSuggestion"
                  type="checkbox"
                  defaultChecked={Boolean(selectedAnalysis)}
                  className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/20"
                />
                我实际采用了 AI 生成的简历或沟通建议
              </label>

              <SubmitButton className="btn-primary w-full" pendingText="正在创建投递记录...">
                创建投递记录
              </SubmitButton>
              <FormPendingHint text="保存后页面会刷新并显示最新记录。" />
            </form>
          </div>
        </section>

        <section className="card-medium">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">投递历史</p>
              <h2 className="mt-2 text-2xl font-semibold text-text-strong">结果追踪</h2>
            </div>
            <p className="text-sm text-text-secondary">更新状态并将真实结果回填到产品中。</p>
          </div>

          <div className="mt-6 space-y-5">
            {applicationList.length === 0 ? (
              <div className="rounded-2xl border border-border-light bg-surface-dark p-6 text-sm leading-7 text-text-primary">
                还没有投递记录。可先从分析页进入，或在上方手动创建。
              </div>
            ) : (
              applicationList.map((application) => {
                const linkedAnalysis = application.analysis_id ? analysisMap.get(application.analysis_id) : null;
                const linkedFeedback = feedbackMap.get(application.id);
                const linkedJob = linkedAnalysis ? jobMap.get(linkedAnalysis.jd_id) : null;
                const linkedResume = linkedAnalysis ? resumeMap.get(linkedAnalysis.resume_id) : null;

                return (
                  <article key={application.id} className="rounded-[24px] border border-border-light bg-surface p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-text-strong">{application.job_title}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          {application.company_name} / {application.channel || "未知渠道"} / 投递于 {formatDate(application.applied_at)}
                        </p>
                      </div>
                      <div className="info-chip">
                        状态：{application.status}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div className="result-card">
                          <p>
                            <span className="text-text-secondary">使用 AI 建议:</span> {application.used_ai_suggestion ? "是" : "否"}
                          </p>
                          <p>
                            <span className="text-text-secondary">关联分析：</span> {linkedAnalysis ? `匹配分 ${linkedAnalysis.match_score ?? "-"}` : "未关联"}
                          </p>
                          <p>
                            <span className="text-text-secondary">关联简历：</span> {linkedResume?.original_file_name || "未关联"}
                          </p>
                          <p>
                            <span className="text-text-secondary">关联 JD：</span> {linkedJob?.job_title || "未关联"}
                          </p>
                        </div>

                        <form action={updateApplicationStatus} className="result-card">
                          <input type="hidden" name="applicationId" value={application.id} />
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-text-primary">更新状态</span>
                            <div className="flex gap-3">
                              <select
                                name="status"
                                defaultValue={application.status}
                                className="select-primary flex-1"
                              >
                                {statuses.map((status) => (
                                  <option key={status} value={status}>
                                    {statusLabels[status]}
                                  </option>
                                ))}
                              </select>
                              <SubmitButton className="btn-secondary" pendingText="保存中...">
                                保存
                              </SubmitButton>
                            </div>
                          </label>
                        </form>
                      </div>

                      <form action={saveFeedback} className="result-card-muted">
                        <input type="hidden" name="applicationId" value={application.id} />
                        <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">反馈回填</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-text-primary">回复结果</span>
                            <input
                              name="responseResult"
                              defaultValue={linkedFeedback?.response_result ?? ""}
                              placeholder="未回复 / 已回复 / 已拒绝"
                              className="input-primary"
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-text-primary">面试阶段</span>
                            <input
                              name="interviewStage"
                              defaultValue={linkedFeedback?.interview_stage ?? ""}
                              placeholder="HR / 一面 / 终面"
                              className="input-primary"
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-text-primary">主观评分</span>
                            <select
                              name="userRating"
                              defaultValue={linkedFeedback?.user_rating?.toString() ?? ""}
                              className="select-primary"
                            >
                              <option value="">未评分</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </label>
                        </div>
                        <label className="mt-4 block space-y-2">
                          <span className="text-sm font-medium text-text-primary">备注</span>
                          <textarea
                            name="userComment"
                            rows={4}
                            defaultValue={linkedFeedback?.user_comment ?? ""}
                            placeholder="记录这次投递之后实际发生了什么"
                            className="textarea-primary"
                          />
                        </label>
                        <SubmitButton className="btn-secondary mt-4" pendingText="保存中...">
                          保存反馈
                        </SubmitButton>
                      </form>
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
