import Link from "next/link";

import { FeedbackForm } from "@/components/ui/FeedbackForm";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function FeedbackPage() {
  await requireAuthenticatedUser();

  return (
    <main className="page-shell">
      <section className="page-wrap max-w-4xl">
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
          <h1 className="text-4xl font-bold text-text-strong">用户反馈</h1>
          <p className="mt-4 text-lg leading-8 text-text-secondary">
            感谢您花时间提供反馈。您的意见对我们改进产品至关重要。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FeedbackForm />
          </div>

          <aside className="space-y-6">
            <div className="card-secondary">
              <h3 className="text-lg font-semibold text-text-primary">反馈类型说明</h3>
              <ul className="mt-4 space-y-3 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>
                    <strong>Bug报告</strong>：功能异常、错误、崩溃等问题
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>
                    <strong>功能建议</strong>：新功能需求或现有功能改进
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>
                    <strong>UI改进</strong>：界面设计、布局、交互体验问题
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>
                    <strong>使用体验</strong>：整体使用感受、流程问题
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>
                    <strong>其他</strong>：不属于以上分类的反馈
                  </span>
                </li>
              </ul>
            </div>

            <div className="card-secondary">
              <h3 className="text-lg font-semibold text-text-primary">反馈处理流程</h3>
              <ol className="mt-4 space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-medium text-xs font-medium">
                    1
                  </span>
                  <span>提交反馈后，系统会自动分配一个反馈ID</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-medium text-xs font-medium">
                    2
                  </span>
                  <span>我们的团队会在1-3个工作日内查看您的反馈</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-medium text-xs font-medium">
                    3
                  </span>
                  <span>您可以在“我的反馈”页面查看处理状态和回复</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-medium text-xs font-medium">
                    4
                  </span>
                  <span>对于重要反馈，我们可能会通过邮件与您进一步沟通</span>
                </li>
              </ol>
            </div>

            <div className="card-secondary">
              <h3 className="text-lg font-semibold text-text-primary">查看历史反馈</h3>
              <p className="mt-2 text-sm text-text-secondary">
                您可以随时查看之前提交的反馈及其处理状态。
              </p>
              <div className="mt-4">
                <Link
                  href="/feedback/list"
                  className="black-border-button w-full text-center"
                >
                  查看我的反馈
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12 rounded-2xl border border-border-light bg-surface/50 p-6">
          <h3 className="text-lg font-semibold text-text-primary">隐私说明</h3>
          <p className="mt-2 text-sm text-text-secondary">
            我们尊重您的隐私。提交的反馈仅用于产品改进目的，不会与第三方共享您的个人信息。
            反馈内容可能会被匿名化后用于内部分析和产品路线图规划。
          </p>
        </div>
      </section>
    </main>
  );
}
