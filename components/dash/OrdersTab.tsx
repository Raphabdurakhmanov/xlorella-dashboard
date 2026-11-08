"use client";

import { useState } from "react";
import { DeliveryStatus, Order, PaymentStatus } from "@/lib/data2";
import { Lead } from "@/lib/demo";
import { dict2 } from "@/lib/i18n2";
import { fmtNum, fmtSum } from "@/lib/metrics";
import { useApp } from "../Providers";

const DELIVERY: DeliveryStatus[] = ["new", "sent", "delivered", "returned"];
const PAYMENT: PaymentStatus[] = ["unpaid", "paid"];

export const DELIVERY_COLOR: Record<DeliveryStatus, string> = {
  new: "#5cc8ff",
  sent: "#ffc94d",
  delivered: "#7cff3a",
  returned: "#ff6b6b",
};

type Props = {
  orders: Order[];
  leads: Lead[];
  price: number;
  isDemo: boolean;
  canEdit: boolean;
  error: string;
  createOrder: (input: { leadId: number; customer: string; phone: string; city: string; quantity: number; amount: number; address: string }) => Promise<boolean>;
  updateOrder: (id: number, changes: { delivery?: DeliveryStatus; payment?: PaymentStatus }) => void;
  afterCreate: () => void;
};

export function OrdersTab({ orders, leads, price, isDemo, canEdit, error, createOrder, updateOrder, afterCreate }: Props) {
  const { t, lang } = useApp();
  const x = dict2[lang].orders;
  const [filter, setFilter] = useState<DeliveryStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ leadId: "", quantity: 1, amount: price, address: "" });

  // лиды, которым ещё можно оформить заказ (не «отказ»)
  const leadOptions = leads.filter((l) => l.status !== "lost");

  const q = search.trim().toLowerCase();
  const visible = orders.filter((o) => {
    if (filter !== "all" && o.delivery !== filter) return false;
    if (!q) return true;
    return [o.customer, o.phone, o.address, o.city].join(" ").toLowerCase().includes(q);
  });

  const active = orders.filter((o) => o.delivery !== "returned");
  const revenue = active.reduce((a, o) => a + o.amount, 0);
  const paid = active.filter((o) => o.payment === "paid").reduce((a, o) => a + o.amount, 0);
  const bottles = active.reduce((a, o) => a + o.quantity, 0);

  function pickLead(id: string) {
    const lead = leads.find((l) => String(l.id) === id);
    setForm({ ...form, leadId: id, address: lead?.city ? `${lead.city}, ` : form.address });
  }

  function setQty(qty: number) {
    const quantity = Math.max(1, qty || 1);
    setForm({ ...form, quantity, amount: quantity * price });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const lead = leads.find((l) => String(l.id) === form.leadId);
    if (!lead) return;
    setSaving(true);
    const ok = await createOrder({
      leadId: lead.id,
      customer: lead.name,
      phone: lead.phone,
      city: lead.city,
      quantity: form.quantity,
      amount: form.amount,
      address: form.address.trim(),
    });
    setSaving(false);
    if (ok) {
      setForm({ leadId: "", quantity: 1, amount: price, address: "" });
      afterCreate();
    }
  }

  return (
    <div className="tab-content">
      <div className="filters">
        <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          {t.dash.total} · {orders.length}
        </button>
        {DELIVERY.map((s) => (
          <button key={s} className={`chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            <i className="dot" style={{ background: DELIVERY_COLOR[s] }} />
            {x.deliveryStatus[s]} · {orders.filter((o) => o.delivery === s).length}
          </button>
        ))}
        {isDemo && <span className="demo-badge">{t.dash.demo}</span>}
      </div>

      <section className="bottom-strip glass">
        <div className="bottom-item"><div><b>{fmtNum(active.length)}</b><small>{x.total}</small></div></div>
        <div className="bottom-item"><div><b>{fmtNum(bottles)}</b><small>{x.bottles}</small></div></div>
        <div className="bottom-item"><div><b>{fmtSum(revenue)}</b><small>{x.revenue}</small></div></div>
        <div className="bottom-item">
          <div>
            <b>{fmtSum(paid)}</b>
            <small>{x.paid}</small>
            <div className="mini-progress"><span style={{ width: `${revenue ? (paid / revenue) * 100 : 0}%` }} /></div>
          </div>
        </div>
      </section>

      <section className="grid-1-2">
        <article className="card glass">
          <h3>{x.new}</h3>
          {!canEdit && <p className="muted small">{dict2[lang].common.readOnly}</p>}
          {canEdit && leadOptions.length === 0 && <p className="muted small">{x.noLeads}</p>}
          {canEdit && leadOptions.length > 0 && (
            <form className="stack-form" onSubmit={handleCreate}>
              <label>
                <span>{x.fromLead}</span>
                <select className="pill-select" value={form.leadId} onChange={(e) => pickLead(e.target.value)} required>
                  <option value="">{x.chooseLead}</option>
                  {leadOptions.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.phone ? `· ${l.phone}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label>
                  <span>{x.qty}</span>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => setQty(Number(e.target.value))} />
                </label>
                <label>
                  <span>{x.amount}</span>
                  <input type="number" min={0} step={1000} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </label>
              </div>
              <label>
                <span>{x.address}</span>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Toshkent, …" />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn-small" type="submit" disabled={saving}>{saving ? "…" : x.create}</button>
            </form>
          )}
        </article>

        <article className="card glass">
          <div className="card-head">
            <h3>{x.title}</h3>
          </div>
          <input className="search" placeholder={x.search} value={search} onChange={(e) => setSearch(e.target.value)} />
          {visible.length === 0 ? (
            <p className="muted empty-line">{x.empty}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{x.delivery}</th>
                    <th>{x.payment}</th>
                    <th>{x.customer}</th>
                    <th>{x.phone}</th>
                    <th className="num">{x.qty}</th>
                    <th className="num">{x.amount}</th>
                    <th>{x.address}</th>
                    <th>{x.manager}</th>
                    <th>{x.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <select
                          className="status-select"
                          value={o.delivery}
                          disabled={!canEdit}
                          onChange={(e) => updateOrder(o.id, { delivery: e.target.value as DeliveryStatus })}
                          style={{ borderColor: DELIVERY_COLOR[o.delivery], color: DELIVERY_COLOR[o.delivery] }}
                        >
                          {DELIVERY.map((s) => (
                            <option key={s} value={s}>{x.deliveryStatus[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={o.payment}
                          disabled={!canEdit}
                          onChange={(e) => updateOrder(o.id, { payment: e.target.value as PaymentStatus })}
                          style={{ borderColor: o.payment === "paid" ? "#7cff3a" : "#8a9a90", color: o.payment === "paid" ? "#7cff3a" : "#8a9a90" }}
                        >
                          {PAYMENT.map((s) => (
                            <option key={s} value={s}>{x.paymentStatus[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="strong nowrap">{o.customer}</td>
                      <td className="nowrap">{o.phone}</td>
                      <td className="num">{o.quantity}</td>
                      <td className="num nowrap">{fmtSum(o.amount)}</td>
                      <td>{o.address}</td>
                      <td>{o.manager}</td>
                      <td className="nowrap">{o.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted small table-foot">{visible.length} {t.dash.rows}</p>
        </article>
      </section>
    </div>
  );
}
