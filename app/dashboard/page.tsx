"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bubbles } from "@/components/Bubbles";
import { AdSetsTab } from "@/components/dash/AdSetsTab";
import { BudgetTab } from "@/components/dash/BudgetTab";
import { DashHeader, TABS, Tab } from "@/components/dash/DashHeader";
import { LeadsTab } from "@/components/dash/LeadsTab";
import { NotesTab } from "@/components/dash/NotesTab";
import { OrdersTab } from "@/components/dash/OrdersTab";
import { RepeatTab } from "@/components/dash/RepeatTab";
import { StockTab } from "@/components/dash/StockTab";
import { SummaryTab } from "@/components/dash/SummaryTab";
import { useApp } from "@/components/Providers";
import { useDailyStats, useLeads, useProfile } from "@/lib/data";
import { useNotes, useOrders, useSettings, useStock } from "@/lib/data2";
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

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("summary");

  const { profile, loading: profileLoading, isDemo } = useProfile();
  const leadsApi = useLeads();
  const stats = useDailyStats(leadsApi.leads);
  const ordersApi = useOrders();
  const stockApi = useStock();
  const notesApi = useNotes();
  const settingsApi = useSettings();

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

  const role = profile?.role;
  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "manager";

  return (
    <main className="dash">
      <div className="dash-bg" aria-hidden="true" />
      <Bubbles />
      <DashHeader tab={tab} onTab={openTab} profile={profile} />

      {role === "pending" && <Pending />}

      {role !== "pending" && (
        <>
          {tab === "summary" && (
            <SummaryTab daily={stats.rows} daysPassed={stats.daysPassed} leads={leadsApi.leads} isDemo={isDemo} />
          )}

          {tab === "leads" && (
            <LeadsTab
              list={leadsApi.leads}
              isDemo={isDemo}
              canEdit={canEdit}
              error={leadsApi.error}
              addLead={leadsApi.addLead}
              updateLead={leadsApi.updateLead}
            />
          )}

          {tab === "adsets" && (
            <AdSetsTab daily={stats.rows} isDemo={isDemo} isAdmin={isAdmin} onImported={stats.reload} />
          )}

          {tab === "orders" && (
            <OrdersTab
              orders={ordersApi.orders}
              leads={leadsApi.leads}
              price={settingsApi.settings.price}
              isDemo={isDemo}
              canEdit={canEdit}
              error={ordersApi.error}
              createOrder={ordersApi.createOrder}
              updateOrder={ordersApi.updateOrder}
              afterCreate={() => {
                // лид стал «Заказ», склад списался — обновляем обе вкладки
                leadsApi.reload();
                stockApi.reload();
              }}
            />
          )}

          {tab === "budget" && (
            <BudgetTab
              daily={stats.rows}
              daysPassed={stats.daysPassed}
              settings={settingsApi.settings}
              isDemo={isDemo}
              isAdmin={isAdmin}
              error={settingsApi.error}
              saveSettings={settingsApi.saveSettings}
            />
          )}

          {tab === "stock" && (
            <StockTab
              moves={stockApi.moves}
              balance={stockApi.balance}
              orders={ordersApi.orders}
              isDemo={isDemo}
              isAdmin={isAdmin}
              error={stockApi.error}
              addMove={stockApi.addMove}
            />
          )}

          {tab === "repeat" && <RepeatTab orders={ordersApi.orders} isDemo={isDemo} />}

          {tab === "notes" && (
            <NotesTab
              notes={notesApi.notes}
              leads={leadsApi.leads}
              myId={profile?.id ?? ""}
              isAdmin={isAdmin}
              canWrite={canEdit}
              isDemo={isDemo}
              error={notesApi.error}
              addNote={notesApi.addNote}
              deleteNote={notesApi.deleteNote}
            />
          )}
        </>
      )}
    </main>
  );
}
