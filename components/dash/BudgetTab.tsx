"use client";

import { useEffect, useState } from "react";
import { Settings } from "@/lib/data2";
import { AD_SETS, DayRow, PLAN } from "@/lib/demo";
import { dict2 } from "@/lib/i18n2";
import { fmtPct, fmtSum, fmtUsd, sumRows } from "@/lib/metrics";
import { useApp } from "../Providers";
import { BarLineChart } from "./charts";

type Props = {
  daily: DayRow[];
  daysPassed: number;
  settings: Settings;
  isDemo: boolean;
  isAdmin: boolean;
  error: string;
  saveSettings: (s: Settings) => Promise<boolean>;
};

export function BudgetTab({ daily, daysPassed, settings, isDemo, isAdmin, error, saveSettings }: Props) {
  const { t, lang } = useApp();
  const x = dict2[lang].budget;
  const [form, setForm] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);

  // настройки могли загрузиться позже — обновляем форму
  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const total = settings.totalBudget;
  const perDay = total / PLAN.days;
  const spent = sumRows(daily).spend;
  const left = Math.max(0, total - spent);
  const planToday = Math.min(total, perDay * daysPassed);
  const paceRatio = planToday > 0 ? spent / planToday : null;
  const paceText =
    paceRatio === null ? "—" : paceRatio > 1.1 ? x.ahead : paceRatio < 0.9 ? x.behind : x.onPlan;

  // нарастающий итог по дням
  const dates = Array.from(new Set(daily.map((r) => r.date))).sort();
  let running = 0;
  const chartData = dates.map((date, i) => {
    running += sumRows(daily.filter((r) => r.date === date)).spend;
    return { label: date.slice(8, 10) + "." + date.slice(5, 7), bar: running, line: perDay * (i + 1) };
  });

  const maxCpa = Math.max(0, settings.price - settings.cost - settings.delivery - settings.price * settings.targetMargin);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const ok = await saveSettings(form);
    if (ok) setSaved(true);
  }

  function num(key: "totalBudget" | "usdRate" | "price" | "cost" | "delivery", value: string) {
    setSaved(false);
    setForm({ ...form, [key]: Number(value) });
  }

  return (
    <div className="tab-content">
      <div className="filters">{isDemo && <span className="demo-badge">{t.dash.demo}</span>}</div>

      <section className="bottom-strip glass">
        <div className="bottom-item">
          <div>
            <b>{fmtUsd(spent, 0)}</b>
            <small>{x.spent} · {fmtUsd(total, 0)}</small>
            <div className="mini-progress"><span style={{ width: `${Math.min(100, (spent / total) * 100)}%` }} /></div>
          </div>
        </div>
        <div className="bottom-item"><div><b>{fmtUsd(left, 0)}</b><small>{x.left}</small></div></div>
        <div className="bottom-item"><div><b>{fmtUsd(planToday, 0)}</b><small>{x.planToday}</small></div></div>
        <div className="bottom-item">
          <div>
            <b className={paceRatio !== null && Math.abs(paceRatio - 1) > 0.1 ? "warn-text" : "good-text"}>
              {paceRatio === null ? "—" : fmtPct(paceRatio, 0)}
            </b>
            <small>{x.pace} · {paceText}</small>
          </div>
        </div>
      </section>

      <section className="grid-2-1">
        <article className="card glass">
          <h3>{x.chartTitle}</h3>
          <p className="muted small">{x.chartNote}</p>
          <BarLineChart
            data={chartData}
            barName={x.fact}
            lineName={x.plan}
            formatBar={(n) => fmtUsd(n, 0)}
            formatLine={(n) => fmtUsd(n, 0)}
            sameScale
          />
        </article>

        <article className="card glass">
          <h3>{x.bySet}</h3>
          <div className="plan-bars">
            {AD_SETS.map((s) => {
              const fact = sumRows(daily.filter((r) => r.adSet === s.id)).spend;
              const plan = planToday * s.share;
              const max = Math.max(fact, plan, 1);
              return (
                <div key={s.id} className="plan-bar">
                  <div className="plan-bar-head">
                    <b>{s.name}</b>
                    <span className="muted small">{fmtUsd(fact, 0)} / {fmtUsd(plan, 0)}</span>
                  </div>
                  <div className="bar-track"><span className="fact" style={{ width: `${(fact / max) * 100}%` }} /></div>
                  <div className="bar-track thin"><span className="plan" style={{ width: `${(plan / max) * 100}%` }} /></div>
                </div>
              );
            })}
            <p className="muted small">
              <i className="sw sw-bar" />{x.fact} &nbsp; <i className="sw sw-line" />{x.plan}
            </p>
          </div>
        </article>
      </section>

      <article className="card glass">
        <div className="card-head">
          <h3>{x.settings}</h3>
          <span className="badge">{x.maxCpa}: {fmtSum(maxCpa)} · {fmtUsd(maxCpa / settings.usdRate)}</span>
        </div>
        <form className="settings-grid" onSubmit={handleSave}>
          <label><span>{x.totalBudget}</span><input type="number" min={0} value={form.totalBudget} disabled={!isAdmin} onChange={(e) => num("totalBudget", e.target.value)} /></label>
          <label><span>{x.usdRate}</span><input type="number" min={1} value={form.usdRate} disabled={!isAdmin} onChange={(e) => num("usdRate", e.target.value)} /></label>
          <label><span>{x.price}</span><input type="number" min={0} step={1000} value={form.price} disabled={!isAdmin} onChange={(e) => num("price", e.target.value)} /></label>
          <label><span>{x.cost}</span><input type="number" min={0} step={1000} value={form.cost} disabled={!isAdmin} onChange={(e) => num("cost", e.target.value)} /></label>
          <label><span>{x.delivery}</span><input type="number" min={0} step={1000} value={form.delivery} disabled={!isAdmin} onChange={(e) => num("delivery", e.target.value)} /></label>
          <label>
            <span>{x.targetMargin}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(form.targetMargin * 100)}
              disabled={!isAdmin}
              onChange={(e) => {
                setSaved(false);
                setForm({ ...form, targetMargin: Number(e.target.value) / 100 });
              }}
            />
          </label>
          <label>
            <span>{x.testStart}</span>
            <input
              type="date"
              value={form.testStart}
              disabled={!isAdmin}
              onChange={(e) => {
                setSaved(false);
                setForm({ ...form, testStart: e.target.value });
              }}
            />
          </label>
          {isAdmin && (
            <div className="settings-actions">
              <button className="btn-small" type="submit">{x.save}</button>
              {saved && <span className="small good-text">{x.saved}</span>}
              {error && <span className="form-error">{error}</span>}
            </div>
          )}
        </form>
      </article>
    </div>
  );
}
