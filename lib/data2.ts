"use client";

// Заказы, склад, заметки, настройки, импорт статистики рекламы.
// Как и в data.ts: без Supabase всё работает на демо-данных в памяти.

import { useCallback, useEffect, useState } from "react";
import { AdSetId, PLAN, UNIT, USD_RATE, leads as demoLeads } from "./demo";
import { getSupabase } from "./supabase";

// ---------- типы ----------
export type DeliveryStatus = "new" | "sent" | "delivered" | "returned";
export type PaymentStatus = "unpaid" | "paid";

export type Order = {
  id: number;
  leadId: number | null;
  customer: string;
  phone: string;
  city: string;
  quantity: number;
  amount: number; // сум
  address: string;
  delivery: DeliveryStatus;
  payment: PaymentStatus;
  manager: string;
  createdAt: string;
};

export type StockMove = {
  id: number;
  quantity: number;
  reason: "arrival" | "order" | "return" | "manual";
  orderId: number | null;
  createdAt: string;
};

export type Note = {
  id: number;
  text: string;
  leadId: number | null;
  leadName: string;
  author: string;
  authorId: string;
  createdAt: string;
};

export type Settings = {
  usdRate: number;
  price: number;
  cost: number;
  delivery: number;
  targetMargin: number;
  totalBudget: number;
  testStart: string;
};

export const DEFAULT_SETTINGS: Settings = {
  usdRate: USD_RATE,
  price: UNIT.price,
  cost: UNIT.cost,
  delivery: UNIT.delivery,
  targetMargin: UNIT.targetMargin,
  totalBudget: PLAN.totalBudget,
  testStart: "2026-11-02",
};

// ---------- демо ----------
const deliveries: DeliveryStatus[] = ["delivered", "sent", "new", "delivered", "returned"];

const demoOrders: Order[] = demoLeads
  .filter((l) => l.status === "order")
  .map((l, i) => ({
    id: 500 + i,
    leadId: l.id,
    customer: l.name,
    phone: l.phone,
    city: l.city,
    quantity: l.amount / UNIT.price || 1,
    amount: l.amount,
    address: `${l.city}, ул. Навои ${10 + i}`,
    delivery: deliveries[i % deliveries.length],
    payment: i % 3 === 2 ? "unpaid" : "paid",
    manager: l.manager,
    createdAt: l.createdAt,
  }));

// повторный заказ одного клиента, чтобы вкладка «Повторные» не была пустой
if (demoOrders.length > 0) {
  demoOrders.push({ ...demoOrders[0], id: 599, quantity: 2, amount: UNIT.price * 2, delivery: "new", createdAt: "2026-11-08" });
}

const demoStock: StockMove[] = [
  { id: 1, quantity: 100, reason: "arrival", orderId: null, createdAt: "2026-11-01" },
  ...demoOrders.map((o, i) => ({ id: 10 + i, quantity: -o.quantity, reason: "order" as const, orderId: o.id, createdAt: o.createdAt })),
];

const demoNotes: Note[] = [
  { id: 1, text: "Broad даёт дешёвые диалоги, но мало заказов — смотрим ещё 3 дня.", leadId: null, leadName: "", author: "Alisher B.", authorId: "demo", createdAt: "2026-11-06" },
  { id: 2, text: "Просила перезвонить вечером после 19:00.", leadId: demoLeads[1]?.id ?? null, leadName: demoLeads[1]?.name ?? "", author: "Raph", authorId: "x", createdAt: "2026-11-07" },
];

const today = () => new Date().toISOString().slice(0, 10);

// ---------- заказы ----------
type OrderRow = {
  id: number;
  lead_id: number | null;
  quantity: number;
  amount: number;
  address: string | null;
  delivery_status: DeliveryStatus;
  payment_status: PaymentStatus;
  created_at: string;
  leads: { name: string; phone: string | null; city: string | null } | null;
  profiles: { full_name: string | null } | null;
};

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setOrders(demoOrders);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("orders")
      .select("id, lead_id, quantity, amount, address, delivery_status, payment_status, created_at, leads(name, phone, city), profiles(full_name)")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else
      setOrders(
        (data as unknown as OrderRow[]).map((r) => ({
          id: r.id,
          leadId: r.lead_id,
          customer: r.leads?.name ?? "—",
          phone: r.leads?.phone ?? "",
          city: r.leads?.city ?? "",
          quantity: r.quantity,
          amount: Number(r.amount) || 0,
          address: r.address ?? "",
          delivery: r.delivery_status,
          payment: r.payment_status,
          manager: r.profiles?.full_name ?? "—",
          createdAt: r.created_at.slice(0, 10),
        }))
      );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // заказ создаётся из лида; лид автоматически становится «Заказ»
  async function createOrder(input: { leadId: number; customer: string; phone: string; city: string; quantity: number; amount: number; address: string }) {
    setError("");
    const supabase = getSupabase();
    if (!supabase) {
      setOrders((prev) => [
        { id: Date.now(), leadId: input.leadId, customer: input.customer, phone: input.phone, city: input.city, quantity: input.quantity, amount: input.amount, address: input.address, delivery: "new", payment: "unpaid", manager: "Alisher B.", createdAt: today() },
        ...prev,
      ]);
      return true;
    }
    const { error } = await supabase.from("orders").insert({
      lead_id: input.leadId,
      quantity: input.quantity,
      amount: input.amount,
      address: input.address || null,
    });
    if (error) {
      setError(error.message);
      return false;
    }
    await supabase.from("leads").update({ status: "order", amount: input.amount }).eq("id", input.leadId);
    await load();
    return true;
  }

  async function updateOrder(id: number, changes: { delivery?: DeliveryStatus; payment?: PaymentStatus }) {
    const before = orders;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)));
    const supabase = getSupabase();
    if (!supabase) return;
    const row: Record<string, string> = {};
    if (changes.delivery) row.delivery_status = changes.delivery;
    if (changes.payment) row.payment_status = changes.payment;
    const { error } = await supabase.from("orders").update(row).eq("id", id);
    if (error) {
      setError(error.message);
      setOrders(before);
    }
  }

  return { orders, loading, error, createOrder, updateOrder, reload: load };
}

// ---------- склад ----------
type StockRow = { id: number; quantity: number; reason: StockMove["reason"]; order_id: number | null; created_at: string };

export function useStock() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setMoves(demoStock);
      return;
    }
    const { data, error } = await supabase
      .from("stock_moves")
      .select("id, quantity, reason, order_id, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else
      setMoves(
        (data as StockRow[]).map((r) => ({ id: r.id, quantity: r.quantity, reason: r.reason, orderId: r.order_id, createdAt: r.created_at.slice(0, 10) }))
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addMove(quantity: number, reason: "arrival" | "manual") {
    setError("");
    const supabase = getSupabase();
    if (!supabase) {
      setMoves((prev) => [{ id: Date.now(), quantity, reason, orderId: null, createdAt: today() }, ...prev]);
      return true;
    }
    const { error } = await supabase.from("stock_moves").insert({ quantity, reason });
    if (error) {
      setError(error.message);
      return false;
    }
    await load();
    return true;
  }

  const balance = moves.reduce((a, m) => a + m.quantity, 0);
  return { moves, balance, error, addMove, reload: load };
}

// ---------- заметки ----------
type NoteRow = {
  id: number;
  text: string;
  lead_id: number | null;
  author_id: string;
  created_at: string;
  leads: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setNotes(demoNotes);
      return;
    }
    const { data, error } = await supabase
      .from("notes")
      .select("id, text, lead_id, author_id, created_at, leads(name), profiles(full_name)")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else
      setNotes(
        (data as unknown as NoteRow[]).map((r) => ({
          id: r.id,
          text: r.text,
          leadId: r.lead_id,
          leadName: r.leads?.name ?? "",
          author: r.profiles?.full_name ?? "—",
          authorId: r.author_id,
          createdAt: r.created_at.slice(0, 10),
        }))
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addNote(text: string, leadId: number | null, leadName: string) {
    setError("");
    const supabase = getSupabase();
    if (!supabase) {
      setNotes((prev) => [{ id: Date.now(), text, leadId, leadName, author: "Alisher B.", authorId: "demo", createdAt: today() }, ...prev]);
      return true;
    }
    const { error } = await supabase.from("notes").insert({ text, lead_id: leadId });
    if (error) {
      setError(error.message);
      return false;
    }
    await load();
    return true;
  }

  async function deleteNote(id: number) {
    const supabase = getSupabase();
    if (!supabase) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return;
    }
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) setError(error.message);
    else setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return { notes, error, addNote, deleteNote };
}

// ---------- настройки ----------
type SettingsRow = {
  usd_rate: number;
  price: number;
  cost: number;
  delivery: number;
  target_margin: number;
  total_budget: number;
  test_start: string;
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    (async () => {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
      const r = data as SettingsRow | null;
      if (r) {
        setSettings({
          usdRate: Number(r.usd_rate),
          price: Number(r.price),
          cost: Number(r.cost),
          delivery: Number(r.delivery),
          targetMargin: Number(r.target_margin),
          totalBudget: Number(r.total_budget),
          testStart: r.test_start,
        });
      }
    })();
  }, []);

  async function saveSettings(s: Settings) {
    setError("");
    setSettings(s);
    const supabase = getSupabase();
    if (!supabase) return true;
    const { error } = await supabase
      .from("settings")
      .update({
        usd_rate: s.usdRate,
        price: s.price,
        cost: s.cost,
        delivery: s.delivery,
        target_margin: s.targetMargin,
        total_budget: s.totalBudget,
        test_start: s.testStart,
      })
      .eq("id", 1);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  return { settings, error, saveSettings };
}

// ---------- импорт статистики рекламы ----------
export type AdStatInput = {
  day: string;
  ad_set: AdSetId;
  creative: number;
  spend: number;
  impressions: number;
  clicks: number;
  dialogs: number;
};

export async function saveAdStats(rows: AdStatInput[]) {
  const supabase = getSupabase();
  if (!supabase) return { ok: true, message: "" };
  const { error } = await supabase.from("ad_stats").upsert(rows, { onConflict: "day,ad_set,creative" });
  return { ok: !error, message: error?.message ?? "" };
}
