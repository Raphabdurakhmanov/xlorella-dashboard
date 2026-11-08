// Бутылка сиропа хлореллы, нарисована в SVG.
// Когда будет реальное фото продукта — можно заменить на <Image />.

// частицы водоросли внутри жидкости (фиксированные, чтобы не было рандома при рендере)
const particles = [
  [62, 250, 3], [88, 268, 2], [120, 240, 2.5], [150, 262, 3], [178, 248, 2],
  [70, 300, 2], [104, 318, 3.5], [140, 296, 2], [170, 330, 3], [55, 360, 2.5],
  [95, 372, 2], [130, 350, 3], [186, 380, 2.5], [66, 420, 3], [112, 430, 2],
  [150, 410, 3.5], [182, 440, 2], [80, 470, 2.5], [128, 480, 3], [164, 476, 2],
  [100, 452, 1.5], [142, 456, 1.5], [60, 330, 1.5], [196, 300, 1.5], [118, 392, 1.5],
];

export function Bottle({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 530"
      role="img"
      aria-label="Xlorella syrup bottle"
    >
      <defs>
        <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6ff4a" />
          <stop offset="0.35" stopColor="#5fe33a" />
          <stop offset="1" stopColor="#0d6b2c" />
        </linearGradient>
        <linearGradient id="liquidSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="cap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#04170f" />
          <stop offset="0.35" stopColor="#1d4d36" />
          <stop offset="0.6" stopColor="#0b2b1d" />
          <stop offset="1" stopColor="#020c07" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <clipPath id="bodyClip">
          <path d="M92 112 C92 146 30 146 30 196 L30 476 Q30 512 66 512 L174 512 Q210 512 210 476 L210 196 C210 146 148 146 148 112 Z" />
        </clipPath>
      </defs>

      {/* свечение за бутылкой */}
      <ellipse cx="120" cy="370" rx="95" ry="150" fill="#5fe33a" opacity="0.45" filter="url(#glow)" />

      {/* крышка */}
      <rect x="78" y="14" width="84" height="64" rx="10" fill="url(#cap)" />
      {[90, 102, 114, 126, 138, 150].map((x) => (
        <rect key={x} x={x} y="20" width="3" height="52" rx="1.5" fill="#ffffff" opacity="0.07" />
      ))}
      <rect x="84" y="18" width="10" height="56" rx="5" fill="#ffffff" opacity="0.12" />
      <rect x="74" y="74" width="92" height="12" rx="4" fill="#06231a" />

      {/* горлышко + корпус (стекло) */}
      <rect x="92" y="84" width="56" height="32" fill="url(#glass)" stroke="#9dff6a" strokeOpacity="0.35" />
      <path
        d="M92 112 C92 146 30 146 30 196 L30 476 Q30 512 66 512 L174 512 Q210 512 210 476 L210 196 C210 146 148 146 148 112 Z"
        fill="url(#glass)"
      />

      {/* жидкость */}
      <g clipPath="url(#bodyClip)">
        <rect x="20" y="214" width="200" height="310" fill="url(#liquid)" />
        <rect x="20" y="214" width="200" height="310" fill="url(#liquidSide)" />
        <ellipse cx="120" cy="214" rx="92" ry="9" fill="#d4ff7a" opacity="0.85" />
        {particles.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#e9ffc4" opacity={0.25 + (i % 4) * 0.12} />
        ))}
      </g>

      {/* этикетка */}
      <g>
        <rect x="44" y="284" width="152" height="150" rx="10" fill="#04170f" opacity="0.82" />
        <rect x="44" y="284" width="152" height="150" rx="10" fill="none" stroke="#9dff6a" strokeOpacity="0.4" />
        {/* листик */}
        <path d="M120 306 C104 316 104 334 120 342 C136 334 136 316 120 306 Z" fill="#7cff3a" />
        <path d="M120 312 L120 340" stroke="#04170f" strokeWidth="1.5" />
        <text x="120" y="372" textAnchor="middle" fill="#ffffff" fontFamily="var(--font-head), Arial, sans-serif" fontWeight="800" fontSize="22" letterSpacing="2">
          XLORELLA
        </text>
        <text x="120" y="392" textAnchor="middle" fill="#9dff6a" fontFamily="var(--font-body), Arial, sans-serif" fontSize="9.5" letterSpacing="2.5">
          CHLORELLA SYRUP
        </text>
        <line x1="76" y1="404" x2="164" y2="404" stroke="#9dff6a" strokeOpacity="0.35" />
        <text x="120" y="420" textAnchor="middle" fill="#ffffff" opacity="0.6" fontFamily="var(--font-body), Arial, sans-serif" fontSize="8" letterSpacing="1.5">
          BIOLOGIK FAOL QO‘SHIMCHA
        </text>
      </g>

      {/* блики стекла */}
      <path d="M44 210 C44 180 62 164 80 156" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="40" y="226" width="7" height="230" rx="3.5" fill="#ffffff" opacity="0.28" />
      <rect x="192" y="240" width="4" height="190" rx="2" fill="#ffffff" opacity="0.18" />

      {/* контур */}
      <path
        d="M92 112 C92 146 30 146 30 196 L30 476 Q30 512 66 512 L174 512 Q210 512 210 476 L210 196 C210 146 148 146 148 112 Z"
        fill="none"
        stroke="#c8ff8a"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
    </svg>
  );
}
