// Стеклянные пузыри на фоне. Позиции заданы вручную.
const bubbles = [
  { size: 260, top: "8%", left: "-6%", delay: "0s" },
  { size: 120, top: "62%", left: "6%", delay: "-3s" },
  { size: 340, top: "48%", left: "52%", delay: "-6s" },
  { size: 90, top: "14%", left: "58%", delay: "-1s" },
  { size: 180, top: "-6%", left: "80%", delay: "-4s" },
  { size: 70, top: "80%", left: "40%", delay: "-2s" },
  { size: 140, top: "78%", left: "86%", delay: "-5s" },
];

export function Bubbles() {
  return (
    <div className="bubbles" aria-hidden="true">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  );
}
