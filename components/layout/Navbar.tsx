"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Home",    href: "/" },
  { label: "Spaces",  href: "/spaces" },
  { label: "Academy", href: "/courses" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/contact" },
];

function isActive(href: string, pathname: string): boolean {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Navbar() {
  const pathname                      = usePathname();
  const [stuck,       setStuck]       = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock/unlock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile menu on route change (click)
  const close = () => setMobileOpen(false);

  return (
    <>
      {/* Gradient veil — darkens only the nav zone on hero pages; hides when stuck (nav has its own bg) */}
      <div className={`nav-veil${stuck ? " hidden" : ""}`} aria-hidden="true" />
      <nav className={`site-nav${stuck ? " stuck" : ""}`} id="NAV">
        {/* Logo */}
        <Link href="/" className="nlogo">
          Ontime<span>Academy</span>
        </Link>

        {/* Desktop links */}
        <ul className="nlinks">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={isActive(l.href, pathname) ? "active" : ""}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop auth links */}
        <div className="n-auth">
          <Link href="/login" className="n-login">Log In</Link>
          <Link href="/signup" className="n-signup">Sign Up</Link>
        </div>

        {/* Desktop CTA */}
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nbtn"
        >
          <span><i className="fab fa-whatsapp" /></span>
          <span>Book Now</span>
        </a>

        {/* Hamburger */}
        <button
          className={`hmb${mobileOpen ? " open" : ""}`}
          id="hmb"
          aria-label="Menu"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`mobile-nav${mobileOpen ? " open" : ""}`}>
        {navLinks.map((l) => (
          <Link key={l.href} href={l.href} onClick={close} className={isActive(l.href, pathname) ? "active" : ""}>
            {l.label}
          </Link>
        ))}
        <Link href="/login" onClick={close} className="mt-2">
          Log In
        </Link>
        <Link href="/signup" onClick={close}>
          Sign Up
        </Link>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nbtn"
          onClick={close}
        >
          <span><i className="fab fa-whatsapp" /></span>
          <span>Book Now</span>
        </a>
      </div>
    </>
  );
}
