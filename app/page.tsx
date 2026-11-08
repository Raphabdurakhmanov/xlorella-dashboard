"use client";

import { Bottle } from "@/components/Bottle";
import { Bubbles } from "@/components/Bubbles";
import { LoginCard } from "@/components/LoginCard";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/Providers";
import { Toggles } from "@/components/Toggles";

export default function LandingPage() {
  const { t } = useApp();
  const l = t.landing;

  const features = [
    { title: l.featAds, sub: l.featAdsSub, icon: "M3 3v18h18M7 15l4-4 3 3 5-6" },
    { title: l.featLeads, sub: l.featLeadsSub, icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
    { title: l.featOrders, sub: l.featOrdersSub, icon: "M3 7h13v10H3zM16 10h4l1 3v4h-5M7 20a2 2 0 1 0 0-.01M18 20a2 2 0 1 0 0-.01" },
    { title: l.featStock, sub: l.featStockSub, icon: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" },
  ];

  const proofPoints = [l.callAlga, l.callChlorophyll, l.callSyrup];

  return (
    <main className="landing">
      <Bubbles />
      <div className="mesh mesh-a" aria-hidden="true" />
      <div className="mesh mesh-b" aria-hidden="true" />

      <header className="landing-top">
        <Logo />
        <Toggles />
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">{l.eyebrow}</span>
          <h1 className="hero-title">
            <span className="neon">{l.title.slice(0, 3)}</span>
            {l.title.slice(3)}
          </h1>
          <p className="hero-sub">{l.subtitle}</p>
          <p className="hero-desc">{l.text}</p>

          <div className="hero-points">
            {proofPoints.map((item) => (
              <span key={item} className="hero-point glass">
                {item}
              </span>
            ))}
          </div>

          <p className="disclaimer">{t.common.disclaimer}</p>
        </div>

        <div className="hero-visual glass">
          <div className="visual-scene" aria-hidden="true" />
          <div className="visual-vignette" aria-hidden="true" />
          <div className="pedestal" aria-hidden="true" />

          <Bottle className="bottle" />
        </div>

        <div className="hero-login">
          <LoginCard />
        </div>
      </section>

      <section className="feature-strip glass">
        {features.map((f) => (
          <div key={f.title} className="feature">
            <span className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon} />
              </svg>
            </span>
            <div>
              <b>{f.title}</b>
              <small>{f.sub}</small>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
