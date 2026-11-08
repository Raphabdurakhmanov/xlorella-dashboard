import Image from "next/image";

export function Logo() {
  return (
    <div className="logo" aria-label="Lifera Xlorella">
      <Image
        src="/brand/lifera-logo.png"
        alt="Lifera Xlorella"
        width={220}
        height={92}
        priority
        className="logo-image"
      />
    </div>
  );
}
