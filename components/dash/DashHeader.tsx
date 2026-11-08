"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Logo } from "../Logo";
import { useApp } from "../Providers";
import { Toggles } from "../Toggles";

export const TABS = ["summary", "leads", "adsets", "orders", "budget", "stock", "repeat", "notes"] as const;
export type Tab = (typeof TABS)[number];

export function DashHeader({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { t } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="dash-header glass">
      <Logo />

      <nav className="dash-tabs" aria-label="Sections">
        {TABS.map((id) => (
          <button
            key={id}
            className={id === tab ? "active" : ""}
            onClick={() => onTab(id)}
            aria-current={id === tab ? "page" : undefined}
          >
            {t.dash.tabs[id]}
          </button>
        ))}
      </nav>

      <div className="dash-header-right">
        <Toggles />
        <div className="profile">
          <button className="avatar" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
            AB
          </button>
          {menuOpen && (
            <div className="profile-menu glass">
              <div className="profile-name">Alisher B.</div>
              <div className="muted small">Admin</div>
              <button onClick={logout}>{t.dash.logout}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
