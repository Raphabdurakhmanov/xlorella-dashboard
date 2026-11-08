import Image from "next/image";

// Два варианта логотипа: белый текст для тёмной темы, тёмный — для светлой.
// Какой показать, решает CSS по data-theme (см. .logo-on-dark / .logo-on-light).
export function Logo() {
  return (
    <div className="logo" aria-label="Lifera Xlorella">
      <Image src="/brand/logo-white.png" alt="Lifera Xlorella" width={706} height={439} priority className="logo-image logo-on-dark" />
      <Image src="/brand/logo-dark.png" alt="" aria-hidden="true" width={706} height={439} priority className="logo-image logo-on-light" />
    </div>
  );
}
