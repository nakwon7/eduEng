import { createClient } from "@supabase/supabase-js";

// Fallback prevents createClient from throwing at build time when env vars are absent
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 전용 (service role) - API 라우트에서만 사용
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );

export type Profile = {
  id: string;
  email: string;
  username: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  approved: boolean;
  session_token: string | null;
};
