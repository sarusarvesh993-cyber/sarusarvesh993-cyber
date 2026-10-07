import type { ReactNode } from "react";
import { requireOwner } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const { user } = await requireOwner();
  return <AppShell email={user.email ?? "Owner account"}>{children}</AppShell>;
}
