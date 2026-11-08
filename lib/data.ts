"use client";

// Загрузка данных. Если Supabase не настроен — отдаём демо-данные.

import { useCallback, useEffect, useState } from "react";
import { AdSetId, DAYS_PASSED, DayRow, Lead, LeadStatus, daily as demoDaily, leads as demoLeads } from "./demo";
import { getSupabase } from "./supabase";

export type Role = "admin" | "manager" | "owner" | "pending";
export type Profile = { id: string; name: string; role: Role };

const DEMO_PROFILE: Profile = { id: "demo", name: "Alisher B.", role: "admin" };

// ---------- профиль текущего пользователя ----------
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", auth.user.id)
        .single();

      setProfile({
        id: auth.user.id,
        name: data?.full_name || auth.user.email || "User",
        role: (data?.role as Role) || "pending",
      });
      setLoading(false);
    })();
  }, []);

  return { profile, loading, isDemo: !getSupabase() };
}

// ---------- лиды ----------
type LeadRow = {
  id: number;
  status: LeadStatus;
  name: string;
  phone: string | null;
  city: string | null;
  ad_set: AdSetId | null;
  creative: number | null;
  amount: number;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

function toLead(r: LeadRow): Lead {
  return {
    id: r.id,
    status: r.status,
    name: r.name,
    phone: r.phone ?? "",
    city: r.city ?? "",
    adSet: r.ad_set ?? "broad",
    creative: r.creative ?? 1,
    manager: r.profiles?.full_name ?? "—",
    amount: Number(r.amount) || 0,
    createdAt: r.created_at.slice(0, 10),
  };
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isDemo = !getSupabase();

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLeads(demoLeads);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, status, name, phone, city, ad_set, creative, amount, created_at, profiles(full_name)")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setLeads((data as unknown as LeadRow[]).map(toLead));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addLead(input: { name: string; phone: string; city: string; adSet: AdSetId; creative: number }) {
    const supabase = getSupabase();
    if (!supabase) {
      // демо — только в памяти
      const lead: Lead = {
        id: Date.now(),
        status: "new",
        name: input.name,
        phone: input.phone,
        city: input.city,
        adSet: input.adSet,
        creative: input.creative,
        manager: DEMO_PROFILE.name,
        amount: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setLeads((prev) => [lead, ...prev]);
      return true;
    }

    const { error } = await supabase.from("leads").insert({
      name: input.name,
      phone: input.phone || null,
      city: input.city || null,
      ad_set: input.adSet,
      creative: input.creative,
    });
    if (error) {
      setError(error.message);
      return false;
    }
    await load();
    return true;
  }

  async function updateLead(id: number, changes: { status?: LeadStatus; amount?: number }) {
    // сразу меняем на экране, потом сохраняем
    const before = leads;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...changes } : l)));

    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.from("leads").update(changes).eq("id", id);
    if (error) {
      setError(error.message);
      setLeads(before); // откат
    }
  }

  return { leads, loading, error, isDemo, addLead, updateLead, reload: load };
}

// ---------- статистика рекламы по дням ----------
type StatRow = {
  day: string;
  ad_set: AdSetId;
  creative: number;
  spend: number;
  impressions: number;
  clicks: number;
  dialogs: number;
};

export function useDailyStats(leads: Lead[]) {
  const [stats, setStats] = useState<StatRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = !getSupabase();

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("ad_stats")
      .select("day, ad_set, creative, spend, impressions, clicks, dialogs")
      .order("day");
    setStats((data as StatRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isDemo) {
    return { rows: demoDaily, daysPassed: DAYS_PASSED, loading: false, isDemo, reload: load };
  }

  // номера дней теста по порядку дат
  const dates = Array.from(new Set((stats ?? []).map((s) => s.day))).sort();

  const rows: DayRow[] = (stats ?? []).map((s) => {
    // заказы и выручку берём из лидов со статусом "заказ" того же дня, группы и креатива
    const matched = leads.filter(
      (l) => l.status === "order" && l.createdAt === s.day && l.adSet === s.ad_set && l.creative === s.creative
    );
    return {
      day: dates.indexOf(s.day) + 1,
      date: s.day,
      adSet: s.ad_set,
      creative: s.creative,
      spend: Number(s.spend),
      impressions: s.impressions,
      clicks: s.clicks,
      dialogs: s.dialogs,
      orders: matched.length,
      revenue: matched.reduce((a, l) => a + l.amount, 0),
    };
  });

  return { rows, daysPassed: dates.length, loading, isDemo, reload: load };
}
