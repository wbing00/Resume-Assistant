"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { logProductEvent } from "@/lib/events";
import type { JsonValue } from "@/types";

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

async function generateAnalysis(resumeText: string, resumeStructured: JsonValue | null, jdText: string, jdStructured: JsonValue | null) {
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
        {
          role: "system",
          content: "Analyze resume-job match and output valid JSON only.",
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
    throw new Error("The model returned an empty analysis result.");
  }

  const normalized = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  return analysisSchema.parse(JSON.parse(normalized));
}

export async function createAnalysis(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const resumeId = formData.get("resumeId");
  const jdId = formData.get("jdId");

  if (typeof resumeId !== "string" || !resumeId) {
    throw new Error("Please choose a resume.");
  }

  if (typeof jdId !== "string" || !jdId) {
    throw new Error("Please choose a job description.");
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, parsed_text, structured_json")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (resumeError || !resume) {
    throw new Error("Resume not found.");
  }

  const { data: jd, error: jdError } = await supabase
    .from("job_descriptions")
    .select("id, raw_text, structured_json")
    .eq("id", jdId)
    .eq("user_id", user.id)
    .single();

  if (jdError || !jd) {
    throw new Error("Job description not found.");
  }

  const parsedResumeText = typeof resume.parsed_text === "string" ? resume.parsed_text : "";

  if (!parsedResumeText.trim()) {
    throw new Error("The selected resume does not contain parsed text.");
  }

  const analysis = await generateAnalysis(parsedResumeText, resume.structured_json as JsonValue | null, jd.raw_text, jd.structured_json as JsonValue | null);

  const { data: insertedAnalysis, error: insertError } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      resume_id: resume.id,
      jd_id: jd.id,
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

  if (insertError || !insertedAnalysis) {
    throw new Error(insertError?.message || "Failed to save analysis.");
  }

  await logProductEvent(supabase, user.id, "analysis_created", {
    analysis_id: insertedAnalysis.id,
    resume_id: resume.id,
    jd_id: jd.id,
    match_score: analysis.match_score,
  });

  revalidatePath("/analysis");
  revalidatePath("/dashboard");

  redirect("/analysis?message=Analysis+generated+successfully");
}
