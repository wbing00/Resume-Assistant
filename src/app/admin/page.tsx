import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type EventRecord = {
  id: string;
  user_id: string | null;
  event_name: string;
  event_payload: Record<string, unknown>;
  created_at: string;
};

type CountResult = {
  count: number;
};

function formatPercent(numerator: number, denominator: number) {
  if (!denominator) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getUniqueCount(rows: Array<{ user_id: string | null }> | null | undefined) {
  return new Set((rows ?? []).map((row) => row.user_id).filter((value): value is string => Boolean(value))).size;
}

async function getTableCount(table: string): Promise<CountResult> {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin.from(table).select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return { count: count ?? 0 };
}

export default async function AdminPage() {
  const { profile } = await requireRole("admin");
  const admin = createSupabaseAdminClient();

  const [
    profilesCount,
    resumesCount,
    jdCount,
    analysesCount,
    applicationsCount,
    feedbacksCount,
    eventsCount,
    userFeedbacksCount,
    resumesUsersResult,
    jdUsersResult,
    analysisUsersResult,
    applicationRowsResult,
    feedbackUsersResult,
    userFeedbacksResult,
    recentEventsResult,
  ] = await Promise.all([
    getTableCount("profiles"),
    getTableCount("resumes"),
    getTableCount("job_descriptions"),
    getTableCount("analyses"),
    getTableCount("applications"),
    getTableCount("feedbacks"),
    getTableCount("events"),
    getTableCount("user_feedbacks"),
    admin.from("resumes").select("user_id"),
    admin.from("job_descriptions").select("user_id"),
    admin.from("analyses").select("user_id"),
    admin.from("applications").select("id, user_id, status, used_ai_suggestion"),
    admin.from("feedbacks").select("user_id"),
    admin.from("user_feedbacks").select("id, user_id, feedback_type, status, rating, created_at"),
    admin
      .from("events")
      .select("id, user_id, event_name, event_payload, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (resumesUsersResult.error) throw new Error(resumesUsersResult.error.message);
  if (jdUsersResult.error) throw new Error(jdUsersResult.error.message);
  if (analysisUsersResult.error) throw new Error(analysisUsersResult.error.message);
  if (applicationRowsResult.error) throw new Error(applicationRowsResult.error.message);
  if (feedbackUsersResult.error) throw new Error(feedbackUsersResult.error.message);
  if (userFeedbacksResult.error) throw new Error(userFeedbacksResult.error.message);
  if (recentEventsResult.error) throw new Error(recentEventsResult.error.message);

  const applicationRows = applicationRowsResult.data ?? [];
  const recentEvents = (recentEventsResult.data ?? []) as EventRecord[];

  const totalUsers = profilesCount.count;
  const usersWithResume = getUniqueCount(resumesUsersResult.data);
  const usersWithJd = getUniqueCount(jdUsersResult.data);
  const usersWithAnalysis = getUniqueCount(analysisUsersResult.data);
  const usersWithApplication = getUniqueCount(applicationRows.map((row) => ({ user_id: row.user_id })));
  const usersWithFeedback = getUniqueCount(feedbackUsersResult.data);
  const usersWithUserFeedback = getUniqueCount(userFeedbacksResult.data);

  // Calculate user feedback statistics
  const userFeedbacks = userFeedbacksResult.data ?? [];
  const feedbacksByStatus = userFeedbacks.reduce((acc, fb) => {
    acc[fb.status] = (acc[fb.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ratings = userFeedbacks
    .map(fb => fb.rating)
    .filter((rating): rating is number => rating !== null && rating > 0);
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : 0;

  const applicationsUsingAi = applicationRows.filter((row) => row.used_ai_suggestion).length;
  const respondedCount = applicationRows.filter((row) => ["responded", "interviewing", "rejected", "offer"].includes(row.status)).length;

  const headlineMetrics = [
    { label: "总用户数", value: totalUsers.toString(), hint: "已创建资料的账号数" },
    { label: "分析次数", value: analysesCount.count.toString(), hint: "已生成的简历-JD 分析数" },
    { label: "投递记录数", value: applicationsCount.count.toString(), hint: "已记录的投递条数" },
    { label: "用户反馈数", value: userFeedbacksCount.count.toString(), hint: `${userFeedbacksCount.count} 条产品反馈` },
  ];

  const funnelSteps = [
    { label: "已注册", value: totalUsers, helper: "账号资料" },
    { label: "上传简历", value: usersWithResume, helper: `${resumesCount.count} 份简历文件` },
    { label: "提交 JD", value: usersWithJd, helper: `${jdCount.count} 条 JD 记录` },
    { label: "生成分析", value: usersWithAnalysis, helper: `${analysesCount.count} 次分析` },
    { label: "创建投递", value: usersWithApplication, helper: `${applicationsCount.count} 条投递记录` },
    { label: "保存投递反馈", value: usersWithFeedback, helper: `${feedbacksCount.count} 条投递反馈记录` },
    { label: "提供产品反馈", value: usersWithUserFeedback, helper: `${userFeedbacksCount.count} 条产品反馈记录` },
  ];

  const performanceMetrics = [
    { label: "建议采纳率", value: formatPercent(applicationsUsingAi, applicationsCount.count), hint: `${applicationsUsingAi} 条记录标记为使用了 AI 建议` },
    { label: "获得后续反馈率", value: formatPercent(respondedCount, applicationsCount.count), hint: `${respondedCount} 条记录已进入回复或后续阶段` },
    { label: "用户反馈平均评分", value: averageRating > 0 ? averageRating.toFixed(1) + "⭐" : "暂无", hint: `${ratings.length} 条反馈包含评分` },
    { label: "用户反馈解决率", value: formatPercent(feedbacksByStatus["completed"] || 0, userFeedbacksCount.count), hint: `${feedbacksByStatus["completed"] || 0} 条反馈已解决` },
    { label: "事件总量", value: eventsCount.count.toString(), hint: "已记录的产品事件" },
  ];

  return (
    <main className="page-shell">
      <div className="page-wrap">
        <header className="page-header flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">管理看板</p>
            <h1 className="text-3xl font-semibold text-text-strong">产品管理看板</h1>
            <p className="text-sm leading-7 text-text-secondary">
              当前账号：<span className="font-medium text-text-primary">{profile.email}</span>。这里展示的是产品验证所需的整体数据。
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {headlineMetrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <p className="text-sm text-text-secondary">{metric.label}</p>
              <p className="mt-4 text-3xl font-semibold text-text-strong">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{metric.hint}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="card-medium">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">转化漏斗</p>
            <h2 className="mt-3 text-2xl font-semibold text-text-strong">用户在闭环中的推进情况</h2>
            <div className="mt-6 space-y-4">
              {funnelSteps.map((step, index) => {
                const previousValue = index === 0 ? totalUsers : funnelSteps[index - 1].value;
                const conversion = index === 0 ? "100%" : formatPercent(step.value, previousValue);

                return (
                  <div key={step.label} className="result-card-muted">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-text-secondary">{step.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-text-strong">{step.value}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">步骤转化率</p>
                        <p className="mt-2 text-lg font-semibold text-primary">{conversion}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">{step.helper}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="card-medium">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">结果指标</p>
            <h2 className="mt-3 text-2xl font-semibold text-text-strong">采纳与结果表现</h2>
            <div className="mt-6 space-y-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.label} className="result-card-muted">
                  <p className="text-sm text-text-secondary">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-text-strong">{metric.value}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{metric.hint}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="card-medium">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">最近事件</p>
              <h2 className="mt-3 text-2xl font-semibold text-text-strong">最近记录的产品行为</h2>
            </div>
            <p className="text-sm text-text-secondary">这里展示的是最近发生的真实产品行为。</p>
          </div>

          <div className="mt-6 space-y-4">
            {recentEvents.length === 0 ? (
              <div className="result-card-muted">
                当前还没有事件数据。完成上传、分析、投递和反馈后，这里会出现记录。
              </div>
            ) : (
              recentEvents.map((event) => (
                <article key={event.id} className="result-card-muted">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-strong">{event.event_name}</p>
                      <p className="mt-1 text-sm text-text-secondary">用户：{event.user_id ?? "匿名"}</p>
                    </div>
                    <p className="text-sm text-text-secondary">{formatDate(event.created_at)}</p>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-border-light bg-surface p-4 text-xs leading-6 text-text-secondary">
                    {JSON.stringify(event.event_payload, null, 2)}
                  </pre>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

