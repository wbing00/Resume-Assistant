import Link from "next/link";

import { signOut } from "@/app/login/actions";
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
    return "Not set";
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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f3ea_0%,_#f1ede3_48%,_#ebe4d7_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Applications workspace</p>
            <h1 className="text-3xl font-semibold text-slate-950">Track applications and real outcomes</h1>
            <p className="text-sm leading-7 text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{profile.email}</span>. Turn match analyses into tracked applications and record the feedback loop.
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
              <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-slate-600">{params.message ?? ""}</div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-black/10 bg-white/70 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Applications</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{summaryMetrics.total}</p>
          </article>
          <article className="rounded-[24px] border border-black/10 bg-white/70 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Used AI suggestions</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{summaryMetrics.usedAi}</p>
          </article>
          <article className="rounded-[24px] border border-black/10 bg-white/70 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Interviewing</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{summaryMetrics.interviewing}</p>
          </article>
          <article className="rounded-[24px] border border-black/10 bg-white/70 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Offers</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{summaryMetrics.offers}</p>
          </article>
        </section>

        <section className="rounded-[28px] border border-black/10 bg-white/80 p-8 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Create record</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Create an application record</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Link an analysis to a real application so you can later compare generated suggestions against actual responses.
              </p>
            </div>
            <form action={createApplication} className="space-y-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Analysis</span>
                <select
                  name="analysisId"
                  defaultValue={params.analysisId ?? ""}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <option value="">No linked analysis</option>
                  {analysisList.map((analysis) => {
                    const job = jobMap.get(analysis.jd_id);
                    const resume = resumeMap.get(analysis.resume_id);

                    return (
                      <option key={analysis.id} value={analysis.id}>
                        {(job?.job_title || "Untitled role") +
                          " / " +
                          (job?.company_name || "Unknown company") +
                          " / " +
                          (resume?.original_file_name || "Unknown resume")}
                      </option>
                    );
                  })}
                </select>
              </label>

              {selectedAnalysis ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
                  This record will be linked to analysis <span className="font-medium">{selectedAnalysis.id.slice(0, 8)}</span>.
                  {selectedJob
                    ? ` Prefilled company and role are based on ${selectedJob.company_name || "the selected company"} / ${selectedJob.job_title || "the selected role"}.`
                    : ""}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Company</span>
                  <input
                    name="companyName"
                    required
                    defaultValue={selectedJob?.company_name ?? ""}
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Job title</span>
                  <input
                    name="jobTitle"
                    required
                    defaultValue={selectedJob?.job_title ?? ""}
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Channel</span>
                  <input
                    name="channel"
                    placeholder="Boss / LinkedIn / Email"
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Applied at</span>
                  <input
                    name="appliedAt"
                    type="datetime-local"
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Status</span>
                  <select
                    name="status"
                    defaultValue={selectedAnalysis ? "applied" : "draft"}
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  name="usedAiSuggestion"
                  type="checkbox"
                  defaultChecked={Boolean(selectedAnalysis)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                I used the AI-generated resume or message suggestions
              </label>

              <button type="submit" className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                Create application record
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-8 text-white shadow-[0_12px_50px_rgba(20,33,61,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Application history</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tracked outcomes</h2>
            </div>
            <p className="text-sm text-slate-400">Update status and feed real outcomes back into the product.</p>
          </div>

          <div className="mt-6 space-y-5">
            {applicationList.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
                No application records yet. Create one above after generating an analysis.
              </div>
            ) : (
              applicationList.map((application) => {
                const linkedAnalysis = application.analysis_id ? analysisMap.get(application.analysis_id) : null;
                const linkedFeedback = feedbackMap.get(application.id);
                const linkedJob = linkedAnalysis ? jobMap.get(linkedAnalysis.jd_id) : null;
                const linkedResume = linkedAnalysis ? resumeMap.get(linkedAnalysis.resume_id) : null;

                return (
                  <article key={application.id} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{application.job_title}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {application.company_name} / {application.channel || "Unknown channel"} / Applied {formatDate(application.applied_at)}
                        </p>
                      </div>
                      <div className="rounded-full bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200">
                        Status: {application.status}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-7 text-slate-300">
                          <p>
                            <span className="text-slate-400">Used AI suggestions:</span> {application.used_ai_suggestion ? "Yes" : "No"}
                          </p>
                          <p>
                            <span className="text-slate-400">Linked analysis:</span> {linkedAnalysis ? `Score ${linkedAnalysis.match_score ?? "-"}` : "Not linked"}
                          </p>
                          <p>
                            <span className="text-slate-400">Linked resume:</span> {linkedResume?.original_file_name || "Not linked"}
                          </p>
                          <p>
                            <span className="text-slate-400">Linked JD:</span> {linkedJob?.job_title || "Not linked"}
                          </p>
                        </div>

                        <form action={updateApplicationStatus} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <input type="hidden" name="applicationId" value={application.id} />
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Update status</span>
                            <div className="flex gap-3">
                              <select
                                name="status"
                                defaultValue={application.status}
                                className="block flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
                              >
                                {statuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
                                Save
                              </button>
                            </div>
                          </label>
                        </form>
                      </div>

                      <form action={saveFeedback} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <input type="hidden" name="applicationId" value={application.id} />
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Feedback loop</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Response result</span>
                            <input
                              name="responseResult"
                              defaultValue={linkedFeedback?.response_result ?? ""}
                              placeholder="No response / Replied / Rejected"
                              className="block w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">Interview stage</span>
                            <input
                              name="interviewStage"
                              defaultValue={linkedFeedback?.interview_stage ?? ""}
                              placeholder="HR / First round / Final"
                              className="block w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-200">User rating</span>
                            <select
                              name="userRating"
                              defaultValue={linkedFeedback?.user_rating?.toString() ?? ""}
                              className="block w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
                            >
                              <option value="">No rating</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </label>
                        </div>
                        <label className="mt-4 block space-y-2">
                          <span className="text-sm font-medium text-slate-200">Comment</span>
                          <textarea
                            name="userComment"
                            rows={4}
                            defaultValue={linkedFeedback?.user_comment ?? ""}
                            placeholder="What actually happened after the application?"
                            className="block w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-7 text-white"
                          />
                        </label>
                        <button type="submit" className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
                          Save feedback
                        </button>
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
