import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { DeleteButton } from "@/components/ui/delete-button";
import { FormPendingHint, SubmitButton } from "@/components/ui/submit-button";
import { getCurrentProfile } from "@/lib/auth";
import type { JobDescriptionRecord, JsonValue } from "@/types";

import { createJobDescriptionAnalysis, deleteJobDescription } from "./actions";

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

function isObject(value: JsonValue | undefined | null): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: JsonValue | undefined | null): JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: JsonValue | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: JsonValue | undefined | null): string[] {
  return asArray(value)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeJobDescription(structured: JsonValue | null) {
  const object = isObject(structured) ? structured : {};

  return {
    summary:
      asString(object.summary) ||
      asString(object.overview) ||
      asString(object.description) ||
      "当前没有生成岗位概览。",
    responsibilities: stringList(object.responsibilities ?? object.key_responsibilities),
    requiredSkills: stringList(object.required_skills ?? object.must_have_skills ?? object.skills),
    preferredSkills: stringList(object.preferred_skills ?? object.nice_to_have_skills),
    qualifications: stringList(object.qualifications ?? object.requirements),
    keywords: stringList(object.keywords ?? object.tags),
    raw: object,
  };
}

function ListSection({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
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

export default async function JobDescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { supabase, profile } = await getCurrentProfile();
  const params = await searchParams;
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("id, user_id, raw_text, company_name, job_title, structured_json, created_at, updated_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const jobs = (data ?? []) as JobDescriptionRecord[];

  return (
    <main className="page-shell">
      <div className="page-wrap">
        <header className="page-header">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">岗位 JD 解析</p>
            <h1 className="text-3xl font-semibold text-text-strong">粘贴并解析目标岗位 JD</h1>
            <p className="text-sm leading-7 text-text-secondary">
              当前账号：<span className="font-medium text-text-primary">{profile.email}</span>。粘贴岗位描述后，系统会提取后续匹配所需的岗位要求。
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
              <h2 className="text-2xl font-semibold text-text-strong">创建 JD 解析记录</h2>
              <p className="mt-2 text-lg leading-8 text-text-secondary">
                从原始岗位描述开始，系统会提取岗位名称、公司、职责、必备技能、加分项、任职要求和关键词。
              </p>
            </div>
            <form action={createJobDescriptionAnalysis} className="space-y-6 rounded-[24px] border border-border-light bg-surface-medium p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">公司名称</span>
                  <input
                    name="companyName"
                    type="text"
                    placeholder="可选覆盖"
                    className="input-primary"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text-primary">岗位名称</span>
                  <input
                    name="jobTitle"
                    type="text"
                    placeholder="可选覆盖"
                    className="input-primary"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-text-primary">JD 原文</span>
                <textarea
                  name="rawText"
                  required
                  rows={16}
                  placeholder="在这里粘贴完整岗位描述"
                  className="textarea-primary"
                />
              </label>

              <SubmitButton className="btn-primary w-full" pendingText="正在解析 JD...">
                解析 JD
              </SubmitButton>
              <FormPendingHint text="JD 解析通常需要几秒到十几秒，请勿重复点击。" />
            </form>
          </div>
        </section>

        <section className="card-medium">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">JD 列表</p>
              <h2 className="mt-2 text-2xl font-semibold text-text-strong">提取出的岗位要求</h2>
            </div>
            <p className="text-sm text-text-secondary">查看每条 JD 对应的结构化结果。</p>
          </div>

          <div className="mt-6 space-y-5">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-border-light bg-surface-dark p-6 text-sm leading-7 text-text-primary">
                还没有 JD 记录。先新增一条岗位描述，再继续匹配分析。
              </div>
            ) : (
              jobs.map((job) => {
                const normalized = normalizeJobDescription(job.structured_json);

                return (
                  <article key={job.id} className="rounded-[24px] border border-border-light bg-surface p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-text-strong">{job.job_title || "未命名岗位"}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          {job.company_name || "未知公司"} · 解析时间：{formatDate(job.created_at)}
                        </p>
                      </div>
                      <DeleteButton
                        action={deleteJobDescription}
                        id={job.id}
                        idName="jdId"
                        confirmMessage="确定要删除这条JD记录吗？此操作将同时删除相关的分析记录。"
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div className="result-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">岗位概览</p>
                          <p className="mt-3 text-sm leading-7 text-text-primary">{normalized.summary}</p>
                        </div>

                        <div className="result-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">关键词</p>
                          {normalized.keywords.length === 0 ? (
                            <p className="mt-3 text-sm leading-7 text-text-secondary">当前没有映射出关键词。</p>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {normalized.keywords.map((keyword) => (
                                <span key={keyword} className="rounded-full border border-border-light bg-surface-medium px-3 py-1 text-sm text-text-primary">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ListSection title="岗位职责" items={normalized.responsibilities} emptyText="当前没有映射出岗位职责。" />
                        <ListSection title="必备技能" items={normalized.requiredSkills} emptyText="当前没有映射出必备技能。" />
                        <ListSection title="加分项" items={normalized.preferredSkills} emptyText="当前没有映射出加分项。" />
                        <ListSection title="任职要求" items={normalized.qualifications} emptyText="当前没有映射出任职要求。" />
                      </div>
                    </div>

                    <details className="result-card-muted mt-5">
                      <summary className="cursor-pointer text-sm font-medium text-text-primary">查看原始结构化 JSON</summary>
                      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-text-secondary">
                        {JSON.stringify(normalized.raw, null, 2)}
                      </pre>
                    </details>
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
