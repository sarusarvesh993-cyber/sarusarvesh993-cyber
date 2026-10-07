import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isSupabaseConfigured()) redirect("/setup");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user && isOwnerEmail(data.user.email)) redirect("/dashboard");
  redirect("/login");
}
