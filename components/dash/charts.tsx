"use client";

import { useState } from "react";

// ===== Столбцы (расход) + линия (диалоги) по дням =====
type Point = { label: string; bar: number; line: number };

export function BarLineChart({
  data,
  barName,
  lineName,
  formatBar,
  formatLine = (n) => String(n),
  sameScale = false,
}: {
  data: Point[];
  barName: string;
  lineName: string;
  formatBar: (n: number) => string;
  formatLine?: (n: number) => string;
  sameScale?: boolean; // одна шкала для столбцов и линии (например, факт и план в $)
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 640;
  const H = 240;
  const pad = { top: 16, right: 36, bottom: 28, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  let maxBar = Math.max(...data.map((d) => d.bar), 1) * 1.15;
  let maxLine = Math.max(...data.map((d) => d.line), 1) * 1.15;
  if (sameScale) {
    maxBar = Math.max(maxBar, maxLine);
    maxLine = maxBar;
  }
  const step = innerW / data.length;
  const barW = Math.min(32, step * 0.55);

  const x = (i: number) => pad.left + step * i + step / 2;
  const yBar = (v: number) => pad.top + innerH - (v / maxBar) * innerH;
  const yLine = (v: number) => pad.top + innerH - (v / maxLine) * innerH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * maxBar);
  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${yLine(d.line)}`).join(" ");

  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${barName}, ${lineName}`}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={yBar(v)} y2={yBar(v)} className="grid" />
            <text x={pad.left - 8} y={yBar(v) + 4} textAnchor="end" className="tick">
              ${Math.round(v)}
            </text>
          </g>
        ))}

        {data.map((d, i) => (
          <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {/* невидимая зона для наведения */}
            <rect x={x(i) - step / 2} y={pad.top} width={step} height={innerH} fill="transparent" />
            <rect
              x={x(i) - barW / 2}
              y={yBar(d.bar)}
              width={barW}
              height={pad.top + innerH - yBar(d.bar)}
              rx="6"
              className={hover === i ? "bar bar-hover" : "bar"}
            />
            <text x={x(i)} y={H - 8} textAnchor="middle" className="tick">
              {d.label}
            </text>
          </g>
        ))}

        <path d={linePath} className="line" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={yLine(d.line)} r={hover === i ? 5 : 3.5} className="dot" />
        ))}
      </svg>

      {hover !== null && (
        <div
          className="tooltip glass"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 8 }}
        >
          <div className="muted">{data[hover].label}</div>
          <div><i className="sw sw-bar" />{barName}: <b>{formatBar(data[hover].bar)}</b></div>
          <div><i className="sw sw-line" />{lineName}: <b>{formatLine(data[hover].line)}</b></div>
        </div>
      )}
    </div>
  );
}

// ===== Кольцевая диаграмма =====
export function Donut({
  parts,
  total,
  totalLabel,
}: {
  parts: { value: number; color: string; label: string }[];
  total: number;
  totalLabel: string;
}) {
  const r = 70;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 200 200" className="donut" role="img" aria-label={totalLabel}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--glass-border)" strokeWidth="26" />
      {parts.map((p) => {
        const len = total > 0 ? (p.value / total) * c : 0;
        const el = (
          <circle
            key={p.label}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth="26"
            strokeDasharray={`${Math.max(len - 2, 0)} ${c}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 100 100)"
          >
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
        );
        offset += len;
        return el;
      })}
      <text x="100" y="98" textAnchor="middle" className="donut-total">{total}</text>
      <text x="100" y="120" textAnchor="middle" className="donut-label">{totalLabel}</text>
    </svg>
  );
}
