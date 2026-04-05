"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { logProductEvent } from "@/lib/events";
import type { JsonValue } from "@/types";

const structuredJobSchema = z.object({
  job_title: z.string().default(""),
  company_name: z.string().default(""),
  summary: z.string().default(""),
  responsibilities: z.array(z.string()).default([]),
  required_skills: z.array(z.string()).default([]),
  preferred_skills: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

const analysisSchema = z.object({
  match_score: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  resume_bullets: z.array(z.string()).default([]),
  intro: z.string().default(""),
  outreach_message: z.string().default(""),
});

function jsonStringifySafe(value: JsonValue | null) {
  return JSON.stringify(value ?? {}, null, 2);
}

async function structureJobDescription(rawText: string) {
  const prompt = [
    "You are extracting job description content into structured JSON.",
    "Return valid JSON only.",
    "Do not invent missing requirements.",
    "Use empty strings or empty arrays when data is missing.",
    "Schema:",
    JSON.stringify({
      job_title: "",
      company_name: "",
      summary: "",
      responsibilities: [""],
      required_skills: [""],
      preferred_skills: [""],
      qualifications: [""],
      keywords: [""],
    }),
    "Return raw JSON only, with no markdown fence.",
    "Job description text:",
    rawText,
  ].join("\n");

  const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Extract job description data and output valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Model request failed with status ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("The model returned an empty JD parsing result.");
  }

  const normalized = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return structuredJobSchema.parse(JSON.parse(normalized));
}

async function generateAnalysis(
  resumeText: string,
  resumeStructured: JsonValue | null,
  jdText: string,
  jdStructured: JsonValue | null,
) {
  const prompt = [
    "You are analyzing how well a candidate resume matches a target job description.",
    "Return valid JSON only.",
    "Do not invent candidate experience.",
    "Use evidence from the resume and JD.",
    "Schema:",
    JSON.stringify({
      match_score: 0,
      strengths: [""],
      gaps: [""],
      suggestions: [""],
      resume_bullets: [""],
      intro: "",
      outreach_message: "",
    }),
    "Guidance:",
    "- strengths: why the candidate is already credible for this role",
    "- gaps: missing evidence or weaker fit areas",
    "- suggestions: concrete edits or emphasis changes",
    "- resume_bullets: rewritten resume bullets tailored to the JD, grounded in existing experience",
    "- intro: a concise self-introduction for interview or self-summary use",
    "- outreach_message: a short message the candidate can send to HR or a hiring manager when applying",
    "Candidate structured resume:",
    jsonStringifySafe(resumeStructured),
    "Candidate raw resume text:",
    resumeText,
    "Structured job description:",
    jsonStringifySafe(jdStructured),
    "Raw job description:",
    jdText,
    "Return raw JSON only, with no markdown fence.",
  ].join("\n");

  const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Analyze resume-job match and output valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Model request failed with status ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("The model returned an empty analysis result.");
  }

  const normalized = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return analysisSchema.parse(JSON.parse(normalized));
}

export async function createApplyResult(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const resumeId = formData.get("resumeId");
  const rawTextEntry = formData.get("rawText");
  const companyNameEntry = formData.get("companyName");
  const jobTitleEntry = formData.get("jobTitle");

  if (typeof resumeId !== "string" || !resumeId) {
    throw new Error("请选择一份简历。");
  }

  if (typeof rawTextEntry !== "string" || !rawTextEntry.trim()) {
    throw new Error("请粘贴岗位 JD。");
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, parsed_text, structured_json")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (resumeError || !resume) {
    throw new Error("未找到所选简历。");
  }

  const parsedResumeText = typeof resume.parsed_text === "string" ? resume.parsed_text : "";
  if (!parsedResumeText.trim()) {
    throw new Error("所选简历没有可用的解析文本。");
  }

  const rawText = rawTextEntry.trim();
  const structuredJob = await structureJobDescription(rawText);

  const companyName =
    typeof companyNameEntry === "string" && companyNameEntry.trim()
      ? companyNameEntry.trim()
      : structuredJob.company_name || null;
  const jobTitle =
    typeof jobTitleEntry === "string" && jobTitleEntry.trim()
      ? jobTitleEntry.trim()
      : structuredJob.job_title || null;

  const { data: insertedJob, error: jobError } = await supabase
    .from("job_descriptions")
    .insert({
      user_id: user.id,
      raw_text: rawText,
      company_name: companyName,
      job_title: jobTitle,
      structured_json: structuredJob,
    })
    .select("id")
    .single();

  if (jobError || !insertedJob) {
    throw new Error(jobError?.message || "创建 JD 记录失败。");
  }

  await logProductEvent(supabase, user.id, "jd_parsed", {
    jd_id: insertedJob.id,
    company_name: companyName,
    job_title: jobTitle,
    source: "apply_flow",
  });

  const analysis = await generateAnalysis(parsedResumeText, resume.structured_json as JsonValue | null, rawText, structuredJob);

  const { data: insertedAnalysis, error: analysisError } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      resume_id: resume.id,
      jd_id: insertedJob.id,
      match_score: analysis.match_score,
      strengths_json: analysis.strengths,
      gaps_json: analysis.gaps,
      suggestions_json: {
        suggestions: analysis.suggestions,
        outreach_message: analysis.outreach_message,
      },
      generated_intro: analysis.intro,
      generated_resume_bullets: analysis.resume_bullets,
    })
    .select("id")
    .single();

  if (analysisError || !insertedAnalysis) {
    throw new Error(analysisError?.message || "生成分析失败。");
  }

  await logProductEvent(supabase, user.id, "analysis_created", {
    analysis_id: insertedAnalysis.id,
    resume_id: resume.id,
    jd_id: insertedJob.id,
    match_score: analysis.match_score,
    source: "apply_flow",
  });

  revalidatePath("/apply");
  revalidatePath("/analysis");
  revalidatePath("/jd");
  revalidatePath("/dashboard");

  redirect(`/apply?message=${encodeURIComponent("已生成本次投递内容")}&analysisId=${insertedAnalysis.id}`);
}
