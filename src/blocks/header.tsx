import { SiteHeader, type NavLink } from "@/components/site-header";
import { m } from "@/paraglide/messages.js";

export function Header() {
  const navLinks: NavLink[] = [
    { href: "/image-to-prompt", label: m["landing.nav.image_to_prompt"]() },
    { href: "/#features", label: m["landing.nav.features"]() },
    { href: "/#showcases", label: m["landing.nav.showcases"]() },
    { href: "/pricing", label: m["landing.nav.pricing"]() },
    { href: "/blog", label: m["landing.nav.blog"]() },
    {
      label: m["landing.nav.more"](),
      children: [
        {
          href: "/extract-text-from-picture",
          label: m["landing.footer.extract_text"](),
        },
        {
          href: "/photo-description",
          label: m["landing.footer.photo_description"](),
        },
        { href: "/how-to-use", label: m["landing.footer.how_to_use"]() },
        { href: "/batch", label: m["landing.footer.batch"]() },
      ],
    },
  ];

  return <SiteHeader navLinks={navLinks} />;
}
