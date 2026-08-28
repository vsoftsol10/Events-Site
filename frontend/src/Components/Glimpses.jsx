import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { API_URL } from "../config";

function Glimpses() {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [images, isPaused]);

  const fetchImages = async () => {
  try {
    // 1. Get all (non-archived) events
    const eventsRes = await axios.get(`${API_URL}/events`);
    const events = eventsRes.data || [];

    // 2. Keep only published ones — status lives at index 15
    const published = events.filter(
      (row) => (row[15] || "").trim().toLowerCase() === "published"
    );

    if (published.length === 0) {
      setImages([]);
      return;
    }

    // 3. Pick the most recently published/created event — createdAt is index 17
    published.sort(
      (a, b) => new Date(b[17] || 0).getTime() - new Date(a[17] || 0).getTime()
    );
    const latestEventId = published[0][0];

    // 4. Fetch glimpses scoped to that event only
    const res = await axios.get(`${API_URL}/glimpses`, {
      params: { eventId: latestEventId },
    });
    setImages(res.data.map((row) => row[1]));
  } catch (err) {
    console.log(err);
  }
};

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const slideVariants = {
    enter: (dir) => ({
      opacity: 0,
      scale: 1.06,
      x: dir > 0 ? 40 : -40,
    }),
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
    },
    exit: (dir) => ({
      opacity: 0,
      scale: 0.97,
      x: dir > 0 ? -40 : 40,
    }),
  };

  return (
    <section
      id="glimpses"
      className="relative py-20 md:py-32 overflow-hidden bg-[#FCFBF8]"
    >
      {/* AMBIENT BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#E8C468]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#245C1F]/10 blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-4 md:px-6">

        {/* TITLE */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-12 md:mb-20"
        >
          <p className="font-['Manrope'] uppercase tracking-[4px] text-[#C9A227] font-semibold text-xs md:text-sm">
            {t("our")}
          </p>
          <h1 className="font-['Manrope'] text-3xl md:text-5xl font-bold text-[#132A1B] mt-3">
            {t("highlights")}
          </h1>
          <div className="w-14 h-[3px] bg-gradient-to-r from-[#C9A227] to-[#E8C468] mx-auto mt-5 rounded-full" />
          <p className="font-['Inter'] text-[#5B6B5F] mt-4 text-base md:text-lg max-w-xl mx-auto">
            {t("moments")}
          </p>
        </motion.div>

        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="mt-8 md:mt-14 max-w-4xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* FRAME — gold-ringed premium showcase */}
            <div className="relative overflow-hidden rounded-[24px] md:rounded-[36px] shadow-2xl ring-1 ring-[#C9A227]/30 bg-white">

              {/* IMAGE */}
              <div className="relative h-[220px] sm:h-[300px] md:h-[380px] bg-[#132A1B]">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.img
                    key={current}
                    src={images[current]}
                    alt="glimpse"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </AnimatePresence>
              </div>

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F2E1C]/45 via-transparent to-transparent pointer-events-none" />

              {/* CAPTION */}
              <div className="absolute bottom-5 md:bottom-8 left-5 md:left-8 text-white z-10">
                <p className="font-['Manrope'] uppercase tracking-[3px] md:tracking-[4px] text-xs md:text-sm font-medium drop-shadow-sm">
                  {t("vedacraftsMemories")}
                </p>
              </div>

              {/* COUNTER — dark-green-and-gold premium accent block */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 backdrop-blur-md bg-[#0F2E1C]/60 border border-[#E8C468]/40 rounded-full px-3.5 py-1.5 text-[#E8C468] font-['Space_Grotesk'] text-xs md:text-sm font-medium tracking-wide">
                {current + 1} / {images.length}
              </div>

              {/* LEFT ARROW */}
              <button
                onClick={prevSlide}
                aria-label="Previous image"
                className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-12 md:h-12 rounded-full backdrop-blur-md bg-white/25 border border-white/40 text-white shadow-lg hover:bg-white/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center text-sm md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C468]"
              >
                ←
              </button>

              {/* RIGHT ARROW */}
              <button
                onClick={nextSlide}
                aria-label="Next image"
                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-12 md:h-12 rounded-full backdrop-blur-md bg-white/25 border border-white/40 text-white shadow-lg hover:bg-white/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center text-sm md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C468]"
              >
                →
              </button>

            </div>

            {/* DOTS */}
            <div className="flex justify-center gap-2 md:gap-3 mt-7 md:mt-9 flex-wrap">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`transition-all duration-300 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
                    current === index
                      ? "w-8 h-2.5 md:w-10 md:h-3 bg-gradient-to-r from-[#245C1F] to-[#0F2E1C]"
                      : "w-2.5 h-2.5 md:w-3 md:h-3 bg-[#245C1F]/15 hover:bg-[#C9A227]/40"
                  }`}
                />
              ))}
            </div>

          </motion.div>
        )}

      </div>
    </section>
  );
}

export default Glimpses;
