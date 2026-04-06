"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import {
  buildJobApplyNotePrompt,
  buildOutreachMessageFromReasons,
  getJobApplyNoteSystemPrompt,
} from "@/lib/ai/job-apply-note";
import { env } from "@/lib/env";
import { logProductEvent } from "@/lib/events";
import type { JsonValue } from "@/types";

const analysisSchema = z.object({
  match_score: z.number().int().min(0).max(100),
  score_summary: z.string().default(""),
  score_reasons: z.array(z.string()).default([]),
  score_risks: z.array(z.string()).default([]),
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

async function generateAnalysis(
  resumeText: string,
  resumeStructured: JsonValue | null,
  jdText: string,
  jdStructured: JsonValue | null,
) {
  const prompt = [
    buildJobApplyNotePrompt({
      includeResumeSuggestions: true,
      quickApplyMode: false,
    }),
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
          content: getJobApplyNoteSystemPrompt(),
        },
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

  const analysis = await generateAnalysis(
    parsedResumeText,
    resume.structured_json as JsonValue | null,
    jd.raw_text,
    jd.structured_json as JsonValue | null,
  );
  const outreachMessage = analysis.outreach_message?.trim() || buildOutreachMessageFromReasons(analysis.score_reasons);

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
        outreach_message: outreachMessage,
        score_summary: analysis.score_summary,
        score_reasons: analysis.score_reasons,
        score_risks: analysis.score_risks,
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
    score_reasons: analysis.score_reasons,
  });

  revalidatePath("/analysis");
  revalidatePath("/dashboard");

  redirect("/analysis?message=Analysis+generated+successfully");
}

export async function deleteAnalysis(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const analysisId = formData.get("analysisId");

  if (typeof analysisId !== "string" || !analysisId) {
    throw new Error("Missing analysis id.");
  }

  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("id")
    .eq("analysis_id", analysisId)
    .eq("user_id", user.id);

  if (applicationsError) {
    throw new Error(applicationsError.message);
  }

  if (applications && applications.length > 0) {
    const { error: updateApplicationsError } = await supabase
      .from("applications")
      .update({ analysis_id: null })
      .eq("analysis_id", analysisId)
      .eq("user_id", user.id);

    if (updateApplicationsError) {
      throw new Error(updateApplicationsError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from("analyses")
    .delete()
    .eq("id", analysisId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await logProductEvent(supabase, user.id, "analysis_deleted", {
    analysis_id: analysisId,
  });

  revalidatePath("/analysis");
  revalidatePath("/applications");
  revalidatePath("/apply");

  redirect("/analysis?message=Analysis+deleted+successfully");
}

export async function updateOutreachMessage(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const analysisId = formData.get("analysisId");
  const newMessage = formData.get("outreachMessage");

  if (typeof analysisId !== "string" || !analysisId) {
    throw new Error("Missing analysis id.");
  }
  if (typeof newMessage !== "string") {
    throw new Error("Missing outreach message.");
  }

  const { data: analysis, error: fetchError } = await supabase
    .from("analyses")
    .select("suggestions_json")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !analysis) {
    throw new Error("Analysis not found.");
  }

  const suggestions = analysis.suggestions_json as Record<string, unknown> || {};
  const updatedSuggestions = {
    ...suggestions,
    outreach_message: newMessage.trim(),
  };

  const { error: updateError } = await supabase
    .from("analyses")
    .update({
      suggestions_json: updatedSuggestions,
    })
    .eq("id", analysisId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message || "Failed to update outreach message.");
  }

  await logProductEvent(supabase, user.id, "outreach_message_updated", {
    analysis_id: analysisId,
  });

  revalidatePath("/analysis");
  revalidatePath("/apply");
}
