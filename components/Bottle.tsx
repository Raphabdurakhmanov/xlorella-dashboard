import type React from "react";
import Image from "next/image";

// Lightweight CSS-driven droplets: no JS timers, particle dependencies or canvas.
// Positions are aligned to the original photographed bottle, not a synthetic redraw.
const droplets = [
  { x: 30, y: 20, delay: "-1.8s", duration: "6.9s", travel: "145px", size: "5px" },
  { x: 73, y: 27, delay: "-4.1s", duration: "8.4s", travel: "170px", size: "4px" },
  { x: 24, y: 44, delay: "-2.7s", duration: "8.1s", travel: "125px", size: "3px" },
  { x: 78, y: 53, delay: "-6.3s", duration: "9.3s", travel: "114px", size: "4px" },
  { x: 36, y: 61, delay: "-3.4s", duration: "7.6s", travel: "106px", size: "3px" },
  { x: 69, y: 72, delay: "-5.2s", duration: "10.2s", travel: "74px", size: "3px" },
];

export function Bottle({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="bottle-backdrop" aria-hidden="true" />
      <div className="product-motion" aria-label="Lifera Xlorella — original photographed product bottle">
        <Image
          src="/brand/product-bottle-v2.png"
          alt="Lifera Xlorella — фотография оригинального напитка с живой хлореллой"
          width={520}
          height={980}
          priority
          className="bottle-image"
        />
        <div className="bottle-glint" aria-hidden="true" />
        <div className="condensation" aria-hidden="true">
          {droplets.map((drop, index) => (
            <span
              className="condensation-drop"
              key={index}
              style={{
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: drop.size,
                height: drop.size,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
                // A CSS custom property is used only for the animation distance.
                ["--drop-travel" as string]: drop.travel,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
