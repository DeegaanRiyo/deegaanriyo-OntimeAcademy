"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Sync class on #sidebar and prevent body scroll when open
  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open", isOpen);
    }
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger — visible only on mobile */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="sidebar-toggle-btn"
      >
        <span className={`hamburger ${isOpen ? "open" : ""}`}>
          <span /><span /><span />
        </span>
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
