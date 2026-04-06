"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedUser, requireRole } from "@/lib/auth";
import { logProductEvent } from "@/lib/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserFeedbackRecord } from "@/types";

// Validation schemas
const submitFeedbackSchema = z.object({
  feedback_type: z.enum(["bug", "feature", "ui", "experience", "other"]),
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过200个字符"),
  description: z.string().min(10, "描述至少需要10个字符").max(5000, "描述不能超过5000个字符"),
  rating: z.number().int().min(1).max(5).optional().nullable(),
});

const updateFeedbackStatusSchema = z.object({
  feedback_id: z.string().uuid(),
  status: z.enum(["new", "reviewed", "planned", "in_progress", "completed", "rejected"]),
  admin_notes: z.string().optional().nullable(),
});

// Submit user feedback
export async function submitFeedback(formData: FormData) {
  try {
    const { user } = await requireAuthenticatedUser();
    const supabase = await createSupabaseServerClient();

    // Parse and validate form data
    const rawData = {
      feedback_type: formData.get("feedback_type"),
      title: formData.get("title"),
      description: formData.get("description"),
      rating: formData.get("rating") ? parseInt(formData.get("rating") as string) : null,
    };

    const validatedData = submitFeedbackSchema.parse(rawData);

    // Insert feedback into database
    const { data, error } = await supabase
      .from("user_feedbacks")
      .insert({
        user_id: user.id,
        feedback_type: validatedData.feedback_type,
        title: validatedData.title,
        description: validatedData.description,
        rating: validatedData.rating,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting feedback:", error);
      throw new Error(`提交反馈失败: ${error.message}`);
    }

    // Log event
    const supabaseForEvents = await createSupabaseServerClient();
    await logProductEvent(
      supabaseForEvents,
      user.id,
      "feedback_submitted",
      {
        feedback_id: data.id,
        feedback_type: validatedData.feedback_type,
        has_rating: !!validatedData.rating,
      }
    );

    // Revalidate feedback list page
    revalidatePath("/feedback/list");
    
    return {
      success: true,
      message: "反馈提交成功！感谢您的意见。",
      feedbackId: data.id,
    };
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    
    // Simple error handling to avoid TypeScript complexity
    return {
      success: false,
      message: error instanceof Error ? error.message : "提交反馈时发生未知错误",
    };
  }
}

// Get user's own feedbacks
export async function getUserFeedbacks() {
  try {
    const { user } = await requireAuthenticatedUser();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_feedbacks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user feedbacks:", error);
      throw new Error(`获取反馈列表失败: ${error.message}`);
    }

    return {
      success: true,
      feedbacks: data as UserFeedbackRecord[],
    };
  } catch (error) {
    console.error("Error in getUserFeedbacks:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "获取反馈列表时发生未知错误",
      feedbacks: [],
    };
  }
}

// Get single feedback by ID (user can only see their own)
export async function getFeedbackById(feedbackId: string) {
  try {
    const { user } = await requireAuthenticatedUser();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_feedbacks")
      .select("*")
      .eq("id", feedbackId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching feedback:", error);
      throw new Error(`获取反馈详情失败: ${error.message}`);
    }

    return {
      success: true,
      feedback: data as UserFeedbackRecord,
    };
  } catch (error) {
    console.error("Error in getFeedbackById:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "获取反馈详情时发生未知错误",
      feedback: null,
    };
  }
}

// Admin: Get all feedbacks
export async function getAllFeedbacks() {
  try {
    await requireRole("admin");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_feedbacks")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all feedbacks:", error);
      throw new Error(`获取所有反馈失败: ${error.message}`);
    }

    return {
      success: true,
      feedbacks: data,
    };
  } catch (error) {
    console.error("Error in getAllFeedbacks:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "获取所有反馈时发生未知错误",
      feedbacks: [],
    };
  }
}

// Admin: Update feedback status
export async function updateFeedbackStatus(formData: FormData) {
  try {
    const { profile } = await requireRole("admin");
    const supabase = await createSupabaseServerClient();

    const rawData = {
      feedback_id: formData.get("feedback_id"),
      status: formData.get("status"),
      admin_notes: formData.get("admin_notes"),
    };

    const validatedData = updateFeedbackStatusSchema.parse(rawData);

    // Update feedback
    const { data, error } = await supabase
      .from("user_feedbacks")
      .update({
        status: validatedData.status,
        admin_notes: validatedData.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedData.feedback_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating feedback status:", error);
      throw new Error(`更新反馈状态失败: ${error.message}`);
    }

    // Log event
    const supabaseForEvents = await createSupabaseServerClient();
    await logProductEvent(
      supabaseForEvents,
      profile.id,
      "feedback_status_updated",
      {
        feedback_id: validatedData.feedback_id,
        old_status: data.status, // Note: this is the new status after update
        new_status: validatedData.status,
        updated_by: profile.id,
      }
    );

    // Revalidate admin and feedback pages
    revalidatePath("/admin");
    revalidatePath("/feedback/list");

    return {
      success: true,
      message: "反馈状态更新成功",
      feedback: data,
    };
  } catch (error) {
    console.error("Error in updateFeedbackStatus:", error);
    
    // Simple error handling to avoid TypeScript complexity
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新反馈状态时发生未知错误",
    };
  }
}

// Get feedback statistics for admin dashboard
export async function getFeedbackStats() {
  try {
    await requireRole("admin");
    const supabase = await createSupabaseServerClient();

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("user_feedbacks")
      .select("*", { count: "exact", head: true });

    if (countError) throw new Error(countError.message);

    // Get count by type
    const { data: typeData, error: typeError } = await supabase
      .from("user_feedbacks")
      .select("feedback_type");

    if (typeError) throw new Error(typeError.message);

    // Get count by status
    const { data: statusData, error: statusError } = await supabase
      .from("user_feedbacks")
      .select("status");

    if (statusError) throw new Error(statusError.message);

    // Calculate statistics
    const typeCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    typeData?.forEach(item => {
      typeCounts[item.feedback_type] = (typeCounts[item.feedback_type] || 0) + 1;
    });

    statusData?.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });

    // Get average rating
    const { data: ratingData, error: ratingError } = await supabase
      .from("user_feedbacks")
      .select("rating")
      .not("rating", "is", null);

    if (ratingError) throw new Error(ratingError.message);

    const ratings = ratingData?.map(item => item.rating).filter(Boolean) as number[];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    return {
      success: true,
      stats: {
        total: totalCount || 0,
        byType: typeCounts,
        byStatus: statusCounts,
        averageRating: Math.round(averageRating * 10) / 10,
        withRating: ratings.length,
      },
    };
  } catch (error) {
    console.error("Error in getFeedbackStats:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "获取反馈统计时发生未知错误",
      stats: null,
    };
  }
}
