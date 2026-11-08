"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bubbles } from "@/components/Bubbles";
import { DashHeader, TABS, Tab } from "@/components/dash/DashHeader";
import { LeadsTab } from "@/components/dash/LeadsTab";
import { SummaryTab } from "@/components/dash/SummaryTab";
import { useApp } from "@/components/Providers";
import { useDailyStats, useLeads, useProfile } from "@/lib/data";
import "./dashboard.css";

function Pending() {
  const { t } = useApp();
  return (
    <div className="tab-content">
      <article className="card glass soon">
        <h3>{t.dash.pendingTitle}</h3>
        <p className="muted">{t.dash.pendingText}</p>
      </article>
    </div>
  );
}

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
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("summary");

  const { profile, loading: profileLoading, isDemo } = useProfile();
  const leadsApi = useLeads();
  const stats = useDailyStats(leadsApi.leads);

  // не вошёл — на главную (в демо-режиме пускаем всех)
  useEffect(() => {
    if (!isDemo && !profileLoading && !profile) router.replace("/");
  }, [isDemo, profileLoading, profile, router]);

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

  const canEdit = profile?.role === "admin" || profile?.role === "manager";

  return (
    <main className="dash">
      <div className="dash-bg" aria-hidden="true" />
      <Bubbles />
      <DashHeader tab={tab} onTab={openTab} profile={profile} />

      {profile?.role === "pending" && <Pending />}

      {profile?.role !== "pending" && tab === "summary" && (
        <SummaryTab daily={stats.rows} daysPassed={stats.daysPassed} leads={leadsApi.leads} isDemo={isDemo} />
      )}
      {profile?.role !== "pending" && tab === "leads" && (
        <LeadsTab
          list={leadsApi.leads}
          isDemo={isDemo}
          canEdit={canEdit}
          error={leadsApi.error}
          addLead={leadsApi.addLead}
          updateLead={leadsApi.updateLead}
        />
      )}
      {profile?.role !== "pending" && tab !== "summary" && tab !== "leads" && <ComingSoon />}
    </main>
  );
}
