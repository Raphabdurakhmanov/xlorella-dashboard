"use client";

import { useState } from "react";
import { adsCsvToStats } from "@/lib/csv";
import { AdStatInput, saveAdStats } from "@/lib/data2";
import { AD_SETS, DayRow } from "@/lib/demo";
import { fill } from "@/lib/i18n";
import { dict2 } from "@/lib/i18n2";
import { Totals, calcKpi, fmtNum, fmtPct, fmtUsd, sumRows } from "@/lib/metrics";
import { useApp } from "../Providers";

type Props = {
  daily: DayRow[];
  isDemo: boolean;
  isAdmin: boolean;
  onImported: () => void;
};

type Line = { key: string; name: string; totals: Totals };

// таблица сравнения: одинаковые колонки для групп и для креативов
function CompareTable({ lines, firstCol }: { lines: Line[]; firstCol: string }) {
  const { t, lang } = useApp();
  const d = t.dash;
  const x = dict2[lang].adsets;

  // лучший — с самым низким CPA (если заказов нет — по цене диалога)
  const scored = lines.map((l) => {
    const k = calcKpi(l.totals);
    return { key: l.key, score: k.cpa ?? (k.costPerDialog !== null ? k.costPerDialog * 100 : null) };
  });
  const withScore = scored.filter((s) => s.score !== null) as { key: string; score: number }[];
  const best = withScore.length > 1 ? withScore.reduce((a, b) => (b.score < a.score ? b : a)).key : null;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{firstCol}</th>
            <th className="num">{d.spend}</th>
            <th className="num">{d.cpm}</th>
            <th className="num">{d.ctr}</th>
            <th className="num">{d.cpc}</th>
            <th className="num">{d.dialogs}</th>
            <th className="num">{d.costPerDialog}</th>
            <th className="num">{d.orders}</th>
            <th className="num">{d.cpa}</th>
            <th className="num">{d.roas}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => {
            const k = calcKpi(l.totals);
            return (
              <tr key={l.key} className={best === l.key ? "best-row" : ""}>
                <td className="strong nowrap">
                  {l.name} {best === l.key && <span className="badge best">{x.best}</span>}
                </td>
                <td className="num">{fmtUsd(l.totals.spend)}</td>
                <td className="num">{fmtUsd(k.cpm)}</td>
                <td className="num">{fmtPct(k.ctr, 2)}</td>
                <td className="num">{fmtUsd(k.cpc)}</td>
                <td className="num">{fmtNum(l.totals.dialogs)}</td>
                <td className="num">{fmtUsd(k.costPerDialog)}</td>
                <td className="num">{fmtNum(l.totals.orders)}</td>
                <td className="num">{fmtUsd(k.cpa)}</td>
                <td className="num">{k.roas === null ? "—" : k.roas.toFixed(2) + "×"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdSetsTab({ daily, isDemo, isAdmin, onImported }: Props) {
  const { t, lang } = useApp();
  const x = dict2[lang].adsets;
  const [parsed, setParsed] = useState<AdStatInput[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const setLines: Line[] = AD_SETS.map((s) => ({
    key: s.id,
    name: s.name,
    totals: sumRows(daily.filter((r) => r.adSet === s.id)),
  }));

  const creativeLines: Line[] = t.dash.videos.map((name, i) => ({
    key: String(i + 1),
    name: `#${i + 1} ${name}`,
    totals: sumRows(daily.filter((r) => r.creative === i + 1)),
  }));

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setStatus("");
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = adsCsvToStats(text);
    setParsed(result.rows);
    setSkipped(result.skipped);
  }

  async function handleSave() {
    if (!parsed || parsed.length === 0) return;
    setSaving(true);
    const res = await saveAdStats(parsed);
    setSaving(false);
    if (res.ok) {
      setStatus(x.saved);
      setParsed(null);
      onImported();
    } else {
      setStatus(res.message);
    }
  }

  return (
    <div className="tab-content">
      <div className="filters">{isDemo && <span className="demo-badge">{t.dash.demo}</span>}</div>

      <article className="card glass">
        <h3>{x.setsTitle}</h3>
        {daily.length === 0 ? <p className="muted empty-line">{x.noData}</p> : <CompareTable lines={setLines} firstCol={x.group} />}
      </article>

      <article className="card glass">
        <h3>{x.creativesTitle}</h3>
        {daily.length === 0 ? <p className="muted empty-line">{x.noData}</p> : <CompareTable lines={creativeLines} firstCol={x.creative} />}
      </article>

      <article className="card glass">
        <h3>{x.importTitle}</h3>
        <p className="muted small">{x.importText}</p>
        {isAdmin ? (
          <div className="import-box">
            <label className="btn-ghost-small file-btn">
              {x.chooseFile}
              <input type="file" accept=".csv,text/csv" onChange={handleFile} hidden />
            </label>
            {parsed && (
              <>
                <span className="small">{fill(x.preview, { n: parsed.length })}</span>
                {skipped > 0 && <span className="small bad-text">{fill(x.skipped, { n: skipped })}</span>}
                <button className="btn-small" onClick={handleSave} disabled={saving || parsed.length === 0}>
                  {saving ? "…" : x.save}
                </button>
              </>
            )}
            {status && <span className="small good-text">{status}</span>}
          </div>
        ) : (
          <p className="muted small">{x.adminOnly}</p>
        )}

        {parsed && parsed.length > 0 && (
          <div className="table-wrap preview-table">
            <table className="table compact">
              <thead>
                <tr>
                  <th>{t.dash.col.date}</th>
                  <th>{x.group}</th>
                  <th>{x.creative}</th>
                  <th className="num">{t.dash.spend}</th>
                  <th className="num">Impr.</th>
                  <th className="num">Clicks</th>
                  <th className="num">{t.dash.dialogs}</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 30).map((r) => (
                  <tr key={`${r.day}-${r.ad_set}-${r.creative}`}>
                    <td>{r.day}</td>
                    <td>{AD_SETS.find((s) => s.id === r.ad_set)?.name}</td>
                    <td>#{r.creative}</td>
                    <td className="num">{fmtUsd(r.spend)}</td>
                    <td className="num">{fmtNum(r.impressions)}</td>
                    <td className="num">{fmtNum(r.clicks)}</td>
                    <td className="num">{fmtNum(r.dialogs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
