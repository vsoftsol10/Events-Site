import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { API_URL } from "../config";
import ctaBg from "../assets/cta-bg.jpg"; // <-- place your handshake image here

function CTA() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      const rows = res.data;
      if (rows.length > 0) {
        const latest = rows[rows.length - 1];
        setEvent({
          eventId: latest[0],
          seats: latest[8],
          deadline: latest[10],
          status: latest[15],
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

  const closed = isRegistrationClosed();

  return (
    <section className="bg-[#FCFBF8] px-4 md:px-6 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative max-w-3xl mx-auto rounded-2xl md:rounded-[28px] overflow-hidden shadow-xl"
      >
        {/* BACKGROUND IMAGE — blurred + scaled to hide edge softening */}
        <div
          className="absolute inset-0 scale-105"
          style={{
            backgroundImage: `url(${ctaBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* DARK GREEN GRADIENT OVERLAY for legibility + brand tie-in */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c4a1a]/75 via-[#245C1F]/55 to-[#3d2f0f]/60" />
        {/* subtle gold ring + glow, kept minimal */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl md:rounded-[28px] ring-1 ring-inset ring-[#E8C468]/20" />
        <div className="pointer-events-none absolute -top-10 -right-8 w-40 h-40 rounded-full bg-[#E8C468]/10 blur-3xl" />

        {/* CONTENT */}
        <div className="relative py-8 md:py-12 px-6 md:px-9 text-center">

          {/* SEATS BADGE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 backdrop-blur-md bg-white/10 border border-[#E8C468]/40 rounded-full px-3.5 py-1 md:px-4 md:py-1.5 mb-4"
          >
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8C468] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-[#E8C468]" />
            </span>
            <p
              className="text-[11px] md:text-xs font-semibold text-[#F6F2E6]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {i18n.language === "ta"
                ? `இன்னும் ${event?.seats || 0} இடங்கள் மட்டுமே மீதம் உள்ளது`
                : `Only ${event?.seats || 0} seats remaining`}
            </p>
          </motion.div>

          {/* HEADING */}
          <h1
            className="text-xl md:text-3xl font-bold text-white leading-snug max-w-lg mx-auto"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {t("ready")}
          </h1>

          {/* SUBTITLE — presentational placeholder, wire to t() when ready */}
          <p className="mt-2 text-xs md:text-sm text-[#e7ecdf]/85 max-w-sm mx-auto leading-relaxed">
            {i18n.language === "ta"
              ? "இணைந்து புதிய தொடர்புகளை உருவாக்கி, உங்கள் வணிகத்தை அடுத்த கட்டத்திற்கு எடுத்துச் செல்லுங்கள்."
              : "Connect with the right people and take your business to the next level."}
          </p>

          {/* BUTTON */}
          <motion.button
            onClick={() => {
              if (closed) return;
              navigate("/register");
            }}
            disabled={closed}
            whileHover={!closed ? { scale: 1.04 } : {}}
            whileTap={!closed ? { scale: 0.97 } : {}}
            style={{ fontFamily: "'Manrope', sans-serif" }}
            className={`mt-5 md:mt-6 font-semibold px-6 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm tracking-wide transition-shadow ${
              closed
                ? "bg-[#7a1f1f]/70 text-[#F6F2E6]/80 cursor-not-allowed"
                : "bg-gradient-to-r from-[#E8C468] to-[#C9A227] text-[#0F2E1C] cursor-pointer shadow-md shadow-black/25 hover:shadow-lg hover:shadow-[#C9A227]/30"
            }`}
          >
            {closed ? t("registrationClosed") || "Registration closed" : `${t("registertoday")} →`}
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

export default CTA;