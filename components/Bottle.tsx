import Image from "next/image";

export function Bottle({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="bottle-backdrop" />
      <Image
        src="/brand/product-bottle.png"
        alt="Lifera Xlorella chlorella syrup bottle"
        width={520}
        height={980}
        priority
        className="bottle-image"
      />
    </div>
  );
}
