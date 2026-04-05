import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=请先登录");
  }

  return { supabase, user };
}

export async function getCurrentProfile() {
  const { supabase, user } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/login?message=未找到用户资料，请重新登录");
  }

  return { supabase, user, profile: data as Profile };
}

export async function requireRole(role: UserRole) {
  const context = await getCurrentProfile();

  if (context.profile.role !== role) {
    redirect("/dashboard?message=你无权访问该页面");
  }

  return context;
}

