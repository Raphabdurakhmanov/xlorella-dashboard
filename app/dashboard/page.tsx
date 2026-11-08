"use client";

import { useEffect, useState } from "react";
import { Bubbles } from "@/components/Bubbles";
import { DashHeader, TABS, Tab } from "@/components/dash/DashHeader";
import { LeadsTab } from "@/components/dash/LeadsTab";
import { SummaryTab } from "@/components/dash/SummaryTab";
import { useApp } from "@/components/Providers";
import "./dashboard.css";

function ComingSoon() {
  const { t } = useApp();
  return (
    <div className="tab-content">
      <article className="card glass soon">
        <h3>{t.dash.soonTitle}</h3>
        <p className="muted">{t.dash.soonText}</p>
      </article>
    </div>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("summary");

  // вкладка хранится в адресе (#leads), чтобы можно было дать ссылку
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as Tab;
    if (TABS.includes(fromHash)) setTab(fromHash);
  }, []);

  function openTab(t: Tab) {
    setTab(t);
    window.history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="dash">
      <div className="dash-bg" aria-hidden="true" />
      <Bubbles />
      <DashHeader tab={tab} onTab={openTab} />
      {tab === "summary" && <SummaryTab />}
      {tab === "leads" && <LeadsTab />}
      {tab !== "summary" && tab !== "leads" && <ComingSoon />}
    </main>
  );
}
