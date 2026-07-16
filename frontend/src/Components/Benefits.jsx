import {
  ShoppingCart,
  Users,
  Award,
  GraduationCap,
  Megaphone,
  Leaf,
} from "lucide-react";
import { motion } from "framer-motion";

import { useTranslation } from "react-i18next";

const CARDS = [
  { icon: ShoppingCart, titleKey: "vision1", descKey: "visionDesc1" },
  { icon: Users, titleKey: "vision2", descKey: "visionDesc2" },
  { icon: Award, titleKey: "vision3", descKey: "visionDesc3" },
  { icon: GraduationCap, titleKey: "vision4", descKey: "visionDesc4" },
  { icon: Megaphone, titleKey: "vision5", descKey: "visionDesc5" },
  { icon: Leaf, titleKey: "vision6", descKey: "visionDesc6" },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.94, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

function Benefits() {
  const { t } = useTranslation();

  return (
    <section
      id="benefits"
      className="relative bg-[#FCFBF8] py-16 md:py-28 px-4 md:px-8 overflow-hidden"
    >
      {/* AMBIENT BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full bg-[#245C1F]/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#245C1F]/8 blur-3xl" />

      <div className="relative max-w-7xl mx-auto">

        {/* HEADING */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center"
        >
          <p className="font-['Manrope'] uppercase tracking-[4px] text-[#C9A227] font-semibold text-xs md:text-sm">
            {t("our")}
          </p>
          <h1 className="font-['Manrope'] text-3xl md:text-4xl lg:text-5xl font-bold text-[#132A1B] mt-3">
            {t("whyVedacrafts")}
          </h1>
          <div className="w-14 h-[3px] bg-[#245C1F] mx-auto mt-5 rounded-full" />
          <p className="mt-6 text-[#245C1F] text-xl md:text-2xl italic font-['Manrope'] font-medium">
            "{t("exclusive")}"
          </p>
          <p className="font-['Inter'] max-w-4xl mx-auto mt-5 md:mt-8 text-[#5B6B5F] leading-relaxed text-base md:text-lg">
            {t("aboutVedacrafts")}
          </p>
        </motion.div>

        {/* CARDS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 mt-10 md:mt-20"
        >
          {CARDS.map(({ icon: Icon, titleKey, descKey }) => (
            <motion.div
              key={titleKey}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="group relative bg-white rounded-[24px] md:rounded-[30px] p-6 md:p-8 border border-[#dce8d5] shadow-sm hover:shadow-xl hover:border-[#245C1F]/40 overflow-hidden transition-[border-color,box-shadow] duration-300"
            >
              {/* SOFT TINT WASH — fades in from bottom on hover */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#245C1F]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* TOP ACCENT LINE — reveals on hover */}
              <div className="absolute top-0 left-0 h-[3px] w-0 group-hover:w-full bg-[#245C1F] transition-all duration-500 ease-out" />

              <div className="relative flex items-start gap-4 md:gap-5">

                {/* ICON */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#245C1F] text-white flex items-center justify-center shrink-0 group-hover:bg-[#0F2E1C] group-hover:scale-105 transition-all duration-300">
                  <Icon size={28} className="md:hidden" strokeWidth={1.8} />
                  <Icon size={32} className="hidden md:block" strokeWidth={1.8} />
                </div>

                {/* CONTENT */}
                <div>
                  <h2 className="font-['Manrope'] text-xl md:text-2xl font-bold text-[#132A1B] transition-colors duration-300 group-hover:text-[#245C1F]">
                    {t(titleKey)}
                  </h2>
                  <p className="font-['Inter'] mt-2 md:mt-3 text-[#5B6B5F] text-sm md:text-base leading-relaxed">
                    {t(descKey)}
                  </p>
                </div>

              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

export default Benefits;
