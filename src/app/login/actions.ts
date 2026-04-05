"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildLoginRedirect(message: string) {
  const params = new URLSearchParams({ message });
  return `/login?${params.toString()}`;
}

function getCredentials(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || !email.trim()) {
    redirect(buildLoginRedirect("请输入邮箱"));
  }

  if (typeof password !== "string" || password.length < 8) {
    redirect(buildLoginRedirect("密码至少需要 8 位"));
  }

  return {
    email: email.trim(),
    password,
  };
}

export async function signInWithPassword(formData: FormData) {
  const { email, password } = getCredentials(formData);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(buildLoginRedirect(error.message));
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  const { email, password } = getCredentials(formData);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(buildLoginRedirect(error.message));
  }

  redirect(buildLoginRedirect("账号创建成功，请登录"));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(buildLoginRedirect("已退出登录"));
}

