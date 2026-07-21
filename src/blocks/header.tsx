import { SiteHeader } from "@/components/site-header";
import { m } from "@/paraglide/messages.js";

export function Header() {
  const navLinks = [
    { href: "/#features", label: m["landing.nav.features"]() },
    { href: "/#showcases", label: m["landing.nav.showcases"]() },
    { href: "/pricing", label: m["landing.nav.pricing"]() },
    { href: "/blog", label: m["landing.nav.blog"]() },
  ];

  return <SiteHeader navLinks={navLinks} />;
}
