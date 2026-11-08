"use client";

import { Order } from "@/lib/data2";
import { dict2 } from "@/lib/i18n2";
import { fmtNum, fmtPct, fmtSum } from "@/lib/metrics";
import { useApp } from "../Providers";
import { Donut } from "./charts";

type Customer = { key: string; name: string; phone: string; orders: number; total: number; last: string };

export function RepeatTab({ orders, isDemo }: { orders: Order[]; isDemo: boolean }) {
  const { t, lang } = useApp();
  const x = dict2[lang].repeat;

  // клиента определяем по телефону (если его нет — по имени); возвраты не считаем
  const map = new Map<string, Customer>();
  for (const o of orders) {
    if (o.delivery === "returned") continue;
    const key = o.phone.replace(/\D/g, "") || o.customer.toLowerCase();
    const c = map.get(key) ?? { key, name: o.customer, phone: o.phone, orders: 0, total: 0, last: o.createdAt };
    c.orders += 1;
    c.total += o.amount;
    if (o.createdAt > c.last) c.last = o.createdAt;
    map.set(key, c);
  }
  const customers = Array.from(map.values()).sort((a, b) => b.orders - a.orders || b.total - a.total);
  const repeat = customers.filter((c) => c.orders > 1).length;
  const once = customers.length - repeat;

  return (
    <div className="tab-content">
      <div className="filters">{isDemo && <span className="demo-badge">{t.dash.demo}</span>}</div>

      <section className="grid-1-2">
        <article className="card glass donut-card">
          <h3>{x.title}</h3>
          <div className="donut-wrap">
            <Donut
              total={customers.length}
              totalLabel={x.customers}
              parts={[
                { value: once, color: "#5cc8ff", label: x.oneTime },
                { value: repeat, color: "#7cff3a", label: x.repeatBuyers },
              ]}
            />
            <ul className="legend">
              <li><i className="dot" style={{ background: "#5cc8ff" }} />{x.oneTime} · {once}</li>
              <li><i className="dot" style={{ background: "#7cff3a" }} />{x.repeatBuyers} · {repeat}</li>
              <li className="strong">{x.repeatRate}: {fmtPct(customers.length ? repeat / customers.length : null, 0)}</li>
            </ul>
          </div>
        </article>

        <article className="card glass">
          <h3>{x.customers}</h3>
          {customers.length === 0 ? (
            <p className="muted empty-line">{x.empty}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{x.customer}</th>
                    <th>{t.dash.col.phone}</th>
                    <th className="num">{x.orders}</th>
                    <th className="num">{x.total}</th>
                    <th>{x.last}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.key} className={c.orders > 1 ? "best-row" : ""}>
                      <td className="strong nowrap">{c.name}</td>
                      <td className="nowrap">{c.phone}</td>
                      <td className="num">{fmtNum(c.orders)}</td>
                      <td className="num nowrap">{fmtSum(c.total)}</td>
                      <td className="nowrap">{c.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
