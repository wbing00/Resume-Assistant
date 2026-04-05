"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth";

function normalizeNullableString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function logEvent(
  userId: string,
  eventName: string,
  eventPayload: Record<string, string | number | boolean | null>,
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
) {
  const { error } = await supabase.from("events").insert({
    user_id: userId,
    event_name: eventName,
    event_payload: eventPayload,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createApplication(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();

  const analysisId = normalizeNullableString(formData.get("analysisId"));
  const companyName = normalizeNullableString(formData.get("companyName"));
  const jobTitle = normalizeNullableString(formData.get("jobTitle"));
  const channel = normalizeNullableString(formData.get("channel"));
  const appliedAtRaw = normalizeNullableString(formData.get("appliedAt"));
  const usedAiSuggestion = formData.get("usedAiSuggestion") === "on";
  const status = normalizeNullableString(formData.get("status")) ?? "draft";

  if (!companyName) {
    throw new Error("Please provide a company name.");
  }

  if (!jobTitle) {
    throw new Error("Please provide a job title.");
  }

  let linkedAnalysisId: string | null = null;

  if (analysisId) {
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .select("id")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .single();

    if (analysisError || !analysis) {
      throw new Error("Selected analysis could not be found.");
    }

    linkedAnalysisId = analysis.id;
  }

  const { data: insertedApplication, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      analysis_id: linkedAnalysisId,
      company_name: companyName,
      job_title: jobTitle,
      channel,
      applied_at: appliedAtRaw,
      used_ai_suggestion: usedAiSuggestion,
      status,
    })
    .select("id")
    .single();

  if (error || !insertedApplication) {
    throw new Error(error?.message || "Failed to create application record.");
  }

  await logEvent(
    user.id,
    "application_created",
    {
      application_id: insertedApplication.id,
      analysis_id: linkedAnalysisId,
      company_name: companyName,
      job_title: jobTitle,
      channel,
      status,
      used_ai_suggestion: usedAiSuggestion,
    },
    supabase,
  );

  revalidatePath("/applications");
  revalidatePath("/analysis");
  revalidatePath("/dashboard");

  redirect("/applications?message=Application+record+created");
}

export async function updateApplicationStatus(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();

  const applicationId = normalizeNullableString(formData.get("applicationId"));
  const status = normalizeNullableString(formData.get("status"));

  if (!applicationId || !status) {
    throw new Error("Missing application update fields.");
  }

  const { data: updatedApplication, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .select("id, analysis_id, company_name, job_title")
    .single();

  if (error || !updatedApplication) {
    throw new Error(error?.message || "Failed to update application status.");
  }

  await logEvent(
    user.id,
    "application_status_updated",
    {
      application_id: updatedApplication.id,
      analysis_id: updatedApplication.analysis_id,
      company_name: updatedApplication.company_name,
      job_title: updatedApplication.job_title,
      status,
    },
    supabase,
  );

  revalidatePath("/applications");
  revalidatePath("/dashboard");

  redirect("/applications?message=Application+status+updated");
}

export async function saveFeedback(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();

  const applicationId = normalizeNullableString(formData.get("applicationId"));
  const responseResult = normalizeNullableString(formData.get("responseResult"));
  const interviewStage = normalizeNullableString(formData.get("interviewStage"));
  const userComment = normalizeNullableString(formData.get("userComment"));
  const userRatingRaw = normalizeNullableString(formData.get("userRating"));

  if (!applicationId) {
    throw new Error("Missing application id.");
  }

  const userRating = userRatingRaw ? Number(userRatingRaw) : null;

  const payload = {
    user_id: user.id,
    application_id: applicationId,
    response_result: responseResult,
    interview_stage: interviewStage,
    user_rating: Number.isFinite(userRating) ? userRating : null,
    user_comment: userComment,
  };

  const { data: existing, error: existingError } = await supabase
    .from("feedbacks")
    .select("id")
    .eq("application_id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("feedbacks")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("feedbacks").insert(payload);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { data: linkedApplication, error: applicationError } = await supabase
    .from("applications")
    .select("id, analysis_id, company_name, job_title, status")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (applicationError || !linkedApplication) {
    throw new Error(applicationError?.message || "Linked application could not be found.");
  }

  await logEvent(
    user.id,
    "feedback_saved",
    {
      application_id: linkedApplication.id,
      analysis_id: linkedApplication.analysis_id,
      company_name: linkedApplication.company_name,
      job_title: linkedApplication.job_title,
      status: linkedApplication.status,
      response_result: responseResult,
      interview_stage: interviewStage,
      user_rating: Number.isFinite(userRating) ? userRating : null,
    },
    supabase,
  );

  revalidatePath("/applications");
  revalidatePath("/dashboard");

  redirect("/applications?message=Feedback+saved");
}

export async function deleteApplication(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedUser();
  const applicationId = formData.get("applicationId");

  if (typeof applicationId !== "string" || !applicationId) {
    throw new Error("Missing application id.");
  }

  // 首先检查该投递是否有关联的反馈记录
  const { data: feedback, error: feedbackError } = await supabase
    .from("feedbacks")
    .select("id")
    .eq("application_id", applicationId)
    .eq("user_id", user.id);

  if (feedbackError) {
    throw new Error(feedbackError.message);
  }

  // 如果有反馈记录，先删除反馈
  if (feedback && feedback.length > 0) {
    const { error: deleteFeedbackError } = await supabase
      .from("feedbacks")
      .delete()
      .eq("application_id", applicationId)
      .eq("user_id", user.id);

    if (deleteFeedbackError) {
      throw new Error(deleteFeedbackError.message);
    }
  }

  // 删除投递记录
  const { error: deleteError } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await logEvent(
    user.id,
    "application_deleted",
    {
      application_id: applicationId,
    },
    supabase,
  );

  revalidatePath("/applications");
  revalidatePath("/dashboard");

  redirect("/applications?message=Application+deleted+successfully");
}
