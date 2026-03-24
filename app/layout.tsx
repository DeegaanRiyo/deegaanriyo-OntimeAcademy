import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_URL = "https://ontime.academy";
const SITE_NAME = "Ontime Academy & Co-working Space";
const SITE_DESCRIPTION =
  "Nairobi's leading learning and co-working hub. Professional meeting rooms, content studio, world-class academy courses — all in one place. Book by the hour or join as a member.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Nairobi`,
    template: `%s | Ontime Academy`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "co-working space Nairobi",
    "Nairobi co-working",
    "online courses Nairobi",
    "content studio Nairobi",
    "meeting rooms Nairobi",
    "academy courses Kenya",
    "Ontime Academy",
    "Ontime CWS",
    "professional workspace Nairobi",
    "e-learning Kenya",
  ],
  authors: [{ name: "Ontime Academy & Co-working Space", url: SITE_URL }],
  creator: "Ontime Academy",
  publisher: "Ontime Academy",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Nairobi`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ontime Academy & Co-working Space — Nairobi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Nairobi`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
    creator: "@OntimeAcademy",
    site: "@OntimeAcademy",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.ico" },
    ],
  },
  manifest: "/site.webmanifest",
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C1440E" },
    { media: "(prefers-color-scheme: dark)",  color: "#111111" },
  ],
};

// JSON-LD structured data for LLM & rich search results
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": SITE_NAME,
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/android-chrome-512x512.png`,
        "width": 512,
        "height": 512,
      },
      "description": SITE_DESCRIPTION,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nairobi",
        "addressCountry": "KE",
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "telephone": "+254746628668",
        "availableLanguage": ["English", "Swahili"],
      },
      "sameAs": [
        "https://ontimeacademy.com",
        "https://ontimeacademy.org",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": SITE_NAME,
      "description": SITE_DESCRIPTION,
      "publisher": { "@id": `${SITE_URL}/#organization` },
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/courses?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      "name": SITE_NAME,
      "description": SITE_DESCRIPTION,
      "url": SITE_URL,
      "telephone": "+254746628668",
      "priceRange": "KES",
      "currenciesAccepted": "KES",
      "paymentAccepted": "Cash, Bank Transfer, M-Pesa",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nairobi",
        "addressCountry": "KE",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "addressCountry": "KE",
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "08:00",
        "closes": "20:00",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakartaSans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* PWA — iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ontime Academy" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Preconnect to speed up font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {/* Preloader — hidden immediately on non-home pages before first paint */}
        <div id="PRE">
          <div className="pre-lines">
            <div className="pre-line" style={{ animationDelay: "0s" }} />
            <div className="pre-line" style={{ animationDelay: "0.7s" }} />
            <div className="pre-line" style={{ animationDelay: "1.4s" }} />
          </div>
          <div className="pre-logo">Ontime Academy</div>
          <div className="pre-sub">&amp; Co-working Space &middot; Nairobi</div>
          <div className="pre-bar-wrap">
            <div className="pre-fill" id="pFill" />
          </div>
          <div className="pre-pct" id="pPct">0%</div>
        </div>
        {/* Hide preloader on non-home pages before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var p=location.pathname,pre=document.getElementById('PRE');if(pre&&p!=='/')pre.style.display='none';}())` }} />

        {children}

        {/* CDN Scripts — load before animations */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
          strategy="afterInteractive"
        />
        {/* PWA Service Worker */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`,
          }}
        />
      </body>
    </html>
  );
}
