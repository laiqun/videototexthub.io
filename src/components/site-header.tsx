"use client";

import { m } from "@/paraglide/messages.js";
import { Link } from "@/core/i18n/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSelector } from "@/components/locale-selector";
import { SiteUserMenu } from "@/components/site-user-menu";
import { useSession } from "@/core/auth/client";
import { cn } from "@/lib/utils";
import { envConfigs } from "@/config";

export interface NavLink {
  /** Optional for items with children (rendered as a dropdown). */
  href?: string;
  label: string;
  /** Open in a new tab. Off-site (http) hrefs always open in a new tab. */
  external?: boolean;
  /** Child links — renders this item as a dropdown instead of a link. */
  children?: NavLink[];
}

/** Off-site URLs render as plain <a>; internal paths use the locale-aware Link. */
const isExternalHref = (href: string) => /^https?:\/\//.test(href);

export function SiteHeader({
  navLinks,
}: {
  navLinks?: NavLink[];
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src={envConfigs.app_logo}
            alt={envConfigs.app_name}
            className="size-7"
          />
          <span className="font-serif italic text-lg">{envConfigs.app_name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks?.map((link) =>
            link.children?.length ? (
              <DropdownMenu key={link.label}>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground">
                  {link.label}
                  <ChevronDown className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="min-w-48">
                  {link.children.map((child) =>
                    isExternalHref(child.href ?? "") ? (
                      <DropdownMenuItem
                        key={child.href}
                        render={
                          <a
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        {child.label}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        key={child.href}
                        render={
                          <Link
                            href={child.href ?? "/"}
                            target={child.external ? "_blank" : undefined}
                          />
                        }
                      >
                        {child.label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isExternalHref(link.href ?? "") ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href ?? "/"}
                target={link.external ? "_blank" : undefined}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <LocaleSelector />
          <ThemeToggle />
          {user ? (
            <SiteUserMenu
              name={user.name || "User"}
              email={user.email}
              image={user.image}
            />
          ) : (
            <Link
              href="/sign-in"
              className={cn(buttonVariants(), "gap-1.5")}
            >
              {m["common.nav.sign_in"]()}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks?.map((link) =>
              link.children?.length ? (
                <div key={link.label} className="flex flex-col gap-1">
                  <span className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    {link.label}
                  </span>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href ?? "/"}
                      target={child.external ? "_blank" : undefined}
                      className="rounded-md px-3 py-2 pl-6 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : isExternalHref(link.href ?? "") ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <LocaleSelector />
            <ThemeToggle />
            <div className="flex-1" />
            {user ? (
              <SiteUserMenu
                name={user.name || "User"}
                email={user.email}
                image={user.image}
              />
            ) : (
              <Link
                href="/sign-in"
                className={cn(buttonVariants(), "gap-1.5")}
                onClick={() => setMobileOpen(false)}
              >
                {m["common.nav.sign_in"]()}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
