"use client";

import { useRef, useState } from "react";
import { AD_SETS, AdSetId, DayRow, Lead, PLAN } from "@/lib/demo";
import { fill } from "@/lib/i18n";
import {
  calcKpi, change, fmtNum, fmtPct, fmtSum, fmtUsd, sumRows, unitEconomics,
} from "@/lib/metrics";
import { Bottle } from "../Bottle";
import { useApp } from "../Providers";
import { BarLineChart } from "./charts";

// иконки (просто path для svg 24x24)
const ICONS = {
  spend: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  dialogs: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  orders: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  click: "M9 9l5 12 1.8-5.2L21 14zM7.2 2.2L8 5.1M5.1 8l-2.9-.8M14 4.1L12 6.2M6.2 12L4.1 14",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  leaf: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5.1-6",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
};

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// стрелка изменения. lowerIsBetter — для метрик-затрат (CPA, CPC…)
function Delta({ value, lowerIsBetter = false }: { value: number | null; lowerIsBetter?: boolean }) {
  if (value === null) return <span className="delta">—</span>;
  const good = lowerIsBetter ? value < 0 : value > 0;
  return (
    <span className={`delta ${good ? "good" : "bad"}`}>
      {value > 0 ? "↑" : "↓"} {Math.abs(value * 100).toFixed(1)}%
    </span>
  );
}

const SET_ICONS: Record<AdSetId, string> = { broad: ICONS.globe, healthy: ICONS.leaf, plant: ICONS.target };

type Props = {
  daily: DayRow[];
  daysPassed: number;
  leads: Lead[];
  isDemo: boolean;
};

export function SummaryTab({ daily, daysPassed, leads, isDemo }: Props) {
  const { t } = useApp();
  const d = t.dash;
  const [period, setPeriod] = useState<"all" | "last3">("all");
  const [adSet, setAdSet] = useState<AdSetId | "all">("all");
  const carousel = useRef<HTMLDivElement>(null);

  // фильтруем строки
  const bySet = daily.filter((r) => adSet === "all" || r.adSet === adSet);
  const rows = period === "all" ? bySet : bySet.filter((r) => r.day > daysPassed - 3);
  const totals = sumRows(rows);
  const kpi = calcKpi(totals);

  // для стрелок: последние 3 дня против 3 дней до них
  const last3 = sumRows(bySet.filter((r) => r.day > daysPassed - 3));
  const prev3 = sumRows(bySet.filter((r) => r.day > daysPassed - 6 && r.day <= daysPassed - 3));
  const kLast = calcKpi(last3);
  const kPrev = calcKpi(prev3);

  // по дням для графика
  const days = Array.from(new Set(rows.map((r) => r.day)));
  const chartData = days.map((day) => {
    const s = sumRows(rows.filter((r) => r.day === day));
    const date = rows.find((r) => r.day === day)!.date;
    return { label: date.slice(8, 10) + "." + date.slice(5, 7), bar: s.spend, line: s.dialogs };
  });

  const allSpend = sumRows(daily).spend;
  const unit = unitEconomics();
  const cpaOk = kpi.cpa !== null && kpi.cpa <= unit.maxCpaUsd;
  const ordersFromLeads = leads.filter((l) => l.status === "order").length;

  const kpiStrip = [
    { key: "cpm", label: d.cpm, value: fmtUsd(kpi.cpm), delta: change(kLast.cpm, kPrev.cpm), low: true, icon: ICONS.eye },
    { key: "ctr", label: d.ctr, value: fmtPct(kpi.ctr, 2), delta: change(kLast.ctr, kPrev.ctr), low: false, icon: ICONS.click },
    { key: "cpc", label: d.cpc, value: fmtUsd(kpi.cpc), delta: change(kLast.cpc, kPrev.cpc), low: true, icon: ICONS.target },
    { key: "cpd", label: d.costPerDialog, value: fmtUsd(kpi.costPerDialog), delta: change(kLast.costPerDialog, kPrev.costPerDialog), low: true, icon: ICONS.dialogs },
    { key: "cpa", label: d.cpa, value: fmtUsd(kpi.cpa), delta: change(kLast.cpa, kPrev.cpa), low: true, icon: ICONS.orders },
    { key: "roas", label: d.roas, value: kpi.roas === null ? "—" : kpi.roas.toFixed(2) + "×", delta: change(kLast.roas, kPrev.roas), low: false, icon: ICONS.chart },
  ];

  function scrollCarousel(dir: number) {
    carousel.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  return (
    <div className="tab-content">
      {/* фильтры */}
      <div className="filters">
        <select className="pill-select" value={period} onChange={(e) => setPeriod(e.target.value as "all" | "last3")}>
          <option value="all">{d.allTest}</option>
          <option value="last3">{d.last3}</option>
        </select>
        <select className="pill-select" value={adSet} onChange={(e) => setAdSet(e.target.value as AdSetId | "all")}>
          <option value="all">{d.allSets}</option>
          {AD_SETS.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {isDemo && <span className="demo-badge">{d.demo}</span>}
      </div>

      {/* hero */}
      <section className="hero-card glass">
        <div className="hero-card-text">
          <span className="eyebrow">{fill(d.dayOf, { d: daysPassed, n: PLAN.days })}</span>
          <h1 className="dash-title">
            {d.heroA}<br />{d.heroB}<br /><span className="neon">{d.heroC}</span>
          </h1>
          <p className="muted">{d.heroText}</p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="round-icon"><Icon d={ICONS.spend} /></span>
              <b>{fmtUsd(totals.spend)}</b>
              <small>{d.spend}</small>
              <Delta value={change(last3.spend, prev3.spend)} />
            </div>
            <div className="hero-stat">
              <span className="round-icon"><Icon d={ICONS.dialogs} /></span>
              <b>{fmtNum(totals.dialogs)}</b>
              <small>{d.dialogs}</small>
              <Delta value={change(last3.dialogs, prev3.dialogs)} />
            </div>
            <div className="hero-stat">
              <span className="round-icon"><Icon d={ICONS.orders} /></span>
              <b>{fmtNum(totals.orders)}</b>
              <small>{d.orders}</small>
              <Delta value={change(last3.orders, prev3.orders)} />
            </div>
          </div>
        </div>

        <div className="hero-card-visual">
          <div className="hero-glow" aria-hidden="true" />
          <Bottle className="hero-bottle" />
          <div className="revenue-chip glass">
            <small>{d.revenue}</small>
            <b>{fmtSum(totals.revenue)}</b>
            <span className="muted small">ROAS {kpi.roas === null ? "—" : kpi.roas.toFixed(2) + "×"}</span>
          </div>
        </div>
      </section>

      {/* лента KPI */}
      <section className="kpi-strip glass">
        {kpiStrip.map((k) => (
          <div key={k.key} className="kpi">
            <span className="kpi-icon"><Icon d={k.icon} size={18} /></span>
            <div>
              <small>{k.label}</small>
              <b>{k.value}</b>
              <Delta value={k.delta} lowerIsBetter={k.low} />
            </div>
          </div>
        ))}
      </section>

      {/* группы объявлений */}
      <section className="cards-3">
        {AD_SETS.map((s) => {
          const st = sumRows(daily.filter((r) => r.adSet === s.id && (period === "all" || r.day > daysPassed - 3)));
          const k = calcKpi(st);
          const factShare = allSpend > 0 ? sumRows(daily.filter((r) => r.adSet === s.id)).spend / allSpend : 0;
          return (
            <article key={s.id} className={`set-card glass ${adSet === s.id ? "selected" : ""}`}>
              <div className="set-card-top">
                <span className="round-icon big"><Icon d={SET_ICONS[s.id]} size={26} /></span>
                <span className="badge">{fill(d.planShare, { p: Math.round(s.share * 100) })}</span>
              </div>
              <h3>{s.name}</h3>
              <div className="share-bar" title={fill(d.factShare, { p: (factShare * 100).toFixed(0) })}>
                <span style={{ width: `${factShare * 100}%` }} />
                <i style={{ left: `${s.share * 100}%` }} />
              </div>
              <small className="muted">{fill(d.factShare, { p: (factShare * 100).toFixed(0) })}</small>
              <dl className="set-stats">
                <div><dt>{d.spend}</dt><dd>{fmtUsd(st.spend)}</dd></div>
                <div><dt>{d.dialogs}</dt><dd>{fmtNum(st.dialogs)}</dd></div>
                <div><dt>{d.orders}</dt><dd>{fmtNum(st.orders)}</dd></div>
                <div><dt>{d.cpa}</dt><dd>{fmtUsd(k.cpa)}</dd></div>
              </dl>
              <button className="link-btn" onClick={() => setAdSet(s.id)}>
                {d.details} <span aria-hidden="true">→</span>
              </button>
            </article>
          );
        })}
      </section>

      {/* график + экономика */}
      <section className="grid-2-1">
        <article className="card glass">
          <h3>{d.chartTitle}</h3>
          <p className="muted small">{d.chartNote}</p>
          <BarLineChart data={chartData} barName={d.spend} lineName={d.dialogs} formatBar={(n) => fmtUsd(n)} />
        </article>

        <article className="card glass unit-card">
          <h3>{d.unitTitle}</h3>
          <div className="unit-row">
            <span>{d.margin}</span>
            <b>{fmtSum(unit.margin)}</b>
          </div>
          <div className="unit-row">
            <span>{d.maxCpa}</span>
            <b>{fmtUsd(unit.maxCpaUsd)}</b>
          </div>
          <div className="unit-row">
            <span>{d.factCpa}</span>
            <b className={cpaOk ? "good-text" : "bad-text"}>{fmtUsd(kpi.cpa)}</b>
          </div>
          <div className={`unit-status ${cpaOk ? "ok" : "bad"}`}>
            {cpaOk ? "✓ " + d.cpaOk : "! " + d.cpaBad}
          </div>
          <div className="cpa-meter">
            <span style={{ width: `${Math.min(100, ((kpi.cpa ?? 0) / (unit.maxCpaUsd * 2)) * 100)}%` }} />
            <i style={{ left: "50%" }} />
          </div>
        </article>
      </section>

      {/* чек-лист + креативы */}
      <section className="grid-1-2">
        <article className="card glass checklist-card">
          <h3>{d.checklistTitle}</h3>
          <ul className="checklist">
            {d.checklist.map((item, i) => (
                            <li key={i} className={isDemo && i < 4 ? "done" : ""}>
                <span className="check">{isDemo && i < 4 ? "✓" : ""}</span>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="card glass creatives-card">
          <div className="card-head">
            <h3>{d.creatives}</h3>
            <div className="arrows">
              <button onClick={() => scrollCarousel(-1)} aria-label="Previous">‹</button>
              <button onClick={() => scrollCarousel(1)} aria-label="Next">›</button>
            </div>
          </div>
          <div className="carousel" ref={carousel}>
            {d.videos.map((name, i) => {
              const st = sumRows(rows.filter((r) => r.creative === i + 1));
              const k = calcKpi(st);
              return (
                <div key={i} className="creative">
                  <div className={`creative-thumb v${i + 1}`}>
                    <span className="play">▶</span>
                    <span className="video-num">VIDEO {i + 1}</span>
                  </div>
                  <b>{name}</b>
                  <div className="creative-stats">
                    <span>{d.dialogs}: <b>{fmtNum(st.dialogs)}</b></span>
                    <span>{d.ctr}: <b>{fmtPct(k.ctr, 2)}</b></span>
                    <span>{d.costPerDialog}: <b>{fmtUsd(k.costPerDialog)}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {/* нижняя полоса */}
      <section className="bottom-strip glass">
        <div className="bottom-item">
          <span className="round-icon"><Icon d={ICONS.spend} /></span>
          <div>
            <b>{fmtUsd(allSpend, 0)}</b>
            <small>{fill(d.spentOf, { b: fmtUsd(PLAN.totalBudget, 0) })}</small>
            <div className="mini-progress"><span style={{ width: `${(allSpend / PLAN.totalBudget) * 100}%` }} /></div>
          </div>
        </div>
        <div className="bottom-item">
          <span className="round-icon"><Icon d={ICONS.dialogs} /></span>
          <div>
            <b>{leads.length}</b>
            <small>{d.totalLeads}</small>
          </div>
        </div>
        <div className="bottom-item">
          <span className="round-icon"><Icon d={ICONS.chart} /></span>
          <div>
            <b>{fmtPct(leads.length ? ordersFromLeads / leads.length : null, 0)}</b>
            <small>{d.conversion}</small>
          </div>
        </div>
        <div className="bottom-item">
          <span className="round-icon"><Icon d={ICONS.orders} /></span>
          <div>
            <b>{fmtSum(sumRows(daily).revenue)}</b>
            <small>{d.revenue}</small>
          </div>
        </div>
      </section>
    </div>
  );
}
