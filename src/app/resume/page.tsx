import Link from "next/link";

import { signOut } from "@/app/login/actions";
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
      ]) || "Untitled";

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
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-slate-400">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                {item.subtitle ? <p className="text-sm text-slate-300">{item.subtitle}</p> : null}
                {item.meta ? <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.meta}</p> : null}
              </div>
              {item.bullets.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f3ea_0%,_#f1ede3_48%,_#ebe4d7_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">简历管理</p>
            <h1 className="text-3xl font-semibold text-slate-950">上传并解析基础简历</h1>
            <p className="text-sm leading-7 text-slate-600">
              当前账号：<span className="font-medium text-slate-900">{profile.email}</span>。当前支持 PDF、TXT、MD 文件。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-white border border-slate-300 text-slate-950 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:shadow-md"
            >
              返回首页
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full bg-white border border-slate-300 text-slate-950 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:shadow-md"
              >
                退出登录
              </button>
            </form>
          </div>
        </header>

        <div className="min-h-6 text-sm text-slate-600">{params.message ?? ""}</div>

        <section className="rounded-[28px] border border-black/10 bg-white/80 p-8 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">上传</p>
          <div className="mt-3 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">添加简历文件</h2>
              <p className="mt-2 text-lg leading-8 text-slate-700">
                上传简历文件后，系统会解析并提取结构化信息。每个文件都私有存储在 Supabase Storage 中，解析为纯文本，并转换为结构化 JSON 供后续 JD 匹配使用。
              </p>
            </div>
            <form action={uploadResume} className="space-y-6 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">简历文件</span>
                <input
                  name="resume"
                  type="file"
                  required
                  accept=".pdf,.txt,.md"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input name="make默认" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                上传后设为默认简历
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-white border border-slate-300 text-slate-950 px-5 py-3 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:shadow-md"
              >
                上传并解析
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-8 text-white shadow-[0_12px_50px_rgba(20,33,61,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">简历列表</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">解析结果</h2>
            </div>
            <p className="text-sm text-slate-400">查看每份简历对应的结构化信息。</p>
          </div>

          <div className="mt-6 space-y-5">
            {resumes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
                还没有上传简历。先上传一份基础简历，再继续后续分析。
              </div>
            ) : (
              resumes.map((resume) => {
                const normalized = normalizeResume(resume.structured_json);

                return (
                  <article key={resume.id} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{resume.original_file_name}</h3>
                        <p className="mt-1 text-sm text-slate-300">上传ed {formatDate(resume.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {resume.is_default ? (
                          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-200">
                            默认
                          </span>
                        ) : (
                          <form action={setDefaultResume}>
                            <input type="hidden" name="resumeId" value={resume.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/10"
                            >
                              设为默认
                            </button>
                          </form>
                        )}
                        <form action={deleteResume}>
                          <input type="hidden" name="resumeId" value={resume.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-400/20"
                          >
                            删除
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="flex flex-col gap-8">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">简历概览</p>
                            <p className="mt-3 text-sm leading-7 text-slate-300">
                              {normalized.summary || "当前没有映射出概览内容，可展开下方原始结构化结果查看。"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">技能</p>
                            {normalized.skills.length === 0 ? (
                              <p className="mt-3 text-sm leading-7 text-slate-400">当前没有映射出技能列表。</p>
                            ) : (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {normalized.skills.map((skill) => (
                                  <span key={skill} className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">
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
                          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">原始文本预览</p>
                            <p className="mt-3 line-clamp-[12] whitespace-pre-wrap text-sm leading-7 text-slate-300">
                              {resume.parsed_text || "当前没有保存解析文本。"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <details className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <summary className="cursor-pointer text-sm font-medium text-slate-200">查看原始结构化 JSON</summary>
                        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
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


