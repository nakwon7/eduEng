import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 전용 (service role) - API 라우트에서만 사용
export const supabaseAdmin = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export type Profile = {
  id: string;
  email: string;
  username: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  approved: boolean;
  session_token: string | null;
};
