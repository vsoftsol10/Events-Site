/**
 * Hero.jsx — Premium 2026 redesign (split layout)
 * ---------------------------------------------------------------
 * ⚠️ Add these two Google Font links to your index.html <head> (or
 * import them in your global CSS) before dropping this file in —
 * the design leans on them for the "premium summit" feel:
 *
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
 *
 * NOTHING in the data layer changed: fetchEvent(), the axios call,
 * useEffect hooks, the countdown/deadline logic, isRegistrationClosed(),
 * i18next, and navigate() are all byte-for-byte the same as before.
 * Only the JSX/markup and styling were rebuilt — this version splits
 * the hero into a left text column and a right visual column.
 * ---------------------------------------------------------------
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

import { API_URL } from "../config";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

function Hero() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });

  useEffect(() => { fetchEvent(); }, []);

  const fetchEvent = async () => {
    try {
      const res = await axios.get((`${API_URL}/events`));
      const rows = res.data;
      if (rows.length > 0) {
        const latest = rows[rows.length - 1];
        setEvent({
          eventId: latest[0],
          titleEn: latest[1],
          titleTa: latest[2],
          type: latest[3],
          date: latest[4],
          time: latest[5],
          venueEn: latest[6],
          venueTa: latest[7],
          seats: latest[8],
          district: latest[9],
          deadline: latest[10],
          descriptionEn: latest[11],
          descriptionTa: latest[12],
          speakersEn: JSON.parse(latest[13] || "[]"),
          speakersTa: JSON.parse(latest[14] || "[]"),
          status: latest[15],
          banner: latest[16],
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const isRegistrationClosed = () => {
    if (event?.status === "closed") return true;
    if (event?.deadline && new Date(event.deadline) < new Date()) return true;
    return false;
  };

  useEffect(() => {
    if (!event?.deadline) return;
    const timer = setInterval(() => {
      const now = new Date();
      const deadline = new Date(event.deadline);
      const difference = deadline - now;
      if (difference <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [event]);

  /* ---------- presentation-only derived values (no business logic) ---------- */
  const isTa = i18n.language === "ta";
  const closed = isRegistrationClosed();

  const formattedDate = event?.date
    ? new Date(event.date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const venueTextFull = (isTa ? event?.venueTa : event?.venueEn) || "—";

  const speakerList = isTa ? event?.speakersTa : event?.speakersEn;
  const speaker = speakerList?.[0] || {
    name: "Banu Priya",
    role: "Founder & CEO",
    company: "Vsoft Solutions",
    image: "",
  };

  const quickInfo = [
    { icon: "📅", label: isTa ? "தேதி" : "Date", value: formattedDate },
    { icon: "🕔", label: isTa ? "நேரம்" : "Time", value: event?.time || "—" },
    { icon: "🎟", label: isTa ? "கட்டணம்" : "Registration Fee", value: "₹299" },
  ];

  const venueInfo = {
    icon: "📍",
    label: isTa ? "இடம்" : "Venue",
    value: venueTextFull,
  };

  const trustBadges = isTa
    ? ["சான்றிதழ்", "காபி & நொறுக்குத்தீனி", "நெட்வொர்க்கிங்", "AI கற்றல்", "வணிக வளர்ச்சி"]
    : ["Certificate", "Coffee & Snacks", "Networking", "AI Learning", "Business Growth"];

  const countdownBlocks = [
    { value: timeLeft.days, label: t("days") },
    { value: timeLeft.hours, label: t("hours") },
    { value: timeLeft.minutes, label: t("mins") },
    { value: timeLeft.seconds, label: t("secs") },
  ];

  return (
    <section
      id="events"
      className="relative overflow-hidden pt-28 md:pt-36 pb-20 md:pb-28 bg-[#FCFBF8]"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ---------- decorative background layer ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(#C9A227 0.7px, transparent 0.7px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(ellipse 90% 60% at 50% 20%, black 20%, transparent 75%)",
          }}
        />
        <div
          className="absolute -top-32 -left-20 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle, #DCEBD8 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-40 -right-32 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, #F0D98C 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #C9E0C2 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-8"
      >
        {/* ---------- split: left text column / right visual column ---------- */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-14 md:gap-10">

          {/* ===================== LEFT COLUMN ===================== */}
          <div className="w-full md:w-[52%] text-center md:text-left max-w-2xl mx-auto md:max-w-none">
            {/* eyebrow + badge */}
            <motion.p
              variants={fadeLeft}
              className="text-[#245C1F] font-semibold tracking-[0.25em] uppercase mb-4 text-[11px] md:text-xs"
            >
              {t("welcome")}
            </motion.p>

            <motion.div
              variants={fadeLeft}
              className="inline-flex items-center gap-2 bg-[#0F2E1C] px-5 py-2 rounded-full mb-7 shadow-[0_6px_20px_-6px_rgba(15,46,28,0.5)] ring-1 ring-[#C9A227]/40"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C468]" />
              <span
                className="text-[#E8C468] font-semibold text-[11px] md:text-xs uppercase tracking-[0.18em]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {isTa ? "வணிக உச்சிமாநாடு 2026" : "Business Summit 2026"}
              </span>
            </motion.div>

            {/* headline (dynamic) */}
            <motion.h1
              variants={fadeLeft}
              className="text-[#132A1B] font-extrabold leading-[1.1] tracking-tight text-3xl sm:text-4xl md:text-[2.6rem] lg:text-[3rem]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {event ? (isTa ? event.titleTa : event.titleEn) : (
                <span className="inline-block h-14 md:h-16 w-3/4 rounded-lg bg-[#132A1B]/10 animate-pulse" />
              )}
            </motion.h1>

            {/* static subtitle */}
            <motion.p
              variants={fadeLeft}
              className="mt-5 text-[#245C1F] font-semibold text-base md:text-lg lg:text-xl"
            >
              {isTa
                ? "ஒவ்வொரு வணிக உரிமையாளரும் அறிய வேண்டிய டிஜிட்டல் மார்க்கெட்டிங் & AI உத்திகள்"
                : "Digital Marketing & AI Strategies Every Business Owner Should Know"}
            </motion.p>

            {/* short description (dynamic, clamped) */}
            <motion.p
              variants={fadeLeft}
              className="mt-4 text-[#5B6B5F] text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl mx-auto md:mx-0"
            >
              {event ? (isTa ? event.descriptionTa : event.descriptionEn) : "…"}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeLeft}
              className="mt-9 flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4 w-full"
            >
              <motion.button
                whileHover={{ scale: closed ? 1 : 1.04 }}
                whileTap={{ scale: closed ? 1 : 0.97 }}
                onClick={() => {
                  if (closed) { alert("Registration Closed"); return; }
                  navigate("/register");
                }}
                disabled={closed}
                className={`w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-sm md:text-base shadow-lg transition-all ${
                  closed
                    ? "bg-red-700 text-white cursor-not-allowed"
                    : "text-white cursor-pointer"
                }`}
                style={
                  closed
                    ? {}
                    : {
                        fontFamily: "'Manrope', sans-serif",
                        background: "linear-gradient(135deg, #245C1F 0%, #0F2E1C 100%)",
                        boxShadow: "0 10px 30px -8px rgba(15,46,28,0.55)",
                      }
                }
              >
                {closed ? "Registration Closed" : `${t("registerNow")} →`}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  document.getElementById("glimpses")?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm md:text-base font-semibold text-[#132A1B] bg-white/70 backdrop-blur-md ring-1 ring-[#132A1B]/15 hover:bg-white transition-colors cursor-pointer"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {isTa ? "நிகழ்ச்சி நிரல்" : "View Agenda"}
              </motion.button>
            </motion.div>

            {/* quick info — compact row + a full-width venue row so nothing gets clipped */}
            <motion.div
              variants={fadeLeft}
              className="mt-12 max-w-lg mx-auto md:mx-0 rounded-2xl border border-[#132A1B]/12 overflow-hidden bg-white"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#132A1B]/12">
                {quickInfo.map((item) => (
                  <div key={item.label} className="px-3 py-4 sm:px-4 text-left">
                    <p className="flex items-center gap-1.5 text-[#245C1F] text-[10px] uppercase tracking-[0.14em] font-bold">
                      <span className="text-sm">{item.icon}</span>
                      {item.label}
                    </p>
                    <p
                      className="mt-2 text-[#132A1B] font-extrabold text-base sm:text-lg leading-snug"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 px-4 py-4 border-t border-[#132A1B]/12">
                <span className="text-sm mt-0.5 shrink-0">{venueInfo.icon}</span>
                <div className="min-w-0">
                  <p className="text-[#245C1F] text-[10px] uppercase tracking-[0.14em] font-bold">
                    {venueInfo.label}
                  </p>
                  <p
                    className="mt-1 text-[#132A1B] font-extrabold text-base sm:text-lg leading-snug"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {venueInfo.value}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ===================== RIGHT COLUMN ===================== */}
          <div className="w-full md:w-[48%] md:sticky md:top-32">
            <motion.div
              variants={fadeUp}
              className="relative w-full"
            >
              <div
                aria-hidden="true"
                className="absolute -inset-6 md:-inset-10 rounded-[48px] opacity-60 blur-3xl -z-10"
                style={{ background: "radial-gradient(circle, #E8C468 0%, #DCEBD8 45%, transparent 75%)" }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                className="relative rounded-[32px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(15,46,28,0.35)] ring-1 ring-black/5 bg-[#f8f5ef]"
              >
                {event?.banner ? (
                  <img
                    src={event.banner}
                    alt="hero"
                    className="w-full h-auto block"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] animate-pulse bg-[#132A1B]/10" />
                )}
              </motion.div>

              {/* speaker card, overlapping bottom-left of banner */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-8 left-4 md:left-8 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl pl-3 pr-5 py-3 shadow-[0_15px_35px_-12px_rgba(15,46,28,0.4)] ring-1 ring-black/5"
              >
                <div className="relative shrink-0">
                  {speaker.image ? (
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-[#E8C468]"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 ring-[#E8C468] flex items-center justify-center text-white font-bold"
                      style={{ background: "linear-gradient(135deg, #245C1F, #0F2E1C)", fontFamily: "'Manrope', sans-serif" }}
                    >
                      {speaker.name?.[0] || "S"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#245C1F] ring-2 ring-white flex items-center justify-center text-white text-[9px]">
                    ✓
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#8a9c8d] font-semibold">
                    {isTa ? "பேச்சாளர்" : "Speaker"}
                  </p>
                  <p className="text-[#132A1B] font-bold text-sm md:text-base leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {speaker.name}
                  </p>
                  <p className="text-[#5B6B5F] text-xs">
                    {speaker.role}{speaker.company ? ` · ${speaker.company}` : ""}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* countdown lives under the banner in the right column */}
            <motion.div variants={fadeUp} className="mt-16 w-full">
              <p className="text-[11px] tracking-[0.25em] text-[#8a9c8d] mb-4 uppercase font-semibold text-center md:text-left">
                ⏳ {t("registrationCloses")}
              </p>

              <div
                className="relative rounded-[28px] p-6 md:p-8 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0F2E1C 0%, #16351F 100%)",
                  boxShadow: "0 25px 50px -20px rgba(15,46,28,0.6)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[28px] pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 1.5px rgba(201,162,39,0.55)" }}
                />
                <motion.div
                  aria-hidden="true"
                  className="absolute -top-1/2 -left-1/3 w-2/3 h-[200%] opacity-20 pointer-events-none"
                  style={{ background: "linear-gradient(90deg, transparent, #E8C468, transparent)" }}
                  animate={{ x: ["-20%", "220%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />

                <div className="relative grid grid-cols-4 gap-3 md:gap-4">
                  {countdownBlocks.map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <div className="relative h-12 md:h-14 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={value}
                            initial={{ y: 18, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -18, opacity: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="absolute text-2xl md:text-4xl font-bold text-[#E8C468]"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {String(value).padStart(2, "0")}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <p className="mt-2 text-[9px] md:text-[10px] tracking-[3px] uppercase text-[#B9C7B4] font-medium">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ---------- trust badges (full width, below both columns) ---------- */}
        <motion.div
          variants={fadeUp}
          className="mt-16 flex flex-wrap items-center justify-center gap-3 md:gap-4"
        >
          {trustBadges.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-md border border-white/70 rounded-full px-4 py-2 text-xs md:text-sm font-medium text-[#132A1B] shadow-sm"
            >
              <span className="text-[#245C1F]">✔</span>
              {label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;
