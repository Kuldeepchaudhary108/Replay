"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useThemeStore } from "../../Zustand_Store/ThemeStore";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const { primaryColor } = useThemeStore();
  const heroImageRef = useRef<HTMLDivElement>(null);
  const featuresGridRef = useRef<HTMLDivElement>(null);
  const featuresHeaderRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLElement>(null);

  // GSAP animation for hero image
  useEffect(() => {
    if (heroImageRef.current) {
      gsap.fromTo(
        heroImageRef.current,
        { y: 100, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1.5, ease: "power3.out", delay: 0.5 }
      );
      gsap.to(heroImageRef.current, {
        y: -10, duration: 2, ease: "power1.inOut", repeat: -1, yoyo: true, delay: 2,
      });
    }
  }, []);

  // GSAP ScrollTrigger animation for features grid
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (featuresHeaderRef.current) {
        gsap.fromTo(
          featuresHeaderRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: featuresHeaderRef.current, start: "top 85%", once: true },
          }
        );
      }
      if (featuresGridRef.current) {
        const cards = featuresGridRef.current.querySelectorAll(".feature-card");
        gsap.fromTo(
          cards,
          { y: 70, opacity: 0, scale: 0.93 },
          {
            y: 0, opacity: 1, scale: 1, duration: 0.75, ease: "power3.out", stagger: 0.12,
            scrollTrigger: { trigger: featuresGridRef.current, start: "top 80%", once: true },
          }
        );
      }
    }, featuresSectionRef);
    return () => ctx.revert();
  }, []);

  // Star background animation
  useEffect(() => {
    const createStar = (isInitial = false) => {
      const star = document.createElement("div");
      star.className = "star";
      const space = document.getElementById("starBg");
      const spaceHeight = space?.clientHeight || 0;
      const spaceWidth = space?.clientWidth || 0;
      const dir = Math.floor(Math.random() * 4) + 1;
      let initialX, initialY;
      if (isInitial) {
        initialX = Math.floor(Math.random() * spaceWidth) + 1;
        initialY = Math.floor(Math.random() * spaceHeight) + 1;
      } else {
        const offset = 10;
        const randomEdge = Math.random() > 0.5;
        if (dir === 1) {
          initialX = randomEdge ? Math.random() * spaceWidth : -offset;
          initialY = randomEdge ? -offset : Math.random() * spaceHeight;
        } else if (dir === 2) {
          initialX = randomEdge ? Math.random() * spaceWidth : -offset;
          initialY = randomEdge ? spaceHeight + offset : Math.random() * spaceHeight;
        } else if (dir === 3) {
          initialX = randomEdge ? Math.random() * spaceWidth : spaceWidth + offset;
          initialY = randomEdge ? -offset : Math.random() * spaceHeight;
        } else {
          initialX = randomEdge ? Math.random() * spaceWidth : spaceWidth + offset;
          initialY = randomEdge ? spaceHeight + offset : Math.random() * spaceHeight;
        }
      }
      star.style.top = `${initialY}px`;
      star.style.left = `${initialX}px`;
      star.style.backgroundColor = `${primaryColor}80`;
      let animationFrameId: number;
      let lastTime = performance.now();
      const speed = 0.02;
      const animate = (currentTime: number) => {
        if (!star.isConnected) return;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        const distance = speed * deltaTime;
        if (dir === 1) {
          star.style.top = `${Number(star.style.top.slice(0, -2)) + distance}px`;
          star.style.left = `${Number(star.style.left.slice(0, -2)) + distance}px`;
        } else if (dir === 2) {
          star.style.top = `${Number(star.style.top.slice(0, -2)) - distance}px`;
          star.style.left = `${Number(star.style.left.slice(0, -2)) + distance}px`;
        } else if (dir === 3) {
          star.style.top = `${Number(star.style.top.slice(0, -2)) + distance}px`;
          star.style.left = `${Number(star.style.left.slice(0, -2)) - distance}px`;
        } else {
          star.style.top = `${Number(star.style.top.slice(0, -2)) - distance}px`;
          star.style.left = `${Number(star.style.left.slice(0, -2)) - distance}px`;
        }
        animationFrameId = requestAnimationFrame(animate);
      };
      space?.append(star);
      animationFrameId = requestAnimationFrame(animate);
      return () => { cancelAnimationFrame(animationFrameId); star.remove(); };
    };
    const cleanupFunctions: (() => void)[] = [];
    for (let i = 0; i <= 30; i++) { const c = createStar(true); cleanupFunctions.push(c); }
    const checkBoundaries = () => {
      const stars = document.querySelectorAll(".star");
      const space = document.querySelector("#starBg");
      stars.forEach((star) => {
        const htmlStar = star as HTMLElement;
        const top = Number(htmlStar.style.top.slice(0, -2));
        const left = Number(htmlStar.style.left.slice(0, -2));
        const height = space?.clientHeight || 0;
        const width = space?.clientWidth || 0;
        if (top < -100 || left < 0 || top > height || left > width) {
          htmlStar.remove();
          cleanupFunctions.push(createStar());
        }
      });
    };
    const boundaryInterval = setInterval(checkBoundaries, 50);
    return () => { clearInterval(boundaryInterval); cleanupFunctions.forEach((c) => c()); };
  }, [primaryColor]);

  // Shared SVG gradient defs
  const GradientDef = () => (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="iconGradSolid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C28383" />
          <stop offset="100%" stopColor="#862d2d" />
        </linearGradient>
      </defs>
    </svg>
  );

  const features = [
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="url(#iconGradSolid)" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="url(#iconGradSolid)" />
          <line x1="12" y1="22.08" x2="12" y2="12" stroke="url(#iconGradSolid)" />
        </svg>
      ),
      title: "Automatic Repo Cloning",
      description: "Securely clones repositories into an isolated environment for safe modification and testing.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="url(#iconGradSolid)" />
        </svg>
      ),
      title: "CI/CD Failure Detection",
      description: "Monitors your CI/CD pipelines in real time to rapidly identify the root cause of failures with surgical precision.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" stroke="url(#iconGradSolid)" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="url(#iconGradSolid)" />
        </svg>
      ),
      title: "Automatic Issue Resolution",
      description: "Generates and applies code fixes directly to the repository using context-aware AI models.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" stroke="url(#iconGradSolid)" />
        </svg>
      ),
      title: "Autonomous Retry System",
      description: "Intelligently retries jobs that fail due to flakiness or infrastructure issues without manual input.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#iconGradSolid)" />
          <path d="M9 12l2 2 4-4" stroke="url(#iconGradSolid)" />
        </svg>
      ),
      title: "Docker Security Scanning",
      description: "Automatically patches vulnerabilities in your container images and updates base images for best practices of safety.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" stroke="url(#iconGradSolid)" />
          <rect x="14" y="3" width="7" height="7" stroke="url(#iconGradSolid)" />
          <rect x="14" y="14" width="7" height="7" stroke="url(#iconGradSolid)" />
          <rect x="3" y="14" width="7" height="7" stroke="url(#iconGradSolid)" />
        </svg>
      ),
      title: "Real Time Dashboard",
      description: "Monitor all healing actions, cost savings, and pipeline health metrics from a single source of truth.",
    },
  ];

  return (
    <>
 
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 py-20 relative overflow-hidden">
        <div
          id="ray"
          className="absolute left-0 z-100 -top-[75vw] w-screen h-[100vw] pointer-events-none"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, #C28383 0%, rgba(134, 45, 45, 0.00) 94%)" }}
        />
        <div id="starBg" className="absolute inset-0 z-80 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto w-full z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="flex flex-col gap-6 lg:gap-8">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
                style={{ fontFamily: "Futura", color: primaryColor }}
              >
                Autonomous DevOps That{" "}
                <span style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}80 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Fixes Itself
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl opacity-70 max-w-2xl" style={{ fontFamily: "Futura", color: primaryColor }}>
                Replay is an AI-powered DevOps agent that detects, fixes, and validates CI/CD failures automatically. Let your pipelines heal while you focus on shipping.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                <Link
                  href="/heal"
                  className="w-full sm:w-auto font-bold rounded-md text-base sm:text-lg px-6 sm:px-8 py-3 text-center transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: primaryColor, color: "#000000", fontFamily: "Futura" }}
                >
                  Heal Your Repo
                </Link>
                <button
                  type="button"
                  className="w-full sm:w-auto font-medium text-base sm:text-lg hover:opacity-70 transition-opacity border border-current rounded-md px-6 sm:px-8 py-3"
                  style={{ color: primaryColor, fontFamily: "Futura" }}
                >
                  View Demo
                </button>
              </div>
            </div>
            <div ref={heroImageRef} className="relative w-full mt-8 lg:mt-0 order-first lg:order-last">
              <div className="relative w-full aspect-square scale-110 lg:scale-125">
                <Image src="/images/sideimage.svg" alt="DevOps Dashboard Illustration" fill className="object-contain" priority />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          Section 2: Features Grid
      ───────────────────────────────────── */}
      <section
        ref={featuresSectionRef}
        className="min-h-auto flex flex-col justify-center px-6 md:px-12 lg:px-24 py-20 lg:py- relative overflow-hidden"
      >
        <GradientDef />
        {/* Commented out per user preference */}
        {/* <div className="absolute left-0 z-0 -top-[75vw] w-screen h-[100vw] pointer-events-none"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, #C28383 0%, rgba(134, 45, 45, 0.00) 94%)" }} /> */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-0"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))" }} />

        <div className="relative max-w-7xl mx-auto w-full z-10">
          <div ref={featuresHeaderRef} className="text-center mb-14 lg:mb-20">
            <span
              className="inline-block text-xs sm:text-sm font-semibold tracking-widest uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{ fontFamily: "Futura", color: "#C28383", background: "rgba(194,131,131,0.12)", border: "1px solid rgba(194,131,131,0.25)" }}
            >
              What Replay Does
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-5 leading-tight"
              style={{ fontFamily: "Futura", color: primaryColor }}
            >
              Powerful Features for{" "}
              <span style={{ background: "linear-gradient(135deg, #C28383 0%, #862d2d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Modern DevOps
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl opacity-60 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "Futura", color: primaryColor }}>
              Everything you need to automate repository maintenance and pipeline stability — without lifting a finger.
            </p>
          </div>

          <div ref={featuresGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card group relative flex flex-col gap-5 p-6 lg:p-7 rounded-2xl overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-1"
                style={{ background: "rgba(10,10,10,0.6)", border: "1px solid rgba(194,131,131,0.15)", backdropFilter: "blur(12px)" }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(90deg, transparent, #C28383, transparent)" }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(194,131,131,0.08) 0%, transparent 70%)" }} />
                <div className="flex items-start justify-between">
                  <div
                    className="w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, rgba(194,131,131,0.18) 0%, rgba(134,45,45,0.08) 100%)", border: "1px solid rgba(194,131,131,0.2)" }}
                  >
                    {feature.icon}
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ fontFamily: "Futura", color: "rgba(194,131,131,0.4)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="text-lg lg:text-xl font-bold leading-snug" style={{ fontFamily: "Futura", color: primaryColor }}>{feature.title}</h3>
                  <p className="text-sm lg:text-base leading-relaxed" style={{ fontFamily: "Futura", color: `${primaryColor}99` }}>{feature.description}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-px flex-1" style={{ background: "rgba(194,131,131,0.15)" }} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C28383" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="opacity-40 group-hover:opacity-80 group-hover:translate-x-1 transition-all duration-300">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          Section 3: How It Works
      ───────────────────────────────────── */}
      <section className="flex flex-col justify-center px-6 md:px-12 lg:px-24 py-16 lg:py-24 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        <div className="relative max-w-7xl mx-auto w-full z-10">
          <div className="text-center mb-10 lg:mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: "Futura", color: primaryColor }}>How It Works</h2>
            <p className="text-base sm:text-lg opacity-60" style={{ fontFamily: "Futura", color: primaryColor }}>Seamless integration from failure to fix.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute left-0 right-0 pointer-events-none"
              style={{ top: "40px", borderTop: `2px dashed ${primaryColor}35` }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-4">
              {[
                { label: "Submission", desc: "User triggers pipeline or commits code.", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>), highlight: false },
                { label: "Detection", desc: "Replay monitors for failures.", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>), highlight: false },
                { label: "Analysis", desc: "AI identifies root cause context.", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>), highlight: false },
                { label: "Resolution", desc: "Healing patch is generated.", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>), highlight: false },
                { label: "Validation", desc: "Fix is tested in isolation.", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polyline points="20 6 9 17 4 12" /></svg>), highlight: false },
                { label: "Results", desc: "Updates synced to dashboard.", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>), highlight: true },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                    style={{ backgroundColor: step.highlight ? primaryColor : `${primaryColor}18`, border: `1px solid ${primaryColor}40`, color: step.highlight ? "#000" : primaryColor }}>
                    {step.icon}
                  </div>
                  <p className="font-bold text-sm sm:text-base" style={{ fontFamily: "Futura", color: primaryColor }}>{step.label}</p>
                  <p className="text-xs opacity-60 leading-snug max-w-[120px]"
                    style={{ fontFamily: "Futura", color: primaryColor, borderBottom: `1px dashed ${primaryColor}50`, paddingBottom: "6px" }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          Section 4: Universal Resolution Engine
      ───────────────────────────────────── */}
      <section className="flex flex-col justify-center px-6 md:px-12 lg:px-24 py-16 lg:py-24 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        <div className="relative max-w-7xl mx-auto w-full z-10">
          <div className="text-center mb-10 lg:mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "Futura", color: primaryColor }}>Universal Resolution Engine</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 lg:gap-4">
            {[
              { label: "Lint errors", dot: "#FBBF24" },
              { label: "Missing dependencies", dot: "#60A5FA" },
              { label: "Syntax errors", dot: "#A78BFA" },
              { label: "Import errors", dot: "#F87171" },
              { label: "Configuration issues", dot: "#FB923C" },
              { label: "Docker vulnerabilities", dot: "#34D399" },
            ].map((tag, i) => (
              <div key={i} className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 cursor-default"
                style={{ fontFamily: "Futura", color: primaryColor, border: `1px solid ${primaryColor}30`, backgroundColor: `${primaryColor}08` }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.dot }} />
                {tag.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          Section 5: Built With Security First (PREMIUM)
      ───────────────────────────────────── */}
      <section className="flex flex-col justify-center px-6 md:px-12 lg:px-24 py-20 lg:py-28 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        {/* Ambient radial glow — top right corner */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(194,131,131,0.07) 0%, transparent 70%)" }} />

        <div className="relative max-w-7xl mx-auto w-full z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* ── Left side ── */}
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-4">
                <span
                  className="inline-block self-start text-xs font-semibold tracking-widest uppercase px-3.5 py-1.5 rounded-full"
                  style={{ fontFamily: "Futura", color: "#C28383", background: "rgba(194,131,131,0.10)", border: "1px solid rgba(194,131,131,0.22)" }}
                >
                  Enterprise-Grade Security
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{ fontFamily: "Futura", color: primaryColor }}>
                  Built With{" "}
                  <span style={{ background: "linear-gradient(135deg, #C28383 0%, #862d2d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Security First
                  </span>
                </h2>
                <p className="text-base sm:text-lg leading-relaxed opacity-60 max-w-lg" style={{ fontFamily: "Futura", color: primaryColor }}>
                  We handle your code with the highest security standards. Replay acts as a read-only observer until you authorize explicit healing actions.
                </p>
              </div>

              {/* Security feature cards — 2×2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  {
                    label: "Sandboxed execution",
                    desc: "All fixes are validated in isolated ephemeral environments.",
                    icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#iconGradSolid)" /><path d="M9 12l2 2 4-4" stroke="url(#iconGradSolid)" /></svg>),
                  },
                  {
                    label: "Non-destructive",
                    desc: "Never modifies the main branch directly without approval.",
                    icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10" stroke="url(#iconGradSolid)" /><path d="M4.93 4.93l14.14 14.14" stroke="url(#iconGradSolid)" /></svg>),
                  },
                  {
                    label: "Encrypted Secrets",
                    desc: "SOC2 compliant secret management for CI/CD integration.",
                    icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="url(#iconGradSolid)" /><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="url(#iconGradSolid)" /></svg>),
                  },
                  {
                    label: "Audit Logs",
                    desc: "Full visibility into every action the AI agent performs.",
                    icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="url(#iconGradSolid)" /><circle cx="12" cy="12" r="3" stroke="url(#iconGradSolid)" /></svg>),
                  },
                ].map((item, i) => (
                  <div key={i} className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                    style={{ background: "rgba(194,131,131,0.04)", border: "1px solid rgba(194,131,131,0.12)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                      style={{ background: "linear-gradient(135deg, rgba(194,131,131,0.18) 0%, rgba(134,45,45,0.08) 100%)", border: "1px solid rgba(194,131,131,0.22)" }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-1" style={{ fontFamily: "Futura", color: primaryColor }}>{item.label}</p>
                      <p className="text-xs leading-relaxed opacity-55" style={{ fontFamily: "Futura", color: primaryColor }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust stats strip */}
              <div className="flex flex-wrap items-center gap-4 px-5 py-3.5 rounded-2xl"
                style={{ background: "rgba(194,131,131,0.05)", border: "1px solid rgba(194,131,131,0.14)" }}>
                {[
                  { value: "SOC2", label: "Certified" },
                  { value: "256-bit", label: "AES Encryption" },
                  { value: "Zero", label: "Data Retention" },
                  { value: "99.9%", label: "Uptime SLA" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 flex-1 min-w-[80px]">
                    {i > 0 && <div className="w-px h-7 flex-shrink-0 hidden sm:block" style={{ background: "rgba(194,131,131,0.2)" }} />}
                    <div>
                      <p className="text-sm font-bold leading-none"
                        style={{ fontFamily: "Futura", background: "linear-gradient(135deg, #C28383, #862d2d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {stat.value}
                      </p>
                      <p className="text-xs opacity-50 mt-0.5" style={{ fontFamily: "Futura", color: primaryColor }}>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right side — premium shield visual ── */}
            <div className="flex items-center justify-center order-first lg:order-last">
              <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
                {/* Outer ambient glow */}
                <div className="absolute inset-0 rounded-full blur-3xl opacity-20"
                  style={{ background: "radial-gradient(circle, #C28383 0%, #862d2d 60%, transparent 100%)" }} />
                {/* Outermost ring */}
                <div className="absolute inset-0 rounded-full" style={{ border: "1.5px solid rgba(194,131,131,0.12)" }} />
                {/* Middle ring */}
                <div className="absolute rounded-full" style={{ inset: "10%", border: "1px solid rgba(194,131,131,0.22)" }} />
                {/* Inner filled ring */}
                <div className="absolute rounded-full" style={{ inset: "22%", background: "rgba(194,131,131,0.04)", border: "1px solid rgba(194,131,131,0.30)" }} />
                {/* Glowing top dot */}
                <div className="absolute rounded-full" style={{ width: "10px", height: "10px", top: "-2px", left: "calc(50% - 5px)", background: "linear-gradient(135deg, #C28383, #862d2d)", boxShadow: "0 0 12px 4px rgba(194,131,131,0.6)" }} />
                {/* Glowing right dot */}
                <div className="absolute rounded-full" style={{ width: "6px", height: "6px", top: "calc(50% - 3px)", right: "0px", background: "#C28383", boxShadow: "0 0 8px 3px rgba(194,131,131,0.4)" }} />
                {/* Shield center */}
                <div className="absolute rounded-full flex items-center justify-center"
                  style={{ inset: "22%", background: "linear-gradient(160deg, rgba(194,131,131,0.12) 0%, rgba(134,45,45,0.06) 100%)" }}>
                  <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2/3 h-2/3">
                    <defs>
                      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C28383" />
                        <stop offset="100%" stopColor="#862d2d" />
                      </linearGradient>
                      <filter id="shieldGlow">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <path d="M44 8L18 18v18c0 18 11.2 34.8 26 39 14.8-4.2 26-21 26-39V18L44 8z"
                      fill="url(#shieldGrad)" fillOpacity="0.9" filter="url(#shieldGlow)" />
                    <path d="M32 43l8 8 16-16" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          Section 6: Architecture
      ───────────────────────────────────── */}
      <section className="flex flex-col justify-center px-6 md:px-12 lg:px-24 py-16 lg:py-24 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        <div className="absolute top-0 left-6 right-6 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(194,131,131,0.3), transparent)" }} />

        <div className="relative max-w-5xl mx-auto w-full z-10">
          <div className="text-center mb-10 lg:mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: "Futura", color: primaryColor }}>Architecture</h2>
            <p className="text-base sm:text-lg opacity-60" style={{ fontFamily: "Futura", color: primaryColor }}>High-level flow of the Replay engine.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 flex-wrap">
            {[
              { label: "User Request", highlight: false, last: false },
              { label: "Git Provider API", highlight: false, last: false },
              { label: "REPLAY AGENT", highlight: true, last: false },
              { label: "CI Infrastructure", highlight: false, last: false },
              { label: "Real-time Dashboard", highlight: false, last: true },
            ].map((node, i, arr) => (
              <div key={i} className="flex items-center">
                <div
                  className="relative px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-105"
                  style={{
                    fontFamily: "Futura",
                    color: node.highlight ? "#000" : primaryColor,
                    background: node.highlight ? "linear-gradient(135deg, #C28383 0%, #862d2d 100%)" : node.last ? "transparent" : "rgba(194,131,131,0.06)",
                    border: node.highlight ? "none" : node.last ? `1px solid ${primaryColor}60` : "1px solid rgba(194,131,131,0.2)",
                    boxShadow: node.highlight ? "0 0 24px rgba(194,131,131,0.35), 0 0 8px rgba(194,131,131,0.2)" : "none",
                  }}
                >
                  {node.highlight && (
                    <div className="absolute inset-0 rounded-lg opacity-40 blur-md -z-10"
                      style={{ background: "linear-gradient(135deg, #C28383, #862d2d)" }} />
                  )}
                  {node.label}
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center px-2 sm:px-3 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: "rgba(194,131,131,0.6)" }} stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-10 lg:mt-14">
            {[
              { label: "Trigger", sub: "Webhook or manual" },
              { label: "Clone & Scan", sub: "Isolated sandbox" },
              { label: "Patch & Test", sub: "AI-generated fix" },
              { label: "Report", sub: "Live dashboard" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: "rgba(194,131,131,0.7)" }} />
                <span className="text-xs font-semibold" style={{ fontFamily: "Futura", color: primaryColor }}>{step.label}</span>
                <span className="text-xs opacity-40" style={{ fontFamily: "Futura", color: primaryColor }}>{step.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-6 right-6 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(194,131,131,0.3), transparent)" }} />
      </section>

      {/* ─────────────────────────────────────
          Section 7: CTA
      ───────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 md:px-12 lg:px-24 py-24 lg:py-36 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(194,131,131,0.10) 0%, transparent 70%)" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-10"
          style={{ border: "1px solid rgba(194,131,131,0.6)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        <div className="absolute w-[700px] h-[700px] rounded-full pointer-events-none opacity-5"
          style={{ border: "1px solid rgba(194,131,131,0.6)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6 lg:gap-8">
          <span className="inline-block text-xs sm:text-sm font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full"
            style={{ fontFamily: "Futura", color: "#C28383", background: "rgba(194,131,131,0.10)", border: "1px solid rgba(194,131,131,0.22)" }}>
            Get Started Free
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight" style={{ fontFamily: "Futura", color: primaryColor }}>
            Start Healing Your{" "}
            <span style={{ background: "linear-gradient(135deg, #C28383 0%, #862d2d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Pipelines
            </span>{" "}Today
          </h2>
          <p className="text-base sm:text-lg lg:text-xl opacity-60 max-w-xl leading-relaxed" style={{ fontFamily: "Futura", color: primaryColor }}>
            Join 500+ teams using Replay to eliminate manual CI/CD maintenance and ship faster with total confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center mt-2">
            <Link
              href="/heal"
              className="relative inline-flex items-center gap-2.5 font-bold text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
              style={{ fontFamily: "Futura", color: "#000" }}
            >
              <span className="absolute inset-0" style={{ background: "linear-gradient(135deg, #C28383 0%, #862d2d 100%)" }} />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, #d49898 0%, #9e3d3d 100%)" }} />
              <span className="absolute inset-0 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, #C28383, #862d2d)" }} />
              <span className="relative z-10">Heal Your Repo Free</span>
              <svg className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
          <p className="text-xs sm:text-sm opacity-35 mt-1" style={{ fontFamily: "Futura", color: primaryColor }}>
            No credit card required. Free 14-day trial on all plans.
          </p>
        </div>
      </section>
    </>
  );
};

export default Features;
