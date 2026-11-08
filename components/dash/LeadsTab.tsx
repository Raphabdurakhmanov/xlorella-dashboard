"use client";

import { useState } from "react";
import { AD_SETS, Lead, LeadStatus, leads as demoLeads } from "@/lib/demo";
import { fmtPct, fmtSum } from "@/lib/metrics";
import { useApp } from "../Providers";
import { Donut } from "./charts";

const STATUS_ORDER: LeadStatus[] = ["new", "qualified", "order", "lost"];

// цвета статусов (одинаковые в обеих темах)
export const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "#5cc8ff",
  qualified: "#ffc94d",
  order: "#7cff3a",
  lost: "#8a9a90",
};

const setName = (id: string) => AD_SETS.find((s) => s.id === id)?.name ?? id;

export function LeadsTab() {
  const { t } = useApp();
  const d = t.dash;
  const [list, setList] = useState<Lead[]>(demoLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", city: "Toshkent" });

  const counts = STATUS_ORDER.map((s) => ({
    status: s,
    count: list.filter((l) => l.status === s).length,
    amount: list.filter((l) => l.status === s).reduce((a, l) => a + l.amount, 0),
  }));

  const q = search.trim().toLowerCase();
  const visible = list.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (!q) return true;
    return [l.name, l.phone, l.city, l.manager].join(" ").toLowerCase().includes(q);
  });

  function changeStatus(id: number, status: LeadStatus) {
    setList(list.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  function addLead(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newLead: Lead = {
      id: Date.now(),
      status: "new",
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      adSet: "broad",
      creative: 1,
      manager: "Alisher",
      amount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    // TODO: сохранять в Supabase, сейчас только локально
    setList([newLead, ...list]);
    setForm({ name: "", phone: "", city: "Toshkent" });
    setShowForm(false);
  }

  return (
    <div className="tab-content">
      <div className="filters">
        <button className={`chip ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>
          {d.total} · {list.length}
        </button>
        {counts.map((c) => (
          <button
            key={c.status}
            className={`chip ${statusFilter === c.status ? "active" : ""}`}
            onClick={() => setStatusFilter(c.status)}
          >
            <i className="dot" style={{ background: STATUS_COLOR[c.status] }} />
            {d.status[c.status]} · {c.count}
          </button>
        ))}
        <span className="demo-badge">{d.demo}</span>
      </div>

      <section className="grid-1-2">
        <div className="stack">
          <article className="card glass donut-card">
            <h3>{d.statusTitle}</h3>
            <div className="donut-wrap">
              <Donut
                total={list.length}
                totalLabel={d.total}
                parts={counts.map((c) => ({ value: c.count, color: STATUS_COLOR[c.status], label: d.status[c.status] }))}
              />
              <ul className="legend">
                {counts.map((c) => (
                  <li key={c.status}>
                    <i className="dot" style={{ background: STATUS_COLOR[c.status] }} />
                    {d.status[c.status]}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="card glass">
            <h3>{d.summaryTitle}</h3>
            <table className="table compact">
              <thead>
                <tr>
                  <th>{d.col.status}</th>
                  <th className="num">{d.count}</th>
                  <th className="num">{d.share}</th>
                  <th className="num">{d.amount}</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((c) => (
                  <tr key={c.status}>
                    <td>{d.status[c.status]}</td>
                    <td className="num">{c.count}</td>
                    <td className="num">{fmtPct(list.length ? c.count / list.length : null)}</td>
                    <td className="num">{c.amount ? fmtSum(c.amount) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>{d.total}</td>
                  <td className="num">{list.length}</td>
                  <td className="num">100%</td>
                  <td className="num">{fmtSum(counts.reduce((a, c) => a + c.amount, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </article>
        </div>

        <article className="card glass">
          <div className="card-head">
            <h3>{d.leadsTitle}</h3>
            <button className="btn-small" onClick={() => setShowForm(!showForm)}>+ {d.addLead}</button>
          </div>

          {showForm && (
            <form className="inline-form" onSubmit={addLead}>
              <input placeholder={d.col.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input placeholder={d.col.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input placeholder={d.col.city} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <button className="btn-small" type="submit">OK</button>
            </form>
          )}

          <input className="search" placeholder={d.search} value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{d.col.status}</th>
                  <th>{d.col.name}</th>
                  <th>{d.col.phone}</th>
                  <th>{d.col.city}</th>
                  <th>{d.col.adSet}</th>
                  <th>{d.col.creative}</th>
                  <th>{d.col.manager}</th>
                  <th className="num">{d.col.amount}</th>
                  <th>{d.col.date}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <select
                        className="status-select"
                        value={l.status}
                        onChange={(e) => changeStatus(l.id, e.target.value as LeadStatus)}
                        style={{ borderColor: STATUS_COLOR[l.status], color: STATUS_COLOR[l.status] }}
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>{d.status[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="strong nowrap">{l.name}</td>
                    <td className="nowrap">{l.phone}</td>
                    <td>{l.city}</td>
                    <td className="nowrap">{setName(l.adSet)}</td>
                    <td>#{l.creative}</td>
                    <td>{l.manager}</td>
                    <td className="num nowrap">{l.amount ? fmtSum(l.amount) : "—"}</td>
                    <td className="nowrap">{l.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small table-foot">{visible.length} {d.rows}</p>
        </article>
      </section>
    </div>
  );
}
