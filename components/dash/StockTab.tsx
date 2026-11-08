"use client";

import { useState } from "react";
import { Order, StockMove } from "@/lib/data2";
import { dict2 } from "@/lib/i18n2";
import { fill } from "@/lib/i18n";
import { fmtNum } from "@/lib/metrics";
import { useApp } from "../Providers";

const LOW_STOCK = 20; // меньше этого — предупреждение

type Props = {
  moves: StockMove[];
  balance: number;
  orders: Order[];
  isDemo: boolean;
  isAdmin: boolean;
  error: string;
  addMove: (quantity: number, reason: "arrival" | "manual") => Promise<boolean>;
};

export function StockTab({ moves, balance, orders, isDemo, isAdmin, error, addMove }: Props) {
  const { t, lang } = useApp();
  const x = dict2[lang].stock;
  const [arrival, setArrival] = useState(50);
  const [correction, setCorrection] = useState(-1);

  const arrived = moves.filter((m) => m.reason === "arrival").reduce((a, m) => a + m.quantity, 0);
  const sold = -moves.filter((m) => m.reason === "order").reduce((a, m) => a + m.quantity, 0);
  const returned = moves.filter((m) => m.reason === "return").reduce((a, m) => a + m.quantity, 0);

  // сколько дней хватит: по среднему расходу бутылок в день за дни с заказами
  const orderDays = new Set(orders.map((o) => o.createdAt)).size;
  const perDay = orderDays > 0 ? sold / orderDays : 0;
  const daysLeft = perDay > 0 ? Math.floor(balance / perDay) : null;

  const percent = arrived > 0 ? Math.max(0, Math.min(100, (balance / arrived) * 100)) : 0;

  return (
    <div className="tab-content">
      <div className="filters">{isDemo && <span className="demo-badge">{t.dash.demo}</span>}</div>

      <section className="grid-1-2">
        <article className={`card glass stock-hero ${balance < LOW_STOCK ? "low" : ""}`}>
          <h3>{x.balance}</h3>
          <div className="stock-number">
            <b>{fmtNum(balance)}</b>
            <span>{x.bottles}</span>
          </div>
          <div className="mini-progress big"><span style={{ width: `${percent}%` }} /></div>
          {daysLeft !== null && <p className="muted small">{fill(x.daysLeft, { d: daysLeft })}</p>}
          {balance < LOW_STOCK && <p className="unit-status bad">! {x.low}</p>}

          <dl className="set-stats">
            <div><dt>{x.arrived}</dt><dd>{fmtNum(arrived)}</dd></div>
            <div><dt>{x.sold}</dt><dd>{fmtNum(sold)}</dd></div>
            <div><dt>{x.returned}</dt><dd>{fmtNum(returned)}</dd></div>
          </dl>

          {isAdmin ? (
            <div className="stack-form">
              <div className="form-row">
                <label>
                  <span>{x.add}</span>
                  <input type="number" min={1} value={arrival} onChange={(e) => setArrival(Number(e.target.value))} />
                </label>
                <button className="btn-small align-end" onClick={() => arrival > 0 && addMove(arrival, "arrival")}>+ {x.save}</button>
              </div>
              <div className="form-row">
                <label>
                  <span>{x.correction}</span>
                  <input type="number" value={correction} onChange={(e) => setCorrection(Number(e.target.value))} />
                </label>
                <button className="btn-ghost-small align-end" onClick={() => correction !== 0 && addMove(correction, "manual")}>{x.save}</button>
              </div>
              {error && <p className="form-error">{error}</p>}
            </div>
          ) : (
            <p className="muted small">{x.adminOnly}</p>
          )}
        </article>

        <article className="card glass">
          <h3>{x.history}</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.dash.col.date}</th>
                  <th>{t.dash.col.status}</th>
                  <th className="num">{x.bottles}</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td className="nowrap">{m.createdAt}</td>
                    <td>
                      {x.reason[m.reason]}
                      {m.orderId ? ` #${m.orderId}` : ""}
                    </td>
                    <td className={`num strong ${m.quantity > 0 ? "good-text" : "bad-text"}`}>
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
