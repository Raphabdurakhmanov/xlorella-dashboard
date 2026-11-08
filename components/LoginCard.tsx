"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, supabaseReady } from "@/lib/supabase";
import { useApp } from "./Providers";

// Можно входить по короткому логину (Rose) — он превращается в rose@xlorella.uz.
// Supabase хранит пользователей по email, поэтому логин = email без домена.
function loginToEmail(login: string) {
  const v = login.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@xlorella.uz`;
}

export function LoginCard() {
  const { t } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const supabase = getSupabase();
    if (!supabase) {
      // демо: просто пускаем в дашборд
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginToEmail(email), password });
    setLoading(false);

    if (error) {
      setError(t.login.error);
      return;
    }
    router.push("/dashboard");
  }

  async function handleGoogle() {
    const supabase = getSupabase();
    if (!supabase) {
      router.push("/dashboard");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="login-card glass">
      <h2>{t.login.title}</h2>
      <p className="muted">{t.login.subtitle}</p>

      <form onSubmit={handleSubmit}>
        <label>
          <span>{t.login.email}</span>
          <input
            type="text"
            autoComplete="username"
            placeholder="Rose"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={supabaseReady}
          />
        </label>

        <label>
          <span className="label-row">
            {t.login.password}
            <a href="#" className="link-small">{t.login.forgot}</a>
          </span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={supabaseReady}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t.login.loading : t.login.submit}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="divider"><span>{t.login.or}</span></div>

      <button type="button" className="btn-ghost" onClick={handleGoogle}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {t.login.google}
      </button>

      <p className="login-note">{supabaseReady ? t.login.note : t.login.demo}</p>
    </div>
  );
}
