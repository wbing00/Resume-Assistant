"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { logProductEvent } from "@/lib/events";

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
        {
          role: "system",
          content: "Extract job description data and output valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
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

export async function createJobDescriptionAnalysis(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const rawTextEntry = formData.get("rawText");
  const companyNameEntry = formData.get("companyName");
  const jobTitleEntry = formData.get("jobTitle");

  if (typeof rawTextEntry !== "string" || !rawTextEntry.trim()) {
    throw new Error("Please paste a job description.");
  }

  const rawText = rawTextEntry.trim();
  const structured = await structureJobDescription(rawText);

  const companyName = typeof companyNameEntry === "string" && companyNameEntry.trim() ? companyNameEntry.trim() : structured.company_name || null;
  const jobTitle = typeof jobTitleEntry === "string" && jobTitleEntry.trim() ? jobTitleEntry.trim() : structured.job_title || null;

  const { data: insertedJob, error } = await supabase
    .from("job_descriptions")
    .insert({
      user_id: user.id,
      raw_text: rawText,
      company_name: companyName,
      job_title: jobTitle,
      structured_json: structured,
    })
    .select("id")
    .single();

  if (error || !insertedJob) {
    throw new Error(error?.message || "Failed to create JD record.");
  }

  await logProductEvent(supabase, user.id, "jd_parsed", {
    jd_id: insertedJob.id,
    company_name: companyName,
    job_title: jobTitle,
  });

  revalidatePath("/jd");
  revalidatePath("/dashboard");

  redirect("/jd?message=JD+parsed+successfully");
}

export async function deleteJobDescription(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const jdId = formData.get("jdId");

  if (typeof jdId !== "string" || !jdId) {
    throw new Error("Missing JD id.");
  }

  // 首先检查该JD是否被任何分析记录引用
  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("id")
    .eq("jd_id", jdId)
    .eq("user_id", user.id);

  if (analysesError) {
    throw new Error(analysesError.message);
  }

  // 如果有分析记录引用此JD，先删除这些分析记录
  if (analyses && analyses.length > 0) {
    const { error: deleteAnalysesError } = await supabase
      .from("analyses")
      .delete()
      .eq("jd_id", jdId)
      .eq("user_id", user.id);

    if (deleteAnalysesError) {
      throw new Error(deleteAnalysesError.message);
    }
  }

  // 删除JD记录
  const { error: deleteError } = await supabase
    .from("job_descriptions")
    .delete()
    .eq("id", jdId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await logProductEvent(supabase, user.id, "jd_deleted", {
    jd_id: jdId,
  });

  revalidatePath("/jd");
  revalidatePath("/analysis");
  revalidatePath("/apply");

  redirect("/jd?message=JD+deleted+successfully");
}
