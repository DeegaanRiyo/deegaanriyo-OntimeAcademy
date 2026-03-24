"use client";

import { useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const gsap: any;
declare const ScrollTrigger: any;
declare const THREE: any;

export default function HomeAnimations() {
  useEffect(() => {
    /* ── PRELOADER ─────────────────────────────────────────── */
    let pv = 0;
    const pFill = document.getElementById("pFill");
    const pPct = document.getElementById("pPct");
    const PRE = document.getElementById("PRE");
    if (pFill && pPct && PRE) {
      const pInt = setInterval(() => {
        pv += Math.random() * 9 + 3;
        if (pv >= 100) {
          pv = 100;
          clearInterval(pInt);
          setTimeout(() => PRE.classList.add("out"), 400);
        }
        pFill.style.width = pv + "%";
        pPct.textContent = Math.floor(pv) + "%";
      }, 60);
    }

    /* ── HERO SLIDESHOW ───────────────────────────────────── */
    const slides = document.querySelectorAll<HTMLElement>(".slide");
    const dots = document.querySelectorAll<HTMLElement>(".sdot");
    const prog = document.getElementById("sProg");
    const scCur = document.getElementById("scCur");
    let sIdx = 0, sProgress = 0;
    let sPInt: ReturnType<typeof setInterval> | null = null;

    function goSlide(n: number) {
      slides[sIdx].classList.remove("active");
      dots[sIdx].classList.remove("on");
      sIdx = n;
      slides[sIdx].classList.add("active");
      dots[sIdx].classList.add("on");
      if (scCur) scCur.textContent = String(sIdx + 1).padStart(2, "0");
      resetProg();
    }
    function resetProg() {
      if (sPInt) clearInterval(sPInt);
      sProgress = 0;
      if (prog) { prog.style.transition = "none"; prog.style.width = "0%"; }
      sPInt = setInterval(() => {
        sProgress += 100 / (55 * 20);
        if (sProgress >= 100) {
          sProgress = 0;
          goSlide((sIdx + 1) % slides.length);
        } else {
          if (prog) prog.style.width = sProgress + "%";
        }
      }, 50);
    }
    if (slides.length > 0) resetProg();

    // expose goSlide for dot onclick
    (window as any).goSlide = goSlide;

    /* ── SCROLL REVEAL (IntersectionObserver) ─────────────── */
    const rvObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("on"); rvObs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".rv,.rl,.rr,.rs").forEach((el) => rvObs.observe(el));

    /* ── ANIMATED COUNTERS ────────────────────────────────── */
    function runCounter(el: HTMLElement, target: number) {
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1800, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(ease * target) + (target >= 98 ? "%" : "+");
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + (target >= 98 ? "%" : "+");
      };
      requestAnimationFrame(step);
    }
    const cntObs = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.querySelectorAll<HTMLElement>("[data-t]").forEach((n) => {
            runCounter(n, +(n.dataset.t ?? 0));
          });
          cntObs.unobserve(e.target);
        }
      }),
      { threshold: 0.3 }
    );
    const statsEl = document.getElementById("STATS");
    if (statsEl) cntObs.observe(statsEl);

    /* ── HERO PARALLAX ────────────────────────────────────── */
    const onScroll = () => {
      const sy = window.scrollY;
      if (sy < window.innerHeight) {
        const hl = document.querySelector<HTMLElement>(".hero-left");
        if (hl) { hl.style.transform = `translateY(${sy * 0.18}px)`; hl.style.opacity = String(Math.max(0, 1 - sy / 750)); }
        document.querySelectorAll<HTMLElement>(".slide.active img").forEach((img) => {
          img.style.transform = `translateY(${sy * 0.22}px) scale(1.08)`;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ── VIDEO CARD 3D TILT ────────────────────────────────── */
    const vCard = document.getElementById("vCard");
    if (vCard) {
      const vWrap = vCard.closest(".hero-video-wrap") as HTMLElement | null;
      vWrap?.addEventListener("mousemove", (e: MouseEvent) => {
        const r = vCard.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        vCard.style.transform = `perspective(900px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg) scale(1.02)`;
      });
      vWrap?.addEventListener("mouseleave", () => {
        vCard.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)";
      });
    }

    /* ── 3D CARD TILT ─────────────────────────────────────── */
    document.querySelectorAll<HTMLElement>(".sp-card,.tcard,.crs,.eq,.step").forEach((c) => {
      c.addEventListener("mousemove", (e: MouseEvent) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `translateY(-6px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
        c.style.transition = "transform .1s";
      });
      c.addEventListener("mouseleave", () => {
        c.style.transform = "";
        c.style.transition = "transform .7s var(--ease)";
      });
    });

    /* ── MAGNETIC BUTTONS ─────────────────────────────────── */
    document.querySelectorAll<HTMLElement>(
      ".btn-primary,.btn-outline,.nbtn,.btn-book,.btn-wa,.crs-enroll,.fsoc"
    ).forEach((b) => {
      b.addEventListener("mousemove", (e: MouseEvent) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.16}px,${(e.clientY - r.top - r.height / 2) * 0.2}px) translateY(-3px)`;
      });
      b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });

    /* ── FLOATING PARTICLES ───────────────────────────────── */
    const colors = ["rgba(15,179,187,", "rgba(201,146,26,", "rgba(244,250,250,"];
    let particleTimeout: ReturnType<typeof setTimeout>;
    function spawnParticle() {
      const p = document.createElement("div");
      p.className = "fp";
      const sz = Math.random() * 4 + 1;
      const dur = Math.random() * 18 + 8;
      const del = Math.random() * 4;
      const c = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `left:${Math.random() * 100}vw;bottom:-20px;width:${sz}px;height:${sz}px;background:${c}${Math.random() * 0.4 + 0.1});animation-duration:${dur}s;animation-delay:${del}s;--fx:${(Math.random() - 0.5) * 180}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), (dur + del) * 1000);
      particleTimeout = setTimeout(spawnParticle, 700);
    }
    spawnParticle();

    /* ── SCROLL PROGRESS BAR ──────────────────────────────── */
    const scrollBar = document.createElement("div");
    scrollBar.id = "scrollProgressBar";
    scrollBar.style.cssText = "position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--teal2),var(--gold2));z-index:9001;pointer-events:none;width:0;transition:width .1s";
    document.body.appendChild(scrollBar);
    const onScrollProgress = () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      scrollBar.style.width = pct + "%";
    };
    window.addEventListener("scroll", onScrollProgress, { passive: true });

    /* ── GSAP + SCROLLTRIGGER ANIMATIONS ──────────────────── */
    const tryGsap = () => {
      if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        setTimeout(tryGsap, 200);
        return;
      }
      gsap.registerPlugin(ScrollTrigger);

      /* Parallax on section images */
      gsap.utils.toArray(".ai1 img,.studio-main-img img").forEach((img: HTMLElement) => {
        gsap.to(img, {
          yPercent: -12, ease: "none",
          scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: 1.5 },
        });
      });

      /* Counter scale-bounce */
      gsap.utils.toArray(".stat-n").forEach((el: HTMLElement) => {
        ScrollTrigger.create({
          trigger: el, start: "top 80%",
          onEnter: () => gsap.fromTo(el, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.7)" }),
        });
      });

      /* Step numbers */
      gsap.utils.toArray(".step-num").forEach((n: HTMLElement) => {
        gsap.fromTo(n, { opacity: 0, scale: 0.4 }, {
          opacity: 1, scale: 1, duration: 1.2, ease: "expo.out",
          scrollTrigger: { trigger: n, start: "top 85%" },
        });
      });

      /* Image clip reveal */
      gsap.utils.toArray(".about-stack .ai1,.studio-main-img").forEach((el: HTMLElement) => {
        gsap.fromTo(el,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power3.inOut",
            scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none none" } }
        );
      });
    };
    tryGsap();

    /* ── THREE.JS GLOBE ───────────────────────────────────── */
    const tryGlobe = () => {
      if (typeof THREE === "undefined") { setTimeout(tryGlobe, 200); return; }
      const canvas = document.getElementById("globeCanvas") as HTMLCanvasElement | null;
      if (!canvas) return;
      const W = 480, H = 480;
      canvas.width = W; canvas.height = H;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.set(0, 0, 2.8);

      const geo = new THREE.SphereGeometry(1, 64, 64);
      const mat = new THREE.MeshPhongMaterial({ color: 0x0a7c82, emissive: 0x031617, specular: 0x0fb3bb, shininess: 18, transparent: true, opacity: 0.92 });
      const globe = new THREE.Mesh(geo, mat);
      scene.add(globe);

      const wmat = new THREE.MeshBasicMaterial({ color: 0x0fb3bb, wireframe: true, transparent: true, opacity: 0.12 });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.015, 28, 28), wmat));

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(1.12, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x0fb3bb, transparent: true, opacity: 0.06, side: THREE.BackSide })
      );
      scene.add(halo);

      scene.add(new THREE.AmbientLight(0xffffff, 0.3));
      const dLight = new THREE.DirectionalLight(0x0fb3bb, 1.2);
      dLight.position.set(2, 2, 2); scene.add(dLight);
      const dLight2 = new THREE.DirectionalLight(0xf0b832, 0.5);
      dLight2.position.set(-2, -1, 1); scene.add(dLight2);

      const cities = [
        { la: -1.28, lo: 36.82 }, { la: 51.5, lo: -0.1 }, { la: 40.71, lo: -74 },
        { la: 35.68, lo: 139.7 }, { la: -33.86, lo: 151 }, { la: 48.85, lo: 2.35 },
        { la: -26, lo: 28 }, { la: 1.3, lo: 103.8 },
      ];
      cities.forEach((c) => {
        const phi = (90 - c.la) * Math.PI / 180, theta = (c.lo + 180) * Math.PI / 180;
        const x = -Math.sin(phi) * Math.cos(theta), y = Math.cos(phi), z = Math.sin(phi) * Math.sin(theta);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf0b832 }));
        dot.position.set(x, y, z); scene.add(dot);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 24), new THREE.MeshBasicMaterial({ color: 0xf0b832, transparent: true, opacity: 0.5 }));
        ring.position.set(x, y, z); ring.lookAt(0, 0, 0); scene.add(ring);
      });

      function latlng(la: number, lo: number) {
        const phi = (90 - la) * Math.PI / 180, theta = (lo + 180) * Math.PI / 180;
        return { x: -Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) };
      }
      function makeArc(from: any, to: any, col: number) {
        const p1 = new THREE.Vector3(from.x, from.y, from.z);
        const p2 = new THREE.Vector3(to.x, to.y, to.z);
        const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(1.5);
        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
        scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.55 })));
      }
      makeArc(latlng(-1.28, 36.82), latlng(51.5, -0.1), 0x0fb3bb);
      makeArc(latlng(-1.28, 36.82), latlng(40.71, -74), 0xf0b832);
      makeArc(latlng(-1.28, 36.82), latlng(35.68, 139.7), 0x0fb3bb);
      makeArc(latlng(-1.28, 36.82), latlng(-33.86, 151), 0xf0b832);

      let mouseX = 0, mouseY = 0;
      const onGlobeMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
      };
      document.addEventListener("mousemove", onGlobeMouseMove);

      let t = 0;
      const animGlobe = () => {
        requestAnimationFrame(animGlobe);
        t += 0.005;
        globe.rotation.y += 0.003;
        globe.rotation.x += (mouseY * 0.4 - globe.rotation.x) * 0.04;
        globe.rotation.y += (mouseX * 0.4 - globe.rotation.y) * 0.04;
        dLight.position.x = Math.sin(t) * 3;
        dLight.position.z = Math.cos(t) * 3;
        halo.rotation.y = -globe.rotation.y * 0.5;
        renderer.render(scene, camera);
      };
      animGlobe();
    };
    tryGlobe();

    /* ── CALCULATOR ───────────────────────────────────────── */
    let cRate = 2000, cSpace = "Meeting Room 1";
    const calcUp = () => {
      const slRange = document.getElementById("slRange") as HTMLInputElement | null;
      if (!slRange) return;
      const h = +slRange.value;
      const tot = cRate * h;
      const hl = h + " hour" + (h > 1 ? "s" : "");
      const slHr = document.getElementById("slHr");
      const cBd = document.getElementById("cBd");
      const cPrice = document.getElementById("cPrice");
      const cWaBtn = document.getElementById("cWaBtn") as HTMLAnchorElement | null;
      if (slHr) slHr.textContent = hl;
      if (cBd) cBd.innerHTML = `<strong>${hl}</strong> × <strong>KSh ${cRate.toLocaleString()}</strong> (${cSpace})`;
      if (cPrice) {
        cPrice.textContent = "KSh " + tot.toLocaleString();
        cPrice.style.transform = "scale(1.12)";
        setTimeout(() => { if (cPrice) cPrice.style.transform = "scale(1)"; }, 200);
      }
      if (cWaBtn) {
        cWaBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Book for KSh ${tot.toLocaleString()}`;
        cWaBtn.href = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254746628668"}?text=${encodeURIComponent(`Hi, I'd like to book ${cSpace} for ${hl} at Ontime Academy & Co-working Space. Total: KSh ${tot.toLocaleString()}`)}`;
        cWaBtn.style.transform = "scale(1.04)";
        setTimeout(() => { if (cWaBtn) cWaBtn.style.transform = ""; }, 200);
      }
    };
    const cSel = (el: HTMLElement, n: string, r: number) => {
      document.querySelectorAll<HTMLElement>(".copt").forEach((o) => o.classList.remove("sel"));
      el.classList.add("sel");
      cRate = r; cSpace = n;
      calcUp();
    };
    (window as any).cSel = cSel;
    (window as any).calcUp = calcUp;
    document.getElementById("slRange")?.addEventListener("input", calcUp);
    document.querySelectorAll<HTMLElement>(".copt").forEach((el) => {
      el.addEventListener("click", () => {
        const n = el.querySelector(".copt-n")?.textContent ?? "";
        const r = parseInt(el.querySelector(".copt-r")?.textContent?.replace(/[^0-9]/g, "") ?? "0");
        cSel(el, n, r);
      });
    });

    /* ── COURSE TABS ──────────────────────────────────────── */
    const cTab = (btn: HTMLElement, panel: string) => {
      document.querySelectorAll<HTMLElement>(".ctab").forEach((t) => t.classList.remove("on"));
      document.querySelectorAll<HTMLElement>(".cpanel").forEach((p) => { p.classList.remove("on"); p.style.display = "none"; });
      btn.classList.add("on");
      const el = document.getElementById("panel-" + panel);
      if (el) {
        el.classList.add("on"); el.style.display = "grid";
        el.querySelectorAll<HTMLElement>(".rv").forEach((e) => {
          e.classList.remove("on");
          requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add("on")));
        });
      }
    };
    (window as any).cTab = cTab;
    document.querySelectorAll<HTMLElement>(".ctab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.dataset.panel ?? "";
        cTab(btn, panel);
      });
    });

    /* ── GSAP TEXT SCRAMBLE ON NAV LINKS ──────────────────── */
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    document.querySelectorAll<HTMLElement>(".nlinks a").forEach((link) => {
      const orig = link.textContent ?? "";
      link.addEventListener("mouseenter", () => {
        let iter = 0;
        const iv = setInterval(() => {
          link.textContent = orig.split("").map((c, i) => i < iter ? orig[i] : chars[Math.floor(Math.random() * chars.length)]).join("");
          iter += 0.6;
          if (iter >= orig.length) clearInterval(iv);
        }, 40);
      });
      link.addEventListener("mouseleave", () => { link.textContent = orig; });
    });

    /* ── SPARKLE ON BUTTON CLICK ──────────────────────────── */
    document.querySelectorAll<HTMLElement>(".btn-primary,.nbtn").forEach((btn) => {
      btn.addEventListener("click", (e: MouseEvent) => {
        for (let i = 0; i < 10; i++) {
          const sp = document.createElement("div");
          const angle = Math.random() * 360, dist = 40 + Math.random() * 40;
          sp.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:5px;height:5px;border-radius:50%;background:${Math.random() > 0.5 ? "var(--teal2)" : "var(--gold2)"};pointer-events:none;z-index:9999;transition:all .6s ease`;
          document.body.appendChild(sp);
          requestAnimationFrame(() => {
            sp.style.transform = `translate(${Math.cos(angle * Math.PI / 180) * dist}px,${Math.sin(angle * Math.PI / 180) * dist}px)`;
            sp.style.opacity = "0";
          });
          setTimeout(() => sp.remove(), 700);
        }
      });
    });

    /* ── SMOOTH ANCHOR SCROLL ─────────────────────────────── */
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href) return;
        const target = document.querySelector(href);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
    });

    /* ── CLEANUP ──────────────────────────────────────────── */
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScrollProgress);
      if (sPInt) clearInterval(sPInt);
      clearTimeout(particleTimeout);
      document.getElementById("scrollProgressBar")?.remove();
    };
  }, []);

  return null;
}
