"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BookOpenText, CalendarDays, ChevronRight, FileText, GraduationCap,
  LayoutDashboard, Menu, Newspaper, Settings2, Shield, X, BellRing,
} from "lucide-react";
import { signOutAction } from "@/app/actions";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/study-plan", label: "Study plan", icon: CalendarDays },
  { href: "/syllabus", label: "Syllabus & PYQs", icon: BookOpenText },
  { href: "/learn", label: "Concept library", icon: GraduationCap },
  { href: "/current-affairs", label: "Current affairs", icon: Newspaper },
  { href: "/exam-alerts", label: "Exam alerts", icon: BellRing },
  { href: "/progress", label: "Progress & revision", icon: Activity },
  { href: "/notes", label: "My notes", icon: FileText },
  { href: "/settings", label: "Preferences", icon: Settings2 },
];

function initials(email: string) {
  return email.split("@")[0].slice(0, 2).toLocaleUpperCase("en-US") || "ME";
}

export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = navigation.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) ?? navigation[0];

  const navItems = (
    <>
      <div className="nav-caption">Your workspace</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active.href === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-link${selected ? " active" : ""}`} onClick={() => setMobileOpen(false)} aria-current={selected ? "page" : undefined}>
              <Icon size={16} strokeWidth={1.8} /><span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
        <Link className="brand-lockup" href="/dashboard" onClick={() => setMobileOpen(false)}>
          <div className="brand-mark"><span>SD</span></div>
          <div><strong>UPSC Study Desk</strong><span>Private preparation workspace</span></div>
        </Link>
        {navItems}
        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <span className="tip-mark">✦</span>
          <p><strong>Source first.</strong><br />Use the original paper or release before you make a note or answer claim.</p>
        </div>
        <div className="sidebar-bottom">
          <div className="account-mini">
            <div className="avatar-mini">{initials(email)}</div>
            <div className="account-copy"><strong>Owner account</strong><span>{email}</span></div>
          </div>
          <form action={signOutAction}><button className="signout-button" aria-label="Sign out" title="Sign out"><Shield size={15} /></button></form>
        </div>
      </aside>
      <div className="mobile-header">
        <Link className="brand-lockup" href="/dashboard">
          <div className="brand-mark"><span>SD</span></div>
          <div><strong>UPSC Study Desk</strong><span>Private workspace</span></div>
        </Link>
        <button className="mobile-menu-button" type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>
      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><b>{active.label}</b></div>
          <div className="topbar-right"><span>Private owner access</span><span className="topbar-pill"><span className="status-dot status-dot-good" /> IST daily schedule</span></div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>
    </div>
  );
}
