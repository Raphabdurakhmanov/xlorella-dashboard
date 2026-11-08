// Разбор CSV-выгрузки из Meta Ads Manager.
// Названия колонок бывают на русском и английском — ищем по ключевым словам.

import { AdSetId } from "./demo";
import { AdStatInput } from "./data2";

// простой парсер CSV с кавычками
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  // разделитель: запятая или точка с запятой (Excel в РФ/УЗ часто ставит ;)
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const sep = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function findCol(headers: string[], keys: string[]) {
  const h = headers.map((x) => x.toLowerCase().replace(/^﻿/, "").trim());
  for (const k of keys) {
    const i = h.findIndex((x) => x.includes(k));
    if (i !== -1) return i;
  }
  return -1;
}

function toNumber(v: string | undefined) {
  if (!v) return 0;
  const n = Number(v.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

// "2026-11-02", "02.11.2026", "11/02/2026" -> "2026-11-02"
function toDate(v: string | undefined) {
  if (!v) return null;
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return null;
}

// название группы -> наш id
function toAdSet(name: string): AdSetId | null {
  const n = name.toLowerCase();
  if (n.includes("broad") || n.startsWith("01")) return "broad";
  if (n.includes("health") || n.includes("food") || n.includes("здоров") || n.startsWith("02")) return "healthy";
  if (n.includes("plant") || n.includes("fit") || n.includes("фитнес") || n.startsWith("03")) return "plant";
  return null;
}

// номер видео из названия объявления: "Video 2", "видео-3", "V4"…
function toCreative(name: string) {
  const m = name.toLowerCase().match(/(?:video|видео|v)\s*[-_#]?\s*([1-4])/) ?? name.match(/([1-4])/);
  return m ? Number(m[1]) : 1;
}

export function adsCsvToStats(text: string) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { rows: [] as AdStatInput[], skipped: 0 };

  const head = rows[0];
  const col = {
    day: findCol(head, ["day", "день", "reporting starts", "начало отч", "date", "дата"]),
    adSet: findCol(head, ["ad set name", "название группы", "группа объявлений", "ad set"]),
    ad: findCol(head, ["ad name", "название объявления", "объявлени"]),
    spend: findCol(head, ["amount spent", "потраченная сумма", "сумма затрат", "spend"]),
    impressions: findCol(head, ["impressions", "показы"]),
    clicks: findCol(head, ["link clicks", "клики по ссылке", "clicks (all)", "клики (все)", "clicks", "клики"]),
    dialogs: findCol(head, ["messaging conversations started", "начатые переписки", "переписк", "conversations", "results", "результаты"]),
  };

  // складываем строки с одинаковыми днём/группой/креативом
  const map = new Map<string, AdStatInput>();
  let skipped = 0;

  for (const r of rows.slice(1)) {
    const day = toDate(r[col.day]);
    const adSet = col.adSet >= 0 ? toAdSet(r[col.adSet] ?? "") : null;
    if (!day || !adSet) {
      skipped++;
      continue;
    }
    const creative = col.ad >= 0 ? toCreative(r[col.ad] ?? "") : 1;
    const key = `${day}|${adSet}|${creative}`;
    const prev = map.get(key) ?? { day, ad_set: adSet, creative, spend: 0, impressions: 0, clicks: 0, dialogs: 0 };
    prev.spend += toNumber(r[col.spend]);
    prev.impressions += Math.round(toNumber(r[col.impressions]));
    prev.clicks += Math.round(toNumber(r[col.clicks]));
    prev.dialogs += Math.round(toNumber(r[col.dialogs]));
    map.set(key, prev);
  }

  const result = Array.from(map.values()).map((s) => ({ ...s, spend: Math.round(s.spend * 100) / 100 }));
  return { rows: result, skipped };
}
