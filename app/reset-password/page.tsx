"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) { setMessage("Supabase is not configured."); return; }
    if (password.length < 8) { setMessage("Use at least 8 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setMessage(error ? error.message : "Password updated. You can sign in now.");
  }
  return <main className="landing" style={{display:"grid",placeItems:"center"}}>
    <section className="login-card glass" style={{position:"relative",zIndex:2}}>
      <h1>Reset password</h1>
      <p className="muted">Choose a new password for your account.</p>
      <form onSubmit={save}>
        <label><span>New password</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
      </form>
      {message && <p role="status" className="login-note">{message}</p>}
      <p className="login-note"><Link href="/">Back to sign in</Link></p>
    </section>
  </main>;
}
