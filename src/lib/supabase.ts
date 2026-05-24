import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase client used only on the server. It uses the public anon key (which
// you already have in .env) — combined with the RLS policies in
// supabase/schema.sql, that's enough for the booking system, so no separate
// service-role secret is needed.
//
// Created lazily (on first use) so importing this module during `next build`
// doesn't crash when env vars aren't present yet.

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// Proxy keeps the ergonomic `supabase.from(...)` / `supabase.storage` API while
// deferring construction (and the env check) to the first actual call.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const c = getClient();
    const value = Reflect.get(c as object, prop, receiver);
    return typeof value === "function" ? value.bind(c) : value;
  },
});

export const STORAGE_BUCKET = "villa-public";
