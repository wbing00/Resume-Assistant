import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border-light bg-surface/50">
      <div className="page-wrap max-w-6xl py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10" />
              <span className="text-lg font-semibold text-text-strong">JobMatch AI</span>
            </div>
            <p className="mt-4 max-w-md text-sm text-text-secondary">
              AI-powered job application platform for resume optimization, job matching, and application tracking.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary">产品</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/apply"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  快速投递
                </Link>
              </li>
              <li>
                <Link
                  href="/applications"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  投递记录
                </Link>
              </li>
              <li>
                <Link
                  href="/analysis"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  历史分析
                </Link>
              </li>
              <li>
                <Link
                  href="/resume"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  简历管理
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary">支持</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/feedback"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  反馈建议
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback/list"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  我的反馈
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@jobmatch.ai"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  联系支持
                </a>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  管理面板
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border-light pt-8 md:flex-row">
          <p className="text-sm text-text-secondary">
            © {currentYear} JobMatch AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/feedback"
              className="text-sm text-primary hover:text-primary-dark"
            >
              提供反馈
            </Link>
            <span className="text-text-secondary">•</span>
            <a
              href="#"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              隐私政策
            </a>
            <span className="text-text-secondary">•</span>
            <a
              href="#"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              服务条款
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}