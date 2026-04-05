"use server";

import { createRequire } from "node:module";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { logProductEvent } from "@/lib/events";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const requireModule = createRequire(import.meta.url);

const structuredResumeSchema = z.object({
  summary: z.string().default(""),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        duration: z.string().default(""),
        highlights: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        role: z.string().default(""),
        highlights: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string().default(""),
        degree: z.string().default(""),
        duration: z.string().default(""),
      }),
    )
    .default([]),
});

type PdfParseResult = {
  text: string;
};

type PdfParseFn = (input: Buffer) => Promise<PdfParseResult>;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function extractResumeText(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    const pdfParse = requireModule("pdf-parse/lib/pdf-parse.js") as PdfParseFn;
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return buffer.toString("utf-8").trim();
  }

  throw new Error("Only PDF, TXT, and MD files are supported in V1.");
}

async function structureResumeText(parsedText: string) {
  const prompt = [
    "You are extracting resume content into structured JSON.",
    "Return valid JSON only.",
    "Do not invent experience or credentials.",
    "Use empty strings or empty arrays when data is missing.",
    "Schema:",
    JSON.stringify({
      summary: "",
      skills: [""],
      experience: [{ company: "", role: "", duration: "", highlights: [""] }],
      projects: [{ name: "", role: "", highlights: [""] }],
      education: [{ school: "", degree: "", duration: "" }],
    }),
    "Return raw JSON only, with no markdown fence.",
    "Resume text:",
    parsedText,
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
          content: "Extract structured resume data and output valid JSON only.",
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
    throw new Error("The model returned an empty resume parsing result.");
  }

  const normalized = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  return structuredResumeSchema.parse(JSON.parse(normalized));
}

export async function uploadResume(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const supabaseAdmin = createSupabaseAdminClient();
  const fileEntry = formData.get("resume");
  const makeDefault = formData.get("makeDefault") === "on";

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    throw new Error("Please choose a resume file to upload.");
  }

  const allowedExtensions = [".pdf", ".txt", ".md"];
  const lowerName = fileEntry.name.toLowerCase();
  const isAllowed = allowedExtensions.some((extension) => lowerName.endsWith(extension));

  if (!isAllowed) {
    throw new Error("Only PDF, TXT, and MD files are supported in V1.");
  }

  const safeFileName = sanitizeFileName(fileEntry.name);
  const storagePath = `${user.id}/${Date.now()}-${safeFileName}`;
  const parsedText = await extractResumeText(fileEntry);

  if (!parsedText) {
    throw new Error("The uploaded file does not contain readable text.");
  }

  const structuredJson = await structureResumeText(parsedText);
  const uploadBuffer = Buffer.from(await fileEntry.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage.from("resumes").upload(storagePath, uploadBuffer, {
    contentType: fileEntry.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: existingResumes, error: existingError } = await supabase.from("resumes").select("id").eq("user_id", user.id).limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const shouldSetDefault = makeDefault || (existingResumes?.length ?? 0) === 0;

  if (shouldSetDefault) {
    const { error: resetDefaultError } = await supabase.from("resumes").update({ is_default: false }).eq("user_id", user.id);

    if (resetDefaultError) {
      throw new Error(resetDefaultError.message);
    }
  }

  const { data: insertedResume, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      file_path: storagePath,
      original_file_name: fileEntry.name,
      parsed_text: parsedText,
      structured_json: structuredJson,
      is_default: shouldSetDefault,
    })
    .select("id")
    .single();

  if (insertError || !insertedResume) {
    throw new Error(insertError?.message || "Failed to save resume record.");
  }

  await logProductEvent(supabase, user.id, "resume_uploaded", {
    resume_id: insertedResume.id,
    original_file_name: fileEntry.name,
    is_default: shouldSetDefault,
    file_type: lowerName.split(".").pop() ?? "unknown",
  });

  revalidatePath("/resume");
  revalidatePath("/dashboard");

  redirect("/resume?message=Resume+uploaded+and+parsed");
}

export async function setDefaultResume(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const resumeId = formData.get("resumeId");

  if (typeof resumeId !== "string" || !resumeId) {
    throw new Error("Missing resume id.");
  }

  const { error: resetError } = await supabase.from("resumes").update({ is_default: false }).eq("user_id", user.id);

  if (resetError) {
    throw new Error(resetError.message);
  }

  const { error: setError } = await supabase.from("resumes").update({ is_default: true }).eq("id", resumeId).eq("user_id", user.id);

  if (setError) {
    throw new Error(setError.message);
  }

  await logProductEvent(supabase, user.id, "resume_default_changed", {
    resume_id: resumeId,
  });

  revalidatePath("/resume");

  redirect("/resume?message=Default+resume+updated");
}
