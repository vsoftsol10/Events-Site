import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { API_URL } from "../config";
import { isRegistrationOpen } from "../utils/deadline";

function StickyRegisterBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [visible, setVisible] = useState(true);
  const [now, setNow] = useState(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    fetchEvent();
  }, []);

  useEffect(() => {
    const initialUpdate = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(initialUpdate);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const goingDown = currentY > lastScrollY.current;
      const scrolledEnough = Math.abs(currentY - lastScrollY.current) > 6;

      if (scrolledEnough) {
        setVisible(!(goingDown && currentY > 120));
        lastScrollY.current = currentY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      const rows = res.data;
      if (rows.length > 0) {
        const latest = rows[rows.length - 1];
        setEvent({
          eventId: latest[0],
          date: latest[4],
          seats: latest[8],
          deadline: latest[10],
          status: latest[15],
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const closed = now == null || !isRegistrationOpen(event, now);

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-3 md:mx-4 mb-3 md:mb-4 pointer-events-auto"
          >
            <div className="rounded-3xl md:rounded-[2rem] backdrop-blur-xl bg-white/25 border border-white/40 shadow-2xl overflow-hidden">
              {/* WARM TINT LAYER — keeps the brand color while staying glassy */}
              <div className="bg-gradient-to-r from-[#ffbe2a]/70 via-[#f3ae1e]/60 to-[#ffbe2a]/70">
                <div className="max-w-7xl mx-auto px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between gap-3">

                  {/* LEFT SIDE */}
                  <div className="flex items-center gap-3 md:gap-5 min-w-0">

                    {/* DATE */}
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/70 font-bold">
                        {t("date")}
                      </p>
                      <h3 className="text-xs md:text-sm font-semibold text-black truncate">
                        {event?.date
                          ? new Date(event.date).toLocaleDateString("en-GB").replace(/\//g, "-")
                          : "Coming soon"}
                      </h3>
                    </div>

                    <div className="hidden sm:block w-px h-8 bg-black/15 shrink-0" />

                    {/* SEATS — hidden on very small screens */}
                    <div className="hidden sm:block min-w-0">
                      <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/70 font-bold">
                        {t("seats") || "Seats"}
                      </p>
                      <h3 className="text-xs md:text-sm font-semibold text-black">
                        {event?.seats != null ? `${event.seats} ${t("left") || "left"}` : t("limit")}
                      </h3>
                    </div>

                  </div>

                  {/* REGISTER BUTTON */}
                  <motion.button
                    onClick={() => {
                      if (closed) return;
                      navigate("/register");
                    }}
                    disabled={closed}
                    whileHover={!closed ? { scale: 1.05 } : {}}
                    whileTap={!closed ? { scale: 0.95 } : {}}
                    animate={
                      !closed
                        ? {
                            boxShadow: [
                              "0 0 0 0 rgba(36,92,31,0.5)",
                              "0 0 0 10px rgba(36,92,31,0)",
                            ],
                          }
                        : {}
                    }
                    transition={
                      !closed
                        ? { duration: 1.6, repeat: Infinity, ease: "easeOut" }
                        : { duration: 0.2 }
                    }
                    className={`shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-xs md:text-sm whitespace-nowrap ${
                      closed
                        ? "bg-[#7a1f1f] text-white/90 cursor-not-allowed"
                        : "bg-[#245c1f] text-white cursor-pointer hover:bg-[#1c4818]"
                    }`}
                  >
                    {closed ? t("registrationClosed") : `${t("registerNow")} →`}
                  </motion.button>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StickyRegisterBar;
