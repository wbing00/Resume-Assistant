import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { FormPendingHint, SubmitButton } from "@/components/ui/submit-button";
import { getCurrentProfile } from "@/lib/auth";
import type { JsonValue, ResumeRecord } from "@/types";

import { deleteResume, setDefaultResume, uploadResume } from "./actions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type JsonObject = Record<string, JsonValue>;

type DisplayEntry = {
  title: string;
  subtitle?: string;
  meta?: string;
  bullets: string[];
};

function isObject(value: JsonValue | undefined | null): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: JsonValue | undefined | null): JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: JsonValue | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmptyString(object: JsonObject, keys: string[]) {
  for (const key of keys) {
    const value = asString(object[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function stringList(value: JsonValue | undefined | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (isObject(item)) {
        return firstNonEmptyString(item, ["name", "label", "value", "skill", "title"]);
      }

      return "";
    })
    .filter(Boolean);
}

function toDisplayEntries(value: JsonValue | undefined | null): DisplayEntry[] {
  const entries: DisplayEntry[] = [];

  for (const item of asArray(value)) {
    if (!isObject(item)) {
      if (typeof item === "string" && item.trim()) {
        entries.push({
          title: item.trim(),
          bullets: [],
        });
      }

      continue;
    }

    const title =
      firstNonEmptyString(item, [
        "role",
        "title",
        "position",
        "name",
        "project",
        "project_name",
        "school",
        "company",
        "organization",
        "employer",
      ]) || "未命名条目";

    const subtitle = firstNonEmptyString(item, [
      "company",
      "organization",
      "employer",
      "school",
      "client",
    ]);

    const meta = firstNonEmptyString(item, ["duration", "date", "dates", "period", "time"]);

    const bullets = [
      ...stringList(item.highlights),
      ...stringList(item.achievements),
      ...stringList(item.responsibilities),
      ...stringList(item.description),
      ...stringList(item.details),
    ];

    entries.push({
      title,
      subtitle: subtitle || undefined,
      meta: meta || undefined,
      bullets,
    });
  }

  return entries;
}

function normalizeResume(structured: JsonValue | null) {
  const object = isObject(structured) ? structured : {};

  const summary = firstNonEmptyString(object, [
    "summary",
    "overview",
    "profile",
    "personal_summary",
    "professional_summary",
    "about",
  ]);

  const skills = [
    ...stringList(object.skills),
    ...stringList(object.skill_set),
    ...stringList(object.tech_stack),
    ...stringList(object.tools),
  ];

  const experience = toDisplayEntries(
    object.experience ?? object.work_experience ?? object.employment ?? object.internships,
  );

  const projects = toDisplayEntries(object.projects ?? object.project_experience ?? object.project_list);
  const education = toDisplayEntries(object.education ?? object.education_background ?? object.academics);

  return {
    summary,
    skills: Array.from(new Set(skills)),
    experience,
    projects,
    education,
    raw: object,
  };
}

function SectionCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: DisplayEntry[];
  emptyText: string;
}) {
  return (
    <div className="result-card-muted">
      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-text-secondary">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-xl border border-border-light bg-surface p-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-text-strong">{item.title}</h4>
                {item.subtitle ? <p className="text-sm text-text-secondary">{item.subtitle}</p> : null}
                {item.meta ? <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">{item.meta}</p> : null}
              </div>
              {item.bullets.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-text-primary">
                  {item.bullets.map((bullet, bulletIndex) => (
                    <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { supabase, profile } = await getCurrentProfile();
  const params = await searchParams;
  const { data, error } = await supabase
    .from("resumes")
    .select("id, user_id, file_path, original_file_name, parsed_text, structured_json, is_default, created_at, updated_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const resumes = (data ?? []) as ResumeRecord[];

  return (
    <main className="page-shell">
      <div className="page-wrap">
        <header className="page-header flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">简历管理</p>
            <h1 className="text-3xl font-semibold text-text-strong">上传并解析基础简历</h1>
            <p className="text-sm leading-7 text-text-secondary">
              当前账号：<span className="font-medium text-text-primary">{profile.email}</span>。当前支持 PDF、TXT、MD 文件。
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
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">上传</p>
          <div className="mt-3 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-text-strong">添加简历文件</h2>
              <p className="mt-2 text-lg leading-8 text-text-secondary">
                上传简历文件后，系统会解析并提取结构化信息。每个文件都私有存储在 Supabase Storage 中，解析为纯文本，并转换为结构化 JSON 供后续 JD 匹配使用。
              </p>
            </div>
            <form action={uploadResume} className="space-y-6 rounded-[24px] border border-border-light bg-surface-medium p-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-primary">简历文件</span>
                <input
                  name="resume"
                  type="file"
                  required
                  accept=".pdf,.txt,.md"
                  className="input-primary"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-text-primary">
                <input name="make默认" type="checkbox" className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/20" />
                上传后设为默认简历
              </label>

              <SubmitButton
                className="btn-primary w-full"
                pendingText="正在上传并解析..."
              >
                上传并解析
              </SubmitButton>
              <FormPendingHint text="文件上传和解析可能需要十几秒，请勿关闭页面。" />
            </form>
          </div>
        </section>

        <section className="card-medium">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">简历列表</p>
              <h2 className="mt-2 text-2xl font-semibold text-text-strong">解析结果</h2>
            </div>
            <p className="text-sm text-text-secondary">查看每份简历对应的结构化信息。</p>
          </div>

          <div className="mt-6 space-y-5">
            {resumes.length === 0 ? (
              <div className="result-card-muted">
                还没有上传简历。先上传一份基础简历，再继续后续分析。
              </div>
            ) : (
              resumes.map((resume) => {
                const normalized = normalizeResume(resume.structured_json);

                return (
                  <article key={resume.id} className="rounded-[24px] border border-border-light bg-surface p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-text-strong">{resume.original_file_name}</h3>
                        <p className="mt-1 text-sm text-text-secondary">上传时间：{formatDate(resume.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {resume.is_default ? (
                          <span className="badge-soft border-primary/20 bg-primary/10 text-primary">
                            默认
                          </span>
                        ) : (
                          <form action={setDefaultResume}>
                            <input type="hidden" name="resumeId" value={resume.id} />
                            <SubmitButton
                            className="btn-secondary px-3 py-1 text-xs"
                            pendingText="处理中..."
                          >
                            设为默认
                            </SubmitButton>
                          </form>
                        )}
                        <form action={deleteResume}>
                          <input type="hidden" name="resumeId" value={resume.id} />
                          <SubmitButton
                            className="btn-danger px-3 py-1 text-xs"
                            pendingText="删除中..."
                          >
                            删除
                          </SubmitButton>
                        </form>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="flex flex-col gap-8">
                        <div className="space-y-4">
                          <div className="result-card">
                            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">简历概览</p>
                            <p className="mt-3 text-sm leading-7 text-text-primary">
                              {normalized.summary || "当前没有映射出概览内容，可展开下方原始结构化结果查看。"}
                            </p>
                          </div>

                          <div className="result-card">
                            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">技能</p>
                            {normalized.skills.length === 0 ? (
                              <p className="mt-3 text-sm leading-7 text-text-secondary">当前没有映射出技能列表。</p>
                            ) : (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {normalized.skills.map((skill) => (
                                  <span key={skill} className="rounded-full border border-border-light bg-surface-medium px-3 py-1 text-sm text-text-primary">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <SectionCard title="经历" items={normalized.experience} emptyText="当前没有映射出工作或实习经历。" />
                          <SectionCard title="项目" items={normalized.projects} emptyText="当前没有映射出项目经历。" />
                          <SectionCard title="教育" items={normalized.education} emptyText="当前没有映射出教育经历。" />
                          <div className="result-card">
                            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">原始文本预览</p>
                            <p className="mt-3 line-clamp-[12] whitespace-pre-wrap text-sm leading-7 text-text-primary">
                              {resume.parsed_text || "当前没有保存解析文本。"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <details className="result-card-muted">
                        <summary className="cursor-pointer text-sm font-medium text-text-primary">查看原始结构化 JSON</summary>
                        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-text-secondary">
                          {JSON.stringify(normalized.raw, null, 2)}
                        </pre>
                      </details>
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
