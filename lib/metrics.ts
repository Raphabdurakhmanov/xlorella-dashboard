import { DayRow, UNIT, USD_RATE } from "./demo";

export type Totals = {
  spend: number;
  impressions: number;
  clicks: number;
  dialogs: number;
  orders: number;
  revenue: number;
};

export function sumRows(rows: DayRow[]): Totals {
  return rows.reduce(
    (acc, r) => ({
      spend: acc.spend + r.spend,
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      dialogs: acc.dialogs + r.dialogs,
      orders: acc.orders + r.orders,
      revenue: acc.revenue + r.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, dialogs: 0, orders: 0, revenue: 0 }
  );
}

// формулы из раздела 11 медиаплана
export function calcKpi(t: Totals) {
  const div = (a: number, b: number) => (b > 0 ? a / b : null);
  return {
    cpm: div(t.spend * 1000, t.impressions),
    ctr: div(t.clicks, t.impressions),
    cpc: div(t.spend, t.clicks),
    costPerDialog: div(t.spend, t.dialogs),
    cpa: div(t.spend, t.orders),
    // выручка в сумах, расход в $ — переводим по курсу
    roas: div(t.revenue / USD_RATE, t.spend),
  };
}

export function unitEconomics() {
  const margin = UNIT.price - UNIT.cost - UNIT.delivery;
  const maxCpa = Math.max(0, margin - UNIT.price * UNIT.targetMargin);
  return { margin, maxCpa, maxCpaUsd: maxCpa / USD_RATE };
}

// форматирование
export const fmtUsd = (n: number | null, digits = 2) =>
  n === null ? "—" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtNum = (n: number | null) => (n === null ? "—" : Math.round(n).toLocaleString("ru-RU"));

export const fmtPct = (n: number | null, digits = 1) => (n === null ? "—" : (n * 100).toFixed(digits) + "%");

export const fmtSum = (n: number | null) =>
  n === null ? "—" : Math.round(n).toLocaleString("ru-RU") + " so‘m";

// изменение в процентах к прошлому периоду
export function change(now: number | null, before: number | null) {
  if (now === null || before === null || before === 0) return null;
  return (now - before) / before;
}
