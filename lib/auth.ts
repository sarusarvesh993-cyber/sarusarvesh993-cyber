import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export function normaliseEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("en-US");
}

export function isOwnerEmail(value: string | null | undefined) {
  const owner = normaliseEmail(process.env.OWNER_EMAIL);
  return Boolean(owner && normaliseEmail(value) === owner);
}

export async function requireOwner() {
  if (!isSupabaseConfigured()) redirect("/setup");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  if (!isOwnerEmail(data.user.email)) redirect("/login?reason=owner");
  return { supabase, user: data.user };
}
