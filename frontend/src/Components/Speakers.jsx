// /**
//  * Speakers.jsx — Premium 2026 redesign
//  * ---------------------------------------------------------------
//  * Same design system as Hero.jsx: forest green #0F2E1C / #245C1F,
//  * gold #C9A227 / #E8C468, cream background, Manrope for headings,
//  * Inter for body, Space Grotesk for small accents.
//  *
//  * NOTHING in the data/animation layer changed: fetchSpeakers(),
//  * both useEffect hooks (fetch + auto-rotate interval), the
//  * AnimatePresence carousel transition, the single-speaker
//  * pulse/float animation, i18next, and the dot navigation are all
//  * the same as before. Only markup and styling were rebuilt.
//  * ---------------------------------------------------------------
//  */

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useTranslation } from "react-i18next";
// import { motion, AnimatePresence } from "framer-motion";

// import { API_URL } from "../config";

// function Speakers() {
//   const { t, i18n } = useTranslation();

//   const [speakers, setSpeakers] = useState([]);
//   const [currentSpeaker, setCurrentSpeaker] = useState(0);

//   useEffect(() => {
//     fetchSpeakers();
//   }, []);

//   useEffect(() => {
//     if (speakers.length <= 1) return;

//     const interval = setInterval(() => {
//       setCurrentSpeaker((prev) => (prev + 1) % speakers.length);
//     }, 4000);

//     return () => clearInterval(interval);
//   }, [speakers]);

//   const fetchSpeakers = async () => {
//     try {
//       const res = await axios.get(`${API_URL}/events`);
//       const rows = res.data;
//       const latest = rows[rows.length - 1];
//       const speakerData = JSON.parse(latest[13] || "[]");
//       setSpeakers(speakerData);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const isTa = i18n.language === "ta";

//   return (
//     <section
//       id="speakers"
//       className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden"
//       style={{
//         fontFamily: "'Inter', sans-serif",
//         background: "linear-gradient(180deg, #F6F2E6 0%, #FBF8F0 50%, #EFF4EA 100%)",
//       }}
//     >
//       {/* ---------- decorative background layer (matches Hero) ---------- */}
//       <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
//         <div
//           className="absolute inset-0 opacity-[0.3]"
//           style={{
//             backgroundImage: "radial-gradient(#C9A227 0.7px, transparent 0.7px)",
//             backgroundSize: "22px 22px",
//             maskImage: "radial-gradient(ellipse 80% 50% at 50% 10%, black 15%, transparent 70%)",
//           }}
//         />
//         <div
//           className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-40"
//           style={{ background: "radial-gradient(circle, #F0D98C 0%, transparent 70%)" }}
//         />
//         <div
//           className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30"
//           style={{ background: "radial-gradient(circle, #DCEBD8 0%, transparent 70%)" }}
//         />
//       </div>

//       <div
//         className={`relative mx-auto ${
//           speakers.length === 1 ? "max-w-4xl" : "max-w-5xl"
//         }`}
//       >
//         {/* ---------- heading ---------- */}
//         <motion.div
//           initial={{ opacity: 0, y: 24 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true, amount: 0.4 }}
//           transition={{ duration: 0.7, ease: "easeOut" }}
//           className="text-center"
//         >
//           <p
//             className="uppercase tracking-[0.25em] text-[#C9A227] font-semibold text-xs md:text-sm"
//             style={{ fontFamily: "'Space Grotesk', sans-serif" }}
//           >
//             {t("our")}
//           </p>
//           <h2
//             className="text-3xl md:text-5xl font-extrabold text-[#245C1F] mt-3"
//             style={{ fontFamily: "'Manrope', sans-serif" }}
//           >
//             {t("meetourspeakers")}
//           </h2>
//           <div
//             className="w-16 h-[3px] mx-auto mt-5 rounded-full"
//             style={{ background: "linear-gradient(90deg, #245C1F, #E8C468)" }}
//           />
//           <p className="mt-4 text-base md:text-lg text-[#5B6B5F]">
//             {t("experts")}
//           </p>
//         </motion.div>

//         <div className="mt-10 md:mt-16">
//           {speakers.length > 0 && (
//             <>
//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={currentSpeaker}
//                   initial={{ opacity: 0, scale: 0.94, y: 40 }}
//                   animate={{ opacity: 1, scale: 1, y: 0 }}
//                   exit={{ opacity: 0, scale: 1.03, y: -20 }}
//                   transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
//                   className="relative bg-white rounded-[28px] md:rounded-[36px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(15,46,28,0.3)] ring-1 ring-[#132A1B]/5"
//                 >
//                   {/* gold hairline top edge */}
//                   <div
//                     aria-hidden="true"
//                     className="absolute top-0 left-0 right-0 h-[3px]"
//                     style={{ background: "linear-gradient(90deg, #245C1F, #E8C468, #245C1F)" }}
//                   />

//                   {/* CARD GRID — stacks on mobile, side by side on md+ */}
//                   <div className="grid grid-cols-1 md:grid-cols-2">

//                     {/* IMAGE — shown first on mobile */}
//                     <div className="relative flex items-center justify-center p-6 md:p-10 order-first md:order-last overflow-hidden bg-[#0F2E1C]">
//                       {/* decorative texture + glow behind image, matches hero countdown */}
//                       <div
//                         aria-hidden="true"
//                         className="pointer-events-none absolute inset-0 opacity-40"
//                         style={{
//                           backgroundImage: "radial-gradient(#E8C468 0.6px, transparent 0.6px)",
//                           backgroundSize: "16px 16px",
//                         }}
//                       />
//                       <div
//                         aria-hidden="true"
//                         className="pointer-events-none absolute w-44 h-44 md:w-64 md:h-64 rounded-full blur-3xl opacity-50"
//                         style={{ background: "radial-gradient(circle, #E8C468 0%, transparent 70%)" }}
//                       />

//                       <motion.img
//                         src={speakers[currentSpeaker].image}
//                         alt={speakers[currentSpeaker].nameEn}
//                         initial={{ scale: 0.95 }}
//                         animate={{
//                           scale: speakers.length === 1 ? [1, 1.025, 1] : 1,
//                         }}
//                         transition={{
//                           duration: speakers.length === 1 ? 7 : 0.6,
//                           repeat: speakers.length === 1 ? Infinity : 0,
//                           ease: "easeInOut",
//                         }}
//                         className={`
//                           relative w-full object-cover rounded-2xl md:rounded-3xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-[#E8C468]/40
//                           ${
//                             speakers.length === 1
//                               ? "h-[220px] md:h-[320px]"
//                               : "h-[200px] md:h-[260px]"
//                           }
//                         `}
//                       />
//                     </div>

//                     {/* LEFT CONTENT */}
//                     <div className="p-6 md:p-12 flex flex-col justify-center order-last md:order-first">
//                       <div
//                         className="text-6xl md:text-8xl leading-none relative -top-2 md:-top-3"
//                         style={{ fontFamily: "'Manrope', sans-serif", color: "#E8C468" }}
//                       >
//                         &ldquo;
//                       </div>
//                       <p className="text-[#4b3f35] text-base md:text-lg leading-relaxed -mt-4 md:-mt-6">
//                         {isTa
//                           ? speakers[currentSpeaker].bioTa
//                           : speakers[currentSpeaker].bioEn}
//                       </p>
//                     </div>

//                   </div>

//                   {/* FOOTER */}
//                   <div
//                     className="relative py-5 md:py-8 px-4 md:px-6 text-center border-t border-[#132A1B]/10"
//                     style={{ background: "linear-gradient(180deg, #FBF8F0 0%, #F6F2E6 100%)" }}
//                   >
//                     <h3
//                       className="text-xl md:text-2xl font-extrabold text-[#132A1B] tracking-tight"
//                       style={{ fontFamily: "'Manrope', sans-serif" }}
//                     >
//                       {isTa
//                         ? speakers[currentSpeaker].nameTa
//                         : speakers[currentSpeaker].nameEn}
//                     </h3>
//                     <div
//                       className="w-10 h-[2px] mx-auto mt-2 rounded-full"
//                       style={{ background: "linear-gradient(90deg, #245C1F, #E8C468)" }}
//                     />
//                     <p className="mt-2 text-sm md:text-base text-[#5B6B5F] font-medium">
//                       {isTa
//                         ? speakers[currentSpeaker].designationTa
//                         : speakers[currentSpeaker].designationEn}
//                     </p>
//                   </div>
//                 </motion.div>
//               </AnimatePresence>

//               {/* DOTS */}
//               {speakers.length > 1 && (
//                 <div className="flex justify-center gap-3 mt-6 md:mt-8">
//                   {speakers.map((_, index) => (
//                     <button
//                       key={index}
//                       onClick={() => setCurrentSpeaker(index)}
//                       aria-label={`View speaker ${index + 1}`}
//                       className={`h-2.5 md:h-3 rounded-full transition-all duration-300 ${
//                         currentSpeaker === index
//                           ? "w-9 md:w-10"
//                           : "w-2.5 md:w-3 bg-[#132A1B]/15 hover:bg-[#245C1F]/40"
//                       }`}
//                       style={
//                         currentSpeaker === index
//                           ? { background: "linear-gradient(90deg, #245C1F, #E8C468)" }
//                           : undefined
//                       }
//                     />
//                   ))}
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// }

// export default Speakers;
/**
 * Speakers.jsx — Premium 2026 redesign
 * ---------------------------------------------------------------
 * Same design system as Hero.jsx: forest green #0F2E1C / #245C1F,
 * gold #C9A227 / #E8C468, cream background, Manrope for headings,
 * Inter for body, Space Grotesk for small accents.
 *
 * NOTHING in the data/animation layer changed: fetchSpeakers(),
 * both useEffect hooks (fetch + auto-rotate interval), the
 * AnimatePresence carousel transition, the single-speaker
 * pulse/float animation, i18next, and the dot navigation are all
 * the same as before. Only markup and styling were rebuilt.
 * ---------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { API_URL } from "../config";

function Speakers() {
  const { t, i18n } = useTranslation();

  const [speakers, setSpeakers] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);

  useEffect(() => {
    fetchSpeakers();
  }, []);

  useEffect(() => {
    if (speakers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSpeaker((prev) => (prev + 1) % speakers.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [speakers]);

  const fetchSpeakers = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      const rows = res.data;
      const latest = rows[rows.length - 1];
      const speakerData = JSON.parse(latest[13] || "[]");
      setSpeakers(speakerData);
    } catch (err) {
      console.log(err);
    }
  };

  const isTa = i18n.language === "ta";

  return (
    <section
      id="speakers"
      className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden bg-[#FCFBF8]"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ---------- decorative background layer (matches Hero) ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: "radial-gradient(#C9A227 0.7px, transparent 0.7px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 80% 50% at 50% 10%, black 15%, transparent 70%)",
          }}
        />
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, #F0D98C 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #DCEBD8 0%, transparent 70%)" }}
        />
      </div>

      <div
        className={`relative mx-auto ${
          speakers.length === 1 ? "max-w-4xl" : "max-w-5xl"
        }`}
      >
        {/* ---------- heading ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center"
        >
          <p
            className="uppercase tracking-[0.25em] text-[#C9A227] font-semibold text-xs md:text-sm"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {t("our")}
          </p>
          <h2
            className="font-['Manrope'] text-3xl md:text-4xl lg:text-5xl font-bold text-[#245C1F] mt-3"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {t("meetourspeakers")}
          </h2>
          <div
            className="w-16 h-[3px] mx-auto mt-5 rounded-full"
            style={{ background: "linear-gradient(90deg, #245C1F, #E8C468)" }}
          />
          <p className="mt-4 text-base md:text-lg text-[#5B6B5F]">
            {t("experts")}
          </p>
        </motion.div>

        <div className="mt-10 md:mt-16">
          {speakers.length > 0 && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSpeaker}
                  initial={{ opacity: 0, scale: 0.94, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.03, y: -20 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative bg-white rounded-[28px] md:rounded-[36px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(15,46,28,0.3)] ring-1 ring-[#132A1B]/5"
                >
                  {/* gold hairline top edge */}
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{ background: "linear-gradient(90deg, #245C1F, #E8C468, #245C1F)" }}
                  />

                  {/* CARD GRID — stacks on mobile, side by side on md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-2">

                    {/* IMAGE — shown first on mobile, fills the full space */}
                    <div className="relative order-first md:order-last overflow-hidden">
                      <motion.img
                        src={speakers[currentSpeaker].image}
                        alt={speakers[currentSpeaker].nameEn}
                        initial={{ scale: 0.95 }}
                        animate={{
                          scale: speakers.length === 1 ? [1, 1.025, 1] : 1,
                        }}
                        transition={{
                          duration: speakers.length === 1 ? 7 : 0.6,
                          repeat: speakers.length === 1 ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                        className={`
                          w-full h-full object-cover
                          ${
                            speakers.length === 1
                              ? "min-h-[280px] md:min-h-[420px]"
                              : "min-h-[240px] md:min-h-[360px]"
                          }
                        `}
                      />
                    </div>

                    {/* LEFT CONTENT */}
                    <div className="p-6 md:p-12 flex flex-col justify-center order-last md:order-first">
                      <div
                        className="text-6xl md:text-8xl leading-none relative -top-2 md:-top-3"
                        style={{ fontFamily: "'Manrope', sans-serif", color: "#E8C468" }}
                      >
                        &ldquo;
                      </div>
                      <p className="text-[#4b3f35] text-base md:text-lg leading-relaxed -mt-4 md:-mt-6">
                        {isTa
                          ? speakers[currentSpeaker].bioTa
                          : speakers[currentSpeaker].bioEn}
                      </p>
                    </div>

                  </div>

                  {/* FOOTER */}
                  <div
                    className="relative py-5 md:py-8 px-4 md:px-6 text-center border-t border-[#132A1B]/10"
                    style={{ background: "linear-gradient(180deg, #FBF8F0 0%, #F6F2E6 100%)" }}
                  >
                    <h3
                      className="text-xl md:text-2xl font-extrabold text-[#132A1B] tracking-tight"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {isTa
                        ? speakers[currentSpeaker].nameTa
                        : speakers[currentSpeaker].nameEn}
                    </h3>
                    <div
                      className="w-10 h-[2px] mx-auto mt-2 rounded-full"
                      style={{ background: "linear-gradient(90deg, #245C1F, #E8C468)" }}
                    />
                    <p className="mt-2 text-sm md:text-base text-[#5B6B5F] font-medium">
                      {isTa
                        ? speakers[currentSpeaker].designationTa
                        : speakers[currentSpeaker].designationEn}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* DOTS */}
              {speakers.length > 1 && (
                <div className="flex justify-center gap-3 mt-6 md:mt-8">
                  {speakers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSpeaker(index)}
                      aria-label={`View speaker ${index + 1}`}
                      className={`h-2.5 md:h-3 rounded-full transition-all duration-300 ${
                        currentSpeaker === index
                          ? "w-9 md:w-10"
                          : "w-2.5 md:w-3 bg-[#132A1B]/15 hover:bg-[#245C1F]/40"
                      }`}
                      style={
                        currentSpeaker === index
                          ? { background: "linear-gradient(90deg, #245C1F, #E8C468)" }
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Speakers;