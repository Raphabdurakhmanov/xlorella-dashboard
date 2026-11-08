"use client";

import { useState } from "react";
import { Note } from "@/lib/data2";
import { Lead } from "@/lib/demo";
import { dict2 } from "@/lib/i18n2";
import { useApp } from "../Providers";

type Props = {
  notes: Note[];
  leads: Lead[];
  myId: string;
  isAdmin: boolean;
  canWrite: boolean;
  isDemo: boolean;
  error: string;
  addNote: (text: string, leadId: number | null, leadName: string) => Promise<boolean>;
  deleteNote: (id: number) => void;
};

export function NotesTab({ notes, leads, myId, isAdmin, canWrite, isDemo, error, addNote, deleteNote }: Props) {
  const { t, lang } = useApp();
  const x = dict2[lang].notes;
  const [text, setText] = useState("");
  const [leadId, setLeadId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const lead = leads.find((l) => String(l.id) === leadId);
    setSaving(true);
    const ok = await addNote(text.trim(), lead ? lead.id : null, lead ? lead.name : "");
    setSaving(false);
    if (ok) {
      setText("");
      setLeadId("");
    }
  }

  return (
    <div className="tab-content">
      <div className="filters">{isDemo && <span className="demo-badge">{t.dash.demo}</span>}</div>

      <section className="grid-1-2">
        <article className="card glass">
          <h3>{x.add}</h3>
          {canWrite ? (
            <form className="stack-form" onSubmit={handleAdd}>
              <textarea rows={5} placeholder={x.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
              <label>
                <span>{x.lead}</span>
                <select className="pill-select" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                  <option value="">{x.noLead}</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn-small" type="submit" disabled={saving}>{saving ? "…" : x.add}</button>
            </form>
          ) : (
            <p className="muted small">{dict2[lang].common.readOnly}</p>
          )}
        </article>

        <article className="card glass">
          <h3>{x.title}</h3>
          {notes.length === 0 && <p className="muted empty-line">{x.empty}</p>}
          <ul className="notes-list">
            {notes.map((n) => (
              <li key={n.id} className="note glass">
                <div className="note-head">
                  <span className="badge">{n.leadName || x.general}</span>
                  <span className="muted small">{n.author} · {n.createdAt}</span>
                </div>
                <p>{n.text}</p>
                {(n.authorId === myId || isAdmin) && (
                  <button className="link-small danger" onClick={() => deleteNote(n.id)}>{x.delete}</button>
                )}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
