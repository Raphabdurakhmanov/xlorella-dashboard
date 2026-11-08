// Временный текстовый логотип, пока нет настоящего
export function Logo() {
  return (
    <div className="logo">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeOpacity="0.35" />
        <path d="M16 6 C8 11 8 21 16 26 C24 21 24 11 16 6 Z" fill="var(--accent)" />
        <path d="M16 10 L16 24" stroke="var(--bg)" strokeWidth="1.6" />
      </svg>
      <span>XLORELLA</span>
    </div>
  );
}
