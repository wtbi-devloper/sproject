import { useRef, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import apiClient from "../api/client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  HERO_BADGE,
  HERO_DESCRIPTION,
  PRIMARY_CTA_LINK,
} from "../constants/content";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Remote video link is managed completely by Admin Dashboard via API (/api/v1/settings)
const setHeroNavbarTheme = (isLight: boolean) => {
  document.documentElement.dataset.heroNavbarTheme = isLight ? 'light' : 'dark';
  window.dispatchEvent(new CustomEvent('hero-theme-change', { detail: { isLight } }));
};

export default function HeroSection() {
  const container = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/settings')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.heroVideoUrl && data.heroVideoUrl.trim() !== '') {
          setVideoUrl(data.heroVideoUrl.trim());
        } else {
          setVideoUrl('');
          setIsVideoLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch settings:', err);
        setVideoUrl('');
        setIsVideoLoaded(true);
      });
  }, []);

  // Minimum spinner display time so it feels intentional and doesn't flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadedData = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      setIsVideoLoaded(true);
    }
  };

  // Immediate check in case video is cached or already ready (or no video URL configured)
  useEffect(() => {
    if (videoUrl === '') {
      // Defer state update to avoid synchronous setState in effect
      setTimeout(() => setIsVideoLoaded(true), 0);
    } else if (videoRef.current && videoRef.current.readyState >= 2) {
      setTimeout(() => setIsVideoLoaded(true), 0);
    }
  }, [videoUrl]);

  // isVideoReady: both the video loaded AND minimum time elapsed
  const isVideoReady = isVideoLoaded && minTimeElapsed;

  // The spinner should be visible until video + bg is truly ready
  // The hero content (intro text) fades in once ready
  useGSAP(() => {
    if (isVideoReady) {
      gsap.to(".hero-intro", {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.2,
        ease: "power2.out",
      });
    }
  }, [isVideoReady]);

  useGSAP(() => {
    // Set initial states
    gsap.set(".hero-elem", { opacity: 0, y: 30 });
    gsap.set(".hero-title-line", { opacity: 0, y: 60, rotateX: 10 });
    gsap.set(".hero-btn", { opacity: 0, y: 20 });
    gsap.set(".hero-cursor", { display: "none" });

    // Scroll-Triggered Native Playback
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let playPromise: Promise<void> | undefined;
    let isIntendedToPlay = false;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 300px)", () => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 2,
          invalidateOnRefresh: true,
          onEnter: () => setHeroNavbarTheme(false),
          onLeave: () => setHeroNavbarTheme(true),
          onEnterBack: () => setHeroNavbarTheme(false),
          onUpdate: (self) => {
            if (videoRef.current) {
              const video = videoRef.current;
              if (self.isActive && Math.abs(self.getVelocity()) > 5) {
                isIntendedToPlay = true;
                if (video.paused && !playPromise) {
                  playPromise = video.play();
                  if (playPromise !== undefined) {
                    playPromise.then(() => {
                      playPromise = undefined;
                      if (!isIntendedToPlay) video.pause();
                    }).catch(() => {
                      playPromise = undefined;
                    });
                  }
                }
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                  isIntendedToPlay = false;
                  if (!playPromise && !video.paused) video.pause();
                }, 150);
              } else if (!self.isActive) {
                isIntendedToPlay = false;
                if (!playPromise && !video.paused) video.pause();
              }
            }
          }
        }
      });

      // Background Video Parallax
      scrollTl.to(".hero-vid-container", { scale: 1.15, transformOrigin: "center center", ease: "none", duration: 12 }, 0);

      // PHASE 1: Fade out intro text
      scrollTl.fromTo(".hero-intro-wrapper",
        { opacity: 1, scale: 1 },
        { opacity: 0, scale: 1.05, duration: 1, ease: "power2.out", immediateRender: false },
        0
      );

      // PHASE 2: Typewriter
      scrollTl.to(".hero-cursor", { display: "inline-block", duration: 0.01 }, 1);
      scrollTl.to(".hero-desc-char", { display: "inline", stagger: 0.05, duration: 0.01 }, 1);

      // PHASE 3: Title & Badge
      scrollTl.to(".hero-title-line", {
        opacity: 1, y: 0, rotateX: 0, duration: 1.5, stagger: 0.3, ease: "back.out(1.2)"
      }, 6)
        .to(".hero-badge", { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 7.5);

      // PHASE 4: Button
      scrollTl.to(".hero-btn", { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" }, 8.5);

      scrollTl.to({}, { duration: 0.1 }, 10);
    });

    return () => { mm.revert(); };
  }, { scope: container });

  return (
    <section
      id="hero"
      ref={container}
      className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[var(--brown)]"
    >
      {/* Background Video — always rendered so browser can start loading immediately */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-[var(--brown)]">
        <div className="hero-vid-container h-full w-full will-change-transform">
          {videoUrl ? (
            <video
              key={videoUrl}
              ref={videoRef}
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={handleLoadedData}
              onCanPlay={handleLoadedData}
              // Video is visible as soon as ready
              className={`h-full w-full object-cover transition-opacity duration-1000 ${
                isVideoReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div
              className={`h-full w-full bg-[#3D2616] transition-opacity duration-700 ${
                isVideoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      </div>

      {/* === BRANDED LOADING SPINNER ===
          Covers everything with blur until video + minimum time are satisfied.
          pointer-events-none so it never blocks clicks when fading out. */}
      <div
        className={`absolute inset-0 z-50 flex items-center justify-center bg-[var(--brown)] transition-opacity duration-700 pointer-events-none ${
          isVideoReady ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <img
            src="/sprojectlogo.png"
            alt="Loading S Project..."
            className="h-24 w-24 object-contain animate-flip-y filter drop-shadow-lg"
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">
            Loading...
          </span>
        </div>
      </div>

      {/* === 1. INITIAL HERO STATE: Center Title, Ghost CTA & Scroll Indicator ===
          Fades in after video is ready. Fades out on first scroll. */}
      <div className="hero-intro-wrapper absolute inset-0 z-10 pointer-events-none">
        <div className="hero-intro flex flex-col items-center justify-center h-full px-6 text-center opacity-0 translate-y-4 pointer-events-auto">
          <h1 className="font-['Playfair_Display'] tracking-wide">
            <span className="block text-2xl font-medium text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Scroll to know about
            </span>
            <span className="mt-2 lg:mt-3 block text-4xl font-bold italic text-[var(--gold)] sm:text-5xl md:text-6xl lg:text-7xl">
              Salman WTBI
            </span>
          </h1>

          {/* Ghost CTA — for impatient users who don't want to scroll */}
          <NavLink
            to="/page/story"
            className="group mt-8 sm:mt-10 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md transition-all duration-300 hover:border-white/70 hover:bg-white/20"
          >
            Explore the Story
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </NavLink>

          {/* === SCROLL INDICATOR ===
              1. Text FIRST ("Scroll to explore")
              2. Button with rounded border SECOND
              3. Transparent with backdrop blur — matching "Explore the Story"
              4. BOTH bounce together in unison!
              5. The rounded border bounces WITH the arrow */}
          <div
            onClick={() => {
              const next =
                document.getElementById("story") ||
                document.getElementById("hero")?.nextElementSibling;
              if (next) {
                next.scrollIntoView({ behavior: "smooth" });
              } else {
                window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
              }
            }}
            className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce cursor-pointer group z-20 select-none"
            role="button"
            tabIndex={0}
            aria-label="Scroll to explore"
          >
            {/* FIRST: Text */}
            <span className="mb-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 group-hover:text-white transition-colors">
              Scroll to explore
            </span>

            {/* SECOND: Button with rounded border — transparent with backdrop blur matching Explore the Story */}
            <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md shadow-lg transition-all duration-300 group-hover:border-white/70 group-hover:bg-white/20 group-hover:scale-105">
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-white transition-transform duration-300 group-hover:translate-y-0.5" strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </div>

      {/* === 2. TOP RIGHT: Typewriter Description === */}
      <div className="absolute top-28 min-[380px]:top-32 sm:top-32 left-1/2 z-20 w-[90%] max-w-[340px] -translate-x-1/2 text-center lg:left-auto lg:right-24 lg:top-32 lg:w-[420px] lg:translate-x-0 lg:text-left xl:w-[500px]">
        <p className="font-['Playfair_Display'] text-xl leading-snug text-white sm:text-3xl lg:text-4xl">
          {HERO_DESCRIPTION.split("").map((char, i) => (
            <span key={i} className="hero-desc-char hidden">
              {char}
            </span>
          ))}
          <span className="hero-cursor ml-1 inline-block h-[0.8em] w-[3px] animate-pulse align-baseline bg-[var(--gold)]" />
        </p>
      </div>

      {/* === 3. BOTTOM RIGHT: CTA Button === */}
      <div className="absolute bottom-10 sm:bottom-16 left-1/2 z-20 -translate-x-1/2 lg:bottom-24 lg:left-auto lg:right-24 lg:translate-x-0">
        <NavLink
          to={PRIMARY_CTA_LINK}
          className="hero-btn group relative flex items-center justify-center whitespace-nowrap rounded-full border border-white/50 bg-transparent px-7 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-white hover:bg-white/10"
        >
          <span className="relative z-10 text-xs uppercase tracking-widest">Know More</span>
          <span className="relative z-10 ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
        </NavLink>
      </div>

      {/* === 4. BOTTOM LEFT: Main Title & Badge === */}
      <div className="absolute bottom-28 sm:bottom-36 left-1/2 z-20 flex w-full -translate-x-1/2 flex-col items-center px-4 text-center lg:bottom-24 lg:left-24 lg:w-auto lg:translate-x-0 lg:items-start lg:px-0 lg:text-left">
        <h2 className="mb-4 sm:mb-6 font-['Playfair_Display'] text-4xl leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          <div className="hero-elem hero-title-line overflow-hidden opacity-0">
            Be Believers,
          </div>
          <div className="hero-elem hero-title-line mt-1 overflow-hidden text-[var(--gold-light)] italic opacity-0 sm:mt-2">
            Be Leaders
          </div>
        </h2>
        <div className="hero-elem hero-badge inline-flex items-center text-xs font-semibold uppercase tracking-widest text-white/80 opacity-0 sm:text-sm">
          <span className="mr-3 inline-block h-[2px] w-6 bg-[var(--gold)] sm:mr-4 sm:w-8" />
          {HERO_BADGE}
        </div>
      </div>
    </section>
  );
}
