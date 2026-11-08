import Image from "next/image";
export function Logo() {
  return <div className="logo lifera-logo" aria-label="Lifera XLORELLA">
    <Image src="/brand/lifera-logo.jpg" alt="Lifera XLORELLA" width={260} height={164} priority />
  </div>;
}
