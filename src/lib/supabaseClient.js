import { createClient } from "@supabase/supabase-js";
import { getClientEnv } from "./env";

const { supabaseUrl, supabaseAnonKey } = getClientEnv();

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
