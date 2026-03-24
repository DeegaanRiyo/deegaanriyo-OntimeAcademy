import Link from "next/link";

const col1Links = [
  { label: "Our Spaces",    href: "/spaces" },
  { label: "Content Studio",href: "/spaces#studio" },
  { label: "Pricing",       href: "/#pricing" },
  { label: "Book a Space",  href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}` },
];

const col2Links = [
  { label: "All Courses",   href: "/courses" },
  { label: "Online Courses",href: "/courses?type=online" },
  { label: "Physical Classes",href: "/courses?type=physical" },
  { label: "Hybrid Courses",href: "/courses?type=hybrid" },
];

const col3Links = [
  { label: "About Us",      href: "/about" },
  { label: "Members",       href: "/members" },
  { label: "Blog",          href: "/blog" },
  { label: "Contact",       href: "/contact" },
  { label: "FAQ",           href: "/faq" },
];

const socials = [
  { icon: "instagram",   label: "Instagram",  href: "#" },
  { icon: "facebook-f",  label: "Facebook",   href: "#" },
  { icon: "twitter",     label: "Twitter/X",  href: "#" },
  { icon: "linkedin-in", label: "LinkedIn",   href: "#" },
  { icon: "youtube",     label: "YouTube",    href: "#" },
];

export default function Footer() {
  return (
    <footer>
      <div className="ft-grid">
        {/* Brand column */}
        <div>
          <Link href="/" className="ft-logo">
            Ontime<span>Academy</span>
          </Link>
          <p className="ft-about">
            Nairobi&rsquo;s leading learning and co-working hub. Professional spaces,
            world-class courses — all in one place.
          </p>
          <div className="ft-soc mt-6">
            {socials.map((s) => (
              <a
                key={s.icon}
                href={s.href}
                aria-label={s.label}
                className="fsoc"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className={`fab fa-${s.icon}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Spaces */}
        <div>
          <div className="ft-h">Spaces</div>
          <ul className="ft-links">
            {col1Links.map((l) => (
              <li key={l.label}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Academy */}
        <div>
          <div className="ft-h">Academy</div>
          <ul className="ft-links">
            {col2Links.map((l) => (
              <li key={l.label}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="ft-h">Company</div>
          <ul className="ft-links">
            {col3Links.map((l) => (
              <li key={l.label}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="ft-bot">
        <p className="ft-copy">
          &copy; {new Date().getFullYear()} Ontime Academy &amp; Co-working Space &middot; Nairobi, Kenya &middot;{" "}
          <Link href="/privacy" className="text-[var(--teal2)]">Privacy</Link>
          {" "}&middot;{" "}
          <Link href="/terms" className="text-[var(--teal2)]">Terms</Link>
        </p>
        <p className="ft-copy text-[var(--muted)]">
          Mon–Sat &middot; 7AM–9PM &middot;{" "}
          <span className="text-[var(--teal2)]">learn, create, collaborate</span>
        </p>
      </div>
    </footer>
  );
}
