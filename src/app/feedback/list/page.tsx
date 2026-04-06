import Link from "next/link";

import { getUserFeedbacks } from "@/app/feedback/actions";
import { requireAuthenticatedUser } from "@/lib/auth";
import type { FeedbackStatus, FeedbackType } from "@/types";

const statusColors: Record<FeedbackStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  planned: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels: Record<FeedbackStatus, string> = {
  new: "新提交",
  reviewed: "已查看",
  planned: "计划中",
  in_progress: "进行中",
  completed: "已完成",
  rejected: "已拒绝",
};

const typeLabels: Record<FeedbackType, string> = {
  bug: "Bug报告",
  feature: "功能建议",
  ui: "UI改进",
  experience: "使用体验",
  other: "其他",
};

const typeIcons: Record<FeedbackType, string> = {
  bug: "🐛",
  feature: "✨",
  ui: "🎨",
  experience: "😊",
  other: "📝",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function FeedbackListPage() {
  await requireAuthenticatedUser();
  const result = await getUserFeedbacks();

  return (
    <main className="page-shell">
      <section className="page-wrap max-w-6xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回首页
          </Link>
        </div>

        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-text-strong">我的反馈</h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                查看您提交的反馈及其处理状态。
              </p>
            </div>
            <Link
              href="/feedback"
              className="learn-more-button whitespace-nowrap"
              aria-label="提供新反馈"
            >
              <span className="learn-more-circle" aria-hidden="true">
                <span className="learn-more-icon learn-more-plus" />
              </span>
              <span className="learn-more-text">提供新反馈</span>
            </Link>
          </div>
        </div>

        {!result.success ? (
          <div className="card-primary">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/20">
                <svg
                  className="h-6 w-6 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-strong">加载失败</h3>
              <p className="mt-2 text-text-secondary">{result.message}</p>
              <div className="mt-6">
                <Link
                  href="/feedback/list"
                  className="btn-secondary"
                >
                  重试
                </Link>
              </div>
            </div>
          </div>
        ) : result.feedbacks.length === 0 ? (
          <div className="card-primary">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-medium">
                <svg
                  className="h-6 w-6 text-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-strong">暂无反馈记录</h3>
              <p className="mt-2 text-text-secondary">
                您还没有提交过任何反馈。点击“提供新反馈”按钮开始。
              </p>
              <div className="mt-6">
                <Link href="/feedback" className="btn-primary">
                  提供新反馈
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-border-light bg-surface/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-text-secondary">
                    共 <span className="font-semibold text-text-primary">{result.feedbacks.length}</span> 条反馈记录
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    新提交: {result.feedbacks.filter(f => f.status === "new").length}
                  </span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    已完成: {result.feedbacks.filter(f => f.status === "completed").length}
                  </span>
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                    进行中: {result.feedbacks.filter(f => f.status === "in_progress" || f.status === "planned").length}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {result.feedbacks.map((feedback) => (
                <div key={feedback.id} className="card-secondary">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{typeIcons[feedback.feedback_type]}</div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">
                              {feedback.title}
                            </h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[feedback.status]}`}>
                              {statusLabels[feedback.status]}
                            </span>
                            <span className="rounded-full bg-surface-medium px-3 py-1 text-xs text-text-secondary">
                              {typeLabels[feedback.feedback_type]}
                            </span>
                            {feedback.rating && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
                                {"⭐".repeat(feedback.rating)}
                              </span>
                            )}
                          </div>
                          
                          <p className="mt-3 text-text-secondary">
                            {feedback.description.length > 200
                              ? `${feedback.description.substring(0, 200)}...`
                              : feedback.description}
                          </p>
                          
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                            <span>提交时间: {formatDate(feedback.created_at)}</span>
                            <span>最后更新: {formatDate(feedback.updated_at)}</span>
                            <span>反馈ID: <code className="font-mono">{feedback.id.substring(0, 8)}...</code></span>
                          </div>

                          {feedback.admin_notes && (
                            <div className="mt-4 rounded-2xl border border-border-light bg-surface/50 p-4">
                              <p className="text-sm font-medium text-text-primary">管理员回复</p>
                              <p className="mt-1 text-sm text-text-secondary">{feedback.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <Link
                        href={`/feedback?view=${feedback.id}`}
                        className="black-border-button w-full text-center"
                      >
                        查看详情
                      </Link>
                      {feedback.status === "new" && (
                        <span className="rounded-2xl border border-border-light px-4 py-2 text-center text-sm text-text-secondary">
                          编辑功能即将上线
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <nav className="flex items-center gap-2">
                <button
                  className="rounded-2xl border border-border-light px-4 py-2 text-sm text-text-secondary hover:bg-surface"
                  disabled
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-sm text-text-secondary">第 1 页</span>
                <button
                  className="rounded-2xl border border-border-light px-4 py-2 text-sm text-text-secondary hover:bg-surface"
                  disabled
                >
                  下一页
                </button>
              </nav>
            </div>
          </>
        )}

        <div className="mt-12 rounded-2xl border border-border-light bg-surface/50 p-6">
          <h3 className="text-lg font-semibold text-text-primary">反馈状态说明</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${statusColors[status as FeedbackStatus].split(' ')[0]}`} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="text-xs text-text-secondary">
                    {status === "new" && "反馈已提交，等待处理"}
                    {status === "reviewed" && "反馈已被查看，正在评估"}
                    {status === "planned" && "反馈已被采纳，计划实现"}
                    {status === "in_progress" && "反馈正在处理中"}
                    {status === "completed" && "反馈已处理完成"}
                    {status === "rejected" && "反馈未被采纳"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
