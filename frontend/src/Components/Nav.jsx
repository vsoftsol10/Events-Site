import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.png";
import leaf from "../assets/leaves.png";
import border from "../assets/bg.jpg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Glimpses", href: "#glimpses" },
  { label: "Benefits", href: "#benefits" },
  { label: "Speakers", href: "#speakers" },
];

function Nav({ showBackButton = false }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("#hero");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy for the active nav indicator — no-ops harmlessly if section ids aren't present yet
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(Boolean);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const changeLanguage = (lng) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  const handleNavClick = (href) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 w-full z-50 overflow-x-hidden"
    >
      {/* Kraft-paper texture, always present */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${border})` }} />
      {/* Frosted glass veil, fades in on scroll */}
      <div
        className="absolute inset-0 bg-[#FCFBF8]/90 backdrop-blur-xl transition-opacity duration-500 border-b"
        style={{ opacity: scrolled ? 1 : 0, borderColor: scrolled ? "#E5E7EB" : "transparent" }}
      />

      <div
        className={`relative flex items-center justify-between px-3 sm:px-4 md:px-8 transition-all duration-500 ${
          scrolled ? "py-2 md:py-3" : "py-4 md:py-6"
        }`}
      >
        {/* LEFT — Back + Logo */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 shadow-sm border border-[#E5E7EB] text-[#245C1F] hover:bg-white transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          <button onClick={() => handleNavClick("#hero")} className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-0">
              <img
                src={logo}
                alt="VsoftSolutions logo"
                className="w-20 h-20 sm:w-16 sm:h-16 md:w-35 md:h-22 object-contain mix-blend-multiply   p-1 "
              />
            </div>
          </button>
        </div>

        {/* CENTER — Links (desktop) */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="relative px-4 py-2 text-sm font-medium text-[#1F2937] hover:text-[#245C1F] transition-colors"
            >
              {link.label}
              {active === link.href && (
                <motion.span
                  layoutId="nav-active-stitch"
                  className="absolute left-3 right-3 -bottom-0.5 h-[2px]"
                  style={{ backgroundImage: "repeating-linear-gradient(90deg, #D89A07 0 6px, transparent 6px 10px)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* RIGHT — Language + Register + Hamburger */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center bg-[#E8F5E9] p-1 rounded-full border border-[#245C1F]/10">
            <button
              onClick={() => changeLanguage("en")}
              className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium transition-all ${
                language === "en" ? "bg-white shadow-sm text-[#1F2937]" : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage("ta")}
              className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium transition-all ${
                language === "ta" ? "bg-white shadow-sm text-[#1F2937]" : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              தமிழ்
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/register")}
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#245C1F] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:bg-[#1c4818] transition-colors"
          >
            Register
          </motion.button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-full bg-white/80 border border-[#E5E7EB] shadow-sm"
          >
            <motion.span animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="h-[2px] bg-[#1F2937] block" style={{ width: 18 }} />
            <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} className="h-[2px] bg-[#1F2937] block" style={{ width: 18 }} />
            <motion.span animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="h-[2px] bg-[#1F2937] block" style={{ width: 18 }} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden relative bg-[#FCFBF8]/95 backdrop-blur-xl border-t border-[#E5E7EB] overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`text-left py-2.5 text-base font-medium border-b border-[#E5E7EB] last:border-0 transition-colors ${
                    active === link.href ? "text-[#245C1F]" : "text-[#1F2937]"
                  }`}
                >
                  {link.label}
                </button>
              ))}

              <div className="flex items-center gap-2 mt-3 sm:hidden">
                <div className="flex items-center bg-[#E8F5E9] p-1 rounded-full border border-[#245C1F]/10">
                  <button
                    onClick={() => changeLanguage("en")}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${language === "en" ? "bg-white shadow-sm text-[#1F2937]" : "text-[#6B7280]"}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => changeLanguage("ta")}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${language === "ta" ? "bg-white shadow-sm text-[#1F2937]" : "text-[#6B7280]"}`}
                  >
                    தமிழ்
                  </button>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register")}
                className="mt-3 w-full bg-[#245C1F] text-white text-sm font-semibold py-3 rounded-full shadow-sm"
              >
                Register Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Nav;