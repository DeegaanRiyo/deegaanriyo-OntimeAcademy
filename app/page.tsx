import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeAnimations from "@/components/public/HomeAnimations";
import SlideDots from "@/components/public/SlideDots";
import type { Space } from "@/types";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254746628668";

const FALLBACK_SPACES: Space[] = [
  { id: "1", name: "Meeting Room 1", slug: "meeting-room-1",  hourly_rate: 2000, is_available: true, photos: [], description: null, created_at: "" },
  { id: "2", name: "Board Room",     slug: "board-room",      hourly_rate: 3500, is_available: true, photos: [], description: null, created_at: "" },
  { id: "3", name: "Content Studio", slug: "content-studio",  hourly_rate: 1500, is_available: true, photos: [], description: null, created_at: "" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spaces")
    .select("id, name, slug, description, hourly_rate, is_available, photos")
    .order("created_at", { ascending: true });
  const spaces: Space[] = (data as Space[]) ?? FALLBACK_SPACES;

  return (
    <>
      <Navbar />
      <main>
        {/* ============================================================
            HERO — SLIDESHOW + 3D VIDEO CARD
        ============================================================ */}
        <section id="HERO">
          {/* Background Slideshow */}
          <div className="slides" id="slideshow">
            {[
              { src: "/ontimemedia/coworkingspace.png", alt: "Workspace" },
              { src: "/ontimemedia/herobacground.jpeg", alt: "Coworking" },
              { src: "/ontimemedia/boardroom.jpeg", alt: "Board Room" },
              { src: "/ontimemedia/podcast.png", alt: "Studio" },
              { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=85", alt: "Team" },
            ].map((s, i) => (
              <div key={i} className={`slide${i === 0 ? " active" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt} />
                <div className="slide-overlay" />
              </div>
            ))}
          </div>

          {/* Slide counter */}
          <div className="slide-counter">
            <span className="sc-cur" id="scCur">01</span>
            <span className="sc-sep" />
            <span className="sc-tot">05</span>
          </div>

          {/* Progress bar */}
          <div className="slide-prog" id="sProg" />

          {/* Vertical strip */}
          <div className="hero-strip">
            <div className="hero-strip-inner" id="heroStrip">
              {[
                "/ontimemedia/coworkingspace.png",
                "/ontimemedia/herobacground.jpeg",
                "/ontimemedia/boardroom.jpeg",
                "/ontimemedia/podcast.png",
                "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&q=70",
                "/ontimemedia/confrenceroom.jpeg",
                "/ontimemedia/coworkingspace.png",
                "/ontimemedia/herobacground.jpeg",
                "/ontimemedia/boardroom.jpeg",
                "/ontimemedia/podcast.png",
              ].map((src, i) => (
                <div key={i} className="simg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
          </div>

          {/* Hero content grid */}
          <div className="hero-content">
            {/* Left: copy */}
            <div className="hero-left">
              <div className="h-eyebrow">
                <span className="h-eyebrow-line" />
                <span className="h-eyebrow-text">Nairobi&apos;s Smartest Workspace &amp; Academy</span>
              </div>
              <h1 className="hero-h">
                <span className="word-wrap"><span className="word" style={{ animation: "wordUp 1s .6s var(--ease) both" }}>Your&nbsp;</span></span>
                <span className="word-wrap"><span className="word" style={{ animation: "wordUp 1s .75s var(--ease) both" }}>most&nbsp;</span></span>
                <br />
                <span className="word-wrap"><span className="word" style={{ animation: "wordUp 1s .9s var(--ease) both" }}>productive&nbsp;</span></span>
                <br />
                <span className="word-wrap"><span className="word" style={{ animation: "wordUp 1s 1.05s var(--ease) both" }}>day&nbsp;</span></span>
                <span className="word-wrap"><span className="word" style={{ animation: "wordUp 1s 1.2s var(--ease) both" }}><em>starts here.</em></span></span>
              </h1>
              <p className="hero-sub">
                Professional meeting rooms, board room, a full content studio &amp; world-class courses — all in the heart of Nairobi. Book by the hour, right from WhatsApp.
              </p>
              <div className="hero-btns">
                <a href={`https://wa.me/${WA}`} className="btn-primary" target="_blank" rel="noopener noreferrer">
                  <span><i className="fab fa-whatsapp" /></span><span>Book a Space</span>
                </a>
                <a href="#COURSES" className="btn-outline">
                  <i className="fas fa-graduation-cap" /> View Academy
                </a>
              </div>
              <div className="h-trust">
                <span className="h-dot" />500+ Happy Members
                <span className="h-dot" />Est. 2020
                <span className="h-dot" />Nairobi, Kenya
                <span className="h-dot" />Mon–Sat · 7AM–9PM
              </div>
            </div>

            {/* Right: 3D video card */}
            <div className="hero-video-wrap">
              <div className="video-card" id="vCard">
                <div className="vc-corner tl" /><div className="vc-corner tr" />
                <div className="vc-corner bl" /><div className="vc-corner br" />
                <div className="vc-scanlines" />
                <div className="video-label"><span className="vlive" />Live Preview — Ontime Academy & Co-working Space</div>
                <div className="video-iframe-wrap">
                  <iframe
                    src="https://www.youtube.com/embed/dI3Wp7mHIcg?autoplay=0&mute=1&loop=1&controls=1&rel=0&modestbranding=1"
                    title="Ontime Academy & Co-working Space Tour"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div className="video-info-bar">
                  <div className="vib-left">
                    <div className="vib-icon"><i className="fas fa-building" /></div>
                    <div>
                      <div className="vib-title">Ontime Co-working Space</div>
                      <div className="vib-sub">Nairobi, Kenya · Est. 2020</div>
                    </div>
                  </div>
                  <div className="vib-badge">Watch Tour</div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="vid-float-badge f1">
                <div className="vfb-n">500+</div>
                <div className="vfb-l">Happy Members</div>
              </div>
              <div className="vid-float-badge f2">
                <div className="vfb-n">98%</div>
                <div className="vfb-l">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Slide dots */}
          <SlideDots />
        </section>

        {/* ============================================================
            MARQUEE 1
        ============================================================ */}
        <div className="mq-wrap">
          <div className="mq">
            {[
              "Co-working Space", "Meeting Room 1 — KSh 2,000/hr", "Board Room — KSh 3,500/hr",
              "Podcast Studio — KSh 1,500/hr", "4K Cameras · Ring Lights · Mics",
              "Fast Fibre Internet · Air-Con", "500+ Members · 98% Satisfied", "Mon–Sat · 7AM–9PM",
              "Co-working Space", "Meeting Room 1 — KSh 2,000/hr", "Board Room — KSh 3,500/hr",
              "Podcast Studio — KSh 1,500/hr", "4K Cameras · Ring Lights · Mics",
              "Fast Fibre Internet · Air-Con", "500+ Members · 98% Satisfied", "Mon–Sat · 7AM–9PM",
            ].map((text, i) => (
              <span key={i} className="mi"><span className="mi-dot">✦</span>{text}</span>
            ))}
          </div>
        </div>

        {/* ============================================================
            STATS
        ============================================================ */}
        <section id="STATS">
          <div className="stats-row">
            {[
              { n: 500, label: "Happy Members" },
              { n: 3,   label: "Bookable Spaces" },
              { n: 12,  label: "Online Courses" },
              { n: 98,  label: "% Satisfaction" },
            ].map((s, i) => (
              <div key={i} className={`stat rv${i > 0 ? ` d${i}` : ""}`}>
                <div className="stat-glow" />
                <span className="stat-n" data-t={s.n}>0</span>
                <span className="stat-l">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            ABOUT
        ============================================================ */}
        <section id="ABOUT" className="sec">
          <div className="sec-inner about-grid">
            <div className="about-stack rl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="ai1"><img src="/ontimemedia/section2a.jpeg" alt="Ontime Interior" /></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="ai2"><img src="/ontimemedia/confrenceroom.jpeg" alt="Meeting" /></div>
              <div className="a-badge">
                <div className="ab-n">2020</div>
                <div className="ab-l">Est. Nairobi</div>
              </div>
            </div>
            <div className="rr d1">
              <div className="sec-tag">About Ontime Academy & Co-working Space</div>
              <h2 className="sec-h">A workspace that works<br /><em>as hard as you do.</em></h2>
              <p className="sec-p" style={{ marginTop: 18 }}>
                Nairobi&apos;s go-to destination for professionals, creators, and lifelong learners. Every detail — from internet speed to meeting room setup — is built for peak performance.
              </p>
              <ul className="check-list">
                {[
                  "Premium meeting rooms & board room bookable by the hour",
                  "Professional content studio — 4K cameras, podcast mics, lighting",
                  "Fast, reliable fibre internet throughout the entire space",
                  "E-learning & in-person courses from top Nairobi professionals",
                  "Simple WhatsApp booking — no forms, instant confirmation",
                ].map((item, i) => (
                  <li key={i}>
                    <div className="chk"><i className="fas fa-check" /></div>{item}
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi, I'd like to book a tour of Ontime Academy & Co-working Space")}`}
                className="btn-primary" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex" }}
              >
                <span><i className="fab fa-whatsapp" /></span><span>Book a Tour</span>
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            SPACES — live from Supabase
        ============================================================ */}
        <section id="SPACES" className="sec">
          <div className="sec-inner">
            <div className="rv" style={{ textAlign: "center" }}>
              <div className="sec-tag" style={{ justifyContent: "center" }}>Our Rental Spaces</div>
              <h2 className="sec-h">Three spaces. <em>Endless possibilities.</em></h2>
              <p className="sec-p" style={{ marginTop: 14, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}>
                Fully equipped, air-conditioned, ready to go. Book by the hour, any day of the week.
              </p>
            </div>
            <div className="spaces-grid">
              {spaces.slice(0, 3).map((space, i) => {
                const configs = [
                  {
                    badge: "Meeting Room", badgeBg: "var(--teal)", priceColor: "var(--teal2)",
                    borderColor: "rgba(15,179,187,.2)", pillClass: "tl",
                    img: "/ontimemedia/confrenceroom.jpeg",
                    pills: ["Up to 8 people", "Smart TV", "Wi-Fi", "Whiteboard", "Air-Con"],
                    waText: `I'd like to book ${space.name}`,
                  },
                  {
                    badge: "Board Room", badgeBg: "var(--gold)", priceColor: "var(--gold2)",
                    borderColor: "rgba(201,146,26,.25)", pillClass: "gd",
                    img: "/ontimemedia/boardroom.jpeg",
                    pills: ["Up to 14 people", "Dual Displays", "Video Conf.", "Executive Setup"],
                    waText: `I'd like to book ${space.name}`,
                  },
                  {
                    badge: "Content Studio", badgeBg: "#7c3aed", priceColor: "#a78bfa",
                    borderColor: "rgba(124,58,237,.25)", pillClass: "pu",
                    img: "/ontimemedia/podcast.png",
                    pills: ["4K Cameras", "Ring Lights", "Podcast Mic", "Green Screen"],
                    waText: `I'd like to book ${space.name}`,
                  },
                ];
                const cfg = configs[i] ?? configs[0];
                return (
                  <div key={space.id} className={`sp-card rv d${i + 1}`}>
                    <div className="sp-img">
                      <span className="sp-badge" style={{ background: cfg.badgeBg }}>{cfg.badge}</span>
                      <div className="sp-price-float" style={{ borderColor: cfg.borderColor }}>
                        <div className="spf-n" style={{ color: cfg.priceColor }}>
                          KSh {space.hourly_rate.toLocaleString()}
                        </div>
                        <div className="spf-l">/hr</div>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={space.photos?.[0] ?? cfg.img} alt={space.name} loading="lazy" />
                    </div>
                    <div className="sp-body">
                      <h3>{space.name}</h3>
                      <p>{space.description ?? "Fully equipped, air-conditioned, and ready to go."}</p>
                      <div className="pills">
                        {cfg.pills.map((p) => (
                          <span key={p} className={`pill ${cfg.pillClass}`}>{p}</span>
                        ))}
                      </div>
                      <a
                        href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hi, ${cfg.waText}`)}`}
                        className="btn-book" target="_blank" rel="noopener noreferrer"
                        style={{ borderColor: cfg.borderColor, color: cfg.priceColor }}
                      >
                        <span><i className="fab fa-whatsapp" /></span><span>Book this Space</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================
            STUDIO DEEP-DIVE
        ============================================================ */}
        <section id="STUDIO" className="sec">
          <div className="sec-inner studio-grid">
            <div className="rl">
              <div style={{ position: "relative" }}>
                <div className="studio-main-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ontimemedia/podcast.png" alt="Studio" loading="lazy" />
                </div>
                <div className="studio-float-tag">Podcast Ready</div>
              </div>
              <div className="studio-mini-grid">
                <div className="studio-mini rs d1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80" alt="Mic" loading="lazy" />
                </div>
                <div className="studio-mini rs d2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" alt="Camera" loading="lazy" />
                </div>
              </div>
            </div>
            <div className="rr d1">
              <div className="sec-tag">Content Studio Deep-Dive</div>
              <h2 className="sec-h">Record. Create.<br /><em>Go Viral.</em></h2>
              <p className="sec-p" style={{ marginTop: 18, marginBottom: 0 }}>
                Walk in, press record. Our professional studio is fully set up for podcasts, YouTube, social content, and brand shoots at only KSh 1,500/hr.
              </p>
              <div className="eq-grid">
                {[
                  { icon: "fa-video",            n: "4K Cameras",          d: "Sony / Canon setup" },
                  { icon: "fa-microphone-alt",    n: "Podcast Microphones", d: "Studio condenser mics" },
                  { icon: "fa-lightbulb",         n: "Ring Lights & Panels",d: "Professional LED lighting" },
                  { icon: "fa-expand-arrows-alt", n: "Green Screen",        d: "Full backdrop options" },
                  { icon: "fa-headphones-alt",    n: "Audio Monitoring",    d: "Zero-latency headphones" },
                  { icon: "fa-wifi",              n: "100 Mbps Fibre",      d: "Live streaming ready" },
                ].map((eq, i) => (
                  <div key={i} className={`eq rv d${i + 1}`}>
                    <i className={`fas ${eq.icon}`} />
                    <div><div className="eq-n">{eq.n}</div><div className="eq-d">{eq.d}</div></div>
                  </div>
                ))}
              </div>
              <a
                href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi, I'd like to book the Content Studio")}`}
                className="btn-primary" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", marginTop: 10 }}
              >
                <span>Book Studio — KSh 1,500/hr</span><span><i className="fas fa-arrow-right" /></span>
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            HORIZONTAL SCROLL GALLERY
        ============================================================ */}
        <div className="hscroll-wrap">
          <div className="hscroll">
            {[
              { src: "/ontimemedia/coworkingspace.png", lbl: "Co-Working" },
              { src: "/ontimemedia/confrenceroom.jpeg", lbl: "Meeting Room 1" },
              { src: "/ontimemedia/boardroom.jpeg", lbl: "Board Room" },
              { src: "/ontimemedia/podcast.png", lbl: "Content Studio" },
              { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80", lbl: "Academy Classes" },
              { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80", lbl: "Team Sessions" },
              { src: "/ontimemedia/confrence.jpeg", lbl: "Events" },
              { src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80", lbl: "Networking" },
              /* duplicate for seamless loop */
              { src: "/ontimemedia/coworkingspace.png", lbl: "Co-Working" },
              { src: "/ontimemedia/confrenceroom.jpeg", lbl: "Meeting Room 1" },
              { src: "/ontimemedia/boardroom.jpeg", lbl: "Board Room" },
              { src: "/ontimemedia/podcast.png", lbl: "Content Studio" },
              { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80", lbl: "Academy Classes" },
              { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80", lbl: "Team Sessions" },
              { src: "/ontimemedia/confrence.jpeg", lbl: "Events" },
              { src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80", lbl: "Networking" },
            ].map((item, i) => (
              <div key={i} className="hsc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.lbl} loading="lazy" />
                <div className="hsc-lbl">{item.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================
            GLOBE
        ============================================================ */}
        <section id="GLOBE">
          <div className="globe-content">
            <div className="rv">
              <div className="sec-tag">Global Impact, Local Roots</div>
              <h2 className="sec-h">Nairobi&apos;s <em>premier</em><br />workspace hub.</h2>
              <p className="sec-p" style={{ marginTop: 18, maxWidth: 600 }}>
                Serving 500+ members across Nairobi and connecting professionals, creators and entrepreneurs. Our doors are open every day of the week.
              </p>
              <ul className="check-list" style={{ marginTop: 24 }}>
                {["3 premium bookable spaces", "12+ professional courses", "Mon–Sat · 7AM–9PM"].map((item, i) => (
                  <li key={i}><div className="chk"><i className="fas fa-check" /></div>{item}</li>
                ))}
              </ul>
            </div>
            <canvas id="globeCanvas" />
          </div>
        </section>

        {/* ============================================================
            COURSES — tabbed
        ============================================================ */}
        <section id="COURSES" className="sec">
          <div className="sec-inner">
            <div className="rv" style={{ textAlign: "center" }}>
              <div className="sec-tag" style={{ justifyContent: "center" }}>Ontime Academy</div>
              <h2 className="sec-h">Learn. Grow. <em>Dominate.</em></h2>
              <p className="sec-p" style={{ marginTop: 14, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}>
                Premium online and in-person courses by Nairobi&apos;s top professionals. Study at your pace or join us in class.
              </p>
            </div>
            <div className="ctabs rv d1">
              <button className="ctab on" data-panel="online">E-Courses (Online)</button>
              <button className="ctab" data-panel="physical">Physical (In-Person)</button>
              <button className="ctab" data-panel="hybrid">Hybrid Courses</button>
            </div>

            {/* ONLINE */}
            <div className="cpanel on" id="panel-online">
              {[
                { icon: "fa-chart-line", type: "Business · Online",  title: "Digital Marketing Masterclass",     desc: "Master SEO, paid ads, social media strategy and analytics — designed for the Kenyan and East African digital market.", meta: [{ icon: "fa-clock", t: "8 Weeks" }, { icon: "fa-laptop", t: "Self-paced" }, { icon: "fa-certificate", t: "Certificate" }], badges: [{cls:"on",t:"Online"},{cls:"gr",t:"8 Weeks"}], waText: "Hi, enroll Digital Marketing" },
                { icon: "fa-coins",      type: "Finance · Online",    title: "Financial Literacy & Investment",   desc: "Build real wealth — savings, SACCOs, stocks, and Nairobi's property market explained clearly and practically.", meta: [{ icon: "fa-clock", t: "4 Weeks" }, { icon: "fa-laptop", t: "Self-paced" }, { icon: "fa-certificate", t: "Certificate" }], badges: [{cls:"on",t:"Online"},{cls:"gr",t:"4 Weeks"}], waText: "Hi, enroll Financial Literacy" },
              ].map((c, i) => <CourseCard key={i} {...c} delay={i + 1} WA={WA} />)}
            </div>

            {/* PHYSICAL */}
            <div className="cpanel" id="panel-physical" style={{ display: "none" }}>
              {[
                { icon: "fa-rocket",  type: "Entrepreneurship · Physical", title: "Entrepreneurship Bootcamp",               desc: "From idea to launch — validate your business model, build your team, and attract your first customers. Intensive in-person bootcamp.", physical: true, meta: [{ icon: "fa-clock", t: "10 Weeks" }, { icon: "fa-users", t: "Small Groups" }, { icon: "fa-certificate", t: "Certificate" }], badges: [{cls:"pp",t:"In-Person"},{cls:"gr",t:"10 Weeks"}], waText: "Hi, enroll Entrepreneurship Bootcamp" },
                { icon: "fa-podcast", type: "Content Creation · Physical", title: "Podcasting & Video Production Masterclass", desc: "Hands-on training using our professional Content Studio. Camera work, audio production, editing, audience growth.", physical: true, meta: [{ icon: "fa-clock", t: "6 Weeks" }, { icon: "fa-video", t: "Studio-based" }, { icon: "fa-certificate", t: "Certificate" }], badges: [{cls:"pp",t:"In-Person"},{cls:"gr",t:"6 Weeks"}], waText: "Hi, enroll Podcasting Video" },
              ].map((c, i) => <CourseCard key={i} {...c} delay={i + 1} WA={WA} />)}
            </div>

            {/* HYBRID */}
            <div className="cpanel" id="panel-hybrid" style={{ display: "none" }}>
              {[
                { icon: "fa-video",    type: "Content · Hybrid",    title: "Content Creation & Video Production", desc: "Script, shoot, edit and grow — combines online theory with in-studio practice at Ontime Academy.", meta: [{ icon: "fa-clock", t: "6 Weeks" }, { icon: "fa-laptop", t: "Online + Studio" }, { icon: "fa-certificate", t: "Certificate" }], badges: [{cls:"on",t:"Online"},{cls:"pp",t:"In-Person"},{cls:"gr",t:"6 Weeks"}], waText: "Hi, enroll Content Creation" },
                { icon: "fa-bullhorn", type: "Marketing · Hybrid",  title: "Social Media & Brand Building",       desc: "Build a powerful brand on Instagram, TikTok, LinkedIn and Twitter. Online modules with monthly in-person workshops.", meta: [{ icon: "fa-clock", t: "8 Weeks" }, { icon: "fa-laptop", t: "Online + Workshop" }, { icon: "fa-certificate", t: "Certificate" }], badges: [{cls:"on",t:"Online"},{cls:"pp",t:"Workshop"},{cls:"gr",t:"8 Weeks"}], waText: "Hi, enroll Social Media Brand Building" },
              ].map((c, i) => <CourseCard key={i} {...c} delay={i + 1} WA={WA} />)}
            </div>
          </div>
        </section>

        {/* ============================================================
            BOOKING STEPS
        ============================================================ */}
        <section id="STEPS" className="sec" style={{ paddingTop: 0 }}>
          <div className="sec-inner">
            <div className="rv" style={{ textAlign: "center" }}>
              <div className="sec-tag" style={{ justifyContent: "center" }}>How to Book</div>
              <h2 className="sec-h">Book in <em>4 simple steps.</em></h2>
            </div>
            <div className="steps-grid">
              {[
                { n: "01", num: 1, title: "Choose Your Space",   desc: "Meeting Room 1, Board Room, or Content Studio." },
                { n: "02", num: 2, title: "Select Date & Time",  desc: "Pick when you need it. We're open Mon–Sat · 7AM–9PM." },
                { n: "03", num: 3, title: "Send a WhatsApp",     desc: "Message 0746 628 668 — instant confirmation." },
                { n: "04", num: 4, title: "Walk In Ready",       desc: "Show up and your space is fully set up and waiting." },
              ].map((s, i) => (
                <div key={i} className={`step rv d${i + 1}`}>
                  <div className="step-top-bar" />
                  <div className="step-num">{s.n}</div>
                  <div className="step-circle">{s.num}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 48 }} className="rv d5">
              <a href={`https://wa.me/${WA}`} className="btn-primary" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex" }}>
                <span><i className="fab fa-whatsapp" /></span><span>Book Now on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            CALCULATOR
        ============================================================ */}
        <section id="pricing" className="sec">
          <div className="sec-inner" style={{ maxWidth: 960 }}>
            <div className="rv" style={{ textAlign: "center" }}>
              <div className="sec-tag" style={{ justifyContent: "center" }}>Pricing Calculator</div>
              <h2 className="sec-h">Calculate your <em>cost instantly.</em></h2>
              <p className="sec-p" style={{ marginTop: 14 }}>Pick a space, move the slider — see exactly what you&apos;ll pay. No surprises.</p>
            </div>
            <div className="calc-box rv d1">
              <span style={{ fontSize: ".58rem", letterSpacing: ".32em", textTransform: "uppercase", color: "var(--teal2)", display: "block", marginBottom: 14 }}>Select Space</span>
              <div className="calc-spaces">
                <div className="copt sel" data-name="Meeting Room 1" data-rate="2000">
                  <span className="copt-ic"><i className="fas fa-door-open" /></span>
                  <span className="copt-n">Meeting Room 1</span>
                  <span className="copt-r">KSh 2,000/hr</span>
                </div>
                <div className="copt" data-name="Board Room" data-rate="3500">
                  <span className="copt-ic"><i className="fas fa-chalkboard" /></span>
                  <span className="copt-n">Board Room</span>
                  <span className="copt-r">KSh 3,500/hr</span>
                </div>
                <div className="copt" data-name="Content Studio" data-rate="1500">
                  <span className="copt-ic"><i className="fas fa-video" /></span>
                  <span className="copt-n">Content Studio</span>
                  <span className="copt-r">KSh 1,500/hr</span>
                </div>
              </div>
              <div className="sl-wrap">
                <div className="sl-top">
                  <span>Duration</span>
                  <span className="sl-hr" id="slHr">1 hour</span>
                </div>
                <input type="range" min={1} max={8} defaultValue={1} id="slRange" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: ".65rem", color: "var(--muted)" }}>1 hr</span>
                  <span style={{ fontSize: ".65rem", color: "var(--muted)" }}>8 hrs</span>
                </div>
              </div>
              <div className="calc-result">
                <div>
                  <div className="calc-bdown" id="cBd"><strong>1 hour</strong> × <strong>KSh 2,000</strong> (Meeting Room 1)</div>
                </div>
                <div className="calc-total">
                  <span className="calc-lbl">Total&nbsp;</span>
                  <div className="calc-price" id="cPrice">KSh 2,000</div>
                </div>
                <a href="#" className="btn-wa" id="cWaBtn" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp" /> Book for KSh 2,000
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            MARQUEE 2 — Academy courses
        ============================================================ */}
        <div className="mq-wrap" style={{ background: "rgba(201,146,26,.02)" }}>
          <div className="mq rev">
            {[
              "Digital Marketing — 8 Weeks Online", "Financial Literacy — 4 Weeks Online",
              "Entrepreneurship Bootcamp — 10 Weeks In-Person", "Content Creation — 6 Weeks Hybrid",
              "Podcasting & Video Production — 6 Weeks In-Studio", "Social Media & Brand Building — 8 Weeks",
              "Digital Marketing — 8 Weeks Online", "Financial Literacy — 4 Weeks Online",
              "Entrepreneurship Bootcamp — 10 Weeks In-Person", "Content Creation — 6 Weeks Hybrid",
              "Podcasting & Video Production — 6 Weeks In-Studio", "Social Media & Brand Building — 8 Weeks",
            ].map((text, i) => (
              <span key={i} className="mi">
                <span className="mi-dot" style={{ color: "var(--gold2)" }}>◆</span>{text}
              </span>
            ))}
          </div>
        </div>

        {/* ============================================================
            TESTIMONIALS
        ============================================================ */}
        <section id="TESTI" className="sec">
          <div className="sec-inner">
            <div className="rv" style={{ textAlign: "center", marginBottom: 0 }}>
              <div className="sec-tag" style={{ justifyContent: "center" }}>Member Stories</div>
              <h2 className="sec-h">What our members <em>are saying.</em></h2>
            </div>
            <div className="testi-grid">
              {[
                { q: "Ontime Academy completely changed how I work. The meeting rooms are spotless, internet is blazing fast, and booking takes 30 seconds on WhatsApp.", name: "Brian Odhiambo", role: "Founder · Savvy Digital Agency", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" },
                { q: "I recorded my entire podcast series in the Content Studio. Professional-grade ring lights, quality mics, green screen. Worth every shilling.", name: "Amina Wanjiru", role: "Podcast Host · The Growth Show", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&q=80" },
                { q: "I enrolled in the Digital Marketing Masterclass and landed three new clients in the first month. The quality of teaching is exceptional.", name: "David Kiprotich", role: "Freelance Marketer, Nairobi", initials: "DK" },
              ].map((t, i) => (
                <div key={i} className={`tcard rv d${i + 1}`}>
                  <div className="tbar" />
                  <div className="tstars">{[1,2,3,4,5].map((s) => <span key={s} className="ts">★</span>)}</div>
                  <p className="tq">&ldquo;{t.q}&rdquo;</p>
                  <div className="tauthor">
                    {t.img
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img className="tav" src={t.img} alt={t.name} />
                      : <div className="tav-pl">{t.initials}</div>
                    }
                    <div><div className="tan">{t.name}</div><div className="tar">{t.role}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            CTA
        ============================================================ */}
        <section id="CTA">
          <div className="cta-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ontimemedia/herobacground.jpeg" alt="CTA background" />
          </div>
          <div className="cta-inner">
            <div className="sec-tag rv" style={{ justifyContent: "center" }}>Let&apos;s get started</div>
            <h2 className="cta-h rv d1">Let&apos;s get you<br /><em>working.</em></h2>
            <p className="cta-sub rv d2">Book a space, enroll in a course, or come see us. We&apos;re here and ready when you are.</p>
            <div className="cta-btns rv d3">
              <a href={`https://wa.me/${WA}`} className="btn-primary" target="_blank" rel="noopener noreferrer">
                <span><i className="fab fa-whatsapp" /></span><span>Chat on WhatsApp</span>
              </a>
              <a href="tel:+254746628668" className="btn-outline">
                <i className="fas fa-phone" /> Call 0746 628 668
              </a>
            </div>
            <div className="cta-info rv d4">
              <div className="ci"><i className="fas fa-phone" /><span>0746 628 668</span></div>
              <div className="ci"><i className="fas fa-globe" /><span>OntimeCWS.co.ke</span></div>
              <div className="ci"><i className="fas fa-map-marker-alt" /><span>Nairobi, Kenya</span></div>
              <div className="ci"><i className="fas fa-clock" /><span>Mon–Sat · 7AM–9PM</span></div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* All animations — client component */}
      <HomeAnimations />
    </>
  );
}

/* ── Reusable Course Card ─────────────────────────────────── */
function CourseCard({
  icon, type, title, desc, physical, meta, badges, waText, delay, WA,
}: {
  icon: string; type: string; title: string; desc: string;
  physical?: boolean;
  meta: { icon: string; t: string }[];
  badges: { cls: string; t: string }[];
  waText: string; delay: number; WA: string;
}) {
  return (
    <div className={`crs rv d${delay}`}>
      <div className="crs-top-bar" />
      {physical && (
        <div className="phys-notice">
          <i className="fas fa-map-marker-alt" />In-Person · Ontime Academy, Nairobi · Mon–Sat 7AM–9PM
        </div>
      )}
      <div className="crs-icon"><i className={`fas ${icon}`} /></div>
      <div className="crs-type">{type}</div>
      <h3 className="crs-h">{title}</h3>
      <p className="crs-p">{desc}</p>
      <div className="crs-meta">
        {meta.map((m, i) => (
          <span key={i} className="cm"><i className={`fas ${m.icon}`} /> {m.t}</span>
        ))}
      </div>
      <div className="crs-foot">
        <div className="cbadges">
          {badges.map((b, i) => <span key={i} className={`cb ${b.cls}`}>{b.t}</span>)}
        </div>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent(waText)}`} className="crs-enroll" target="_blank" rel="noopener noreferrer">
          Enroll <i className="fas fa-arrow-right" />
        </a>
      </div>
    </div>
  );
}
