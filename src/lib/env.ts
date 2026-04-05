import { z } from "zod";

const rawEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().optional(),
  DEEPSEEK_MODEL: z.string().optional(),
});

const rawEnv = rawEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
});

const llmApiKey = rawEnv.DEEPSEEK_API_KEY ?? rawEnv.OPENAI_API_KEY;
const llmBaseUrl = rawEnv.DEEPSEEK_BASE_URL ?? rawEnv.OPENAI_BASE_URL;
const llmModel = rawEnv.DEEPSEEK_MODEL ?? rawEnv.OPENAI_MODEL;

if (!llmApiKey) {
  throw new Error("Missing DEEPSEEK_API_KEY or OPENAI_API_KEY");
}

if (!llmBaseUrl) {
  throw new Error("Missing DEEPSEEK_BASE_URL or OPENAI_BASE_URL");
}

if (!llmModel) {
  throw new Error("Missing DEEPSEEK_MODEL or OPENAI_MODEL");
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: rawEnv.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: llmApiKey,
  OPENAI_BASE_URL: z.url().parse(llmBaseUrl),
  OPENAI_MODEL: llmModel,
};