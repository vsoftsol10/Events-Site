import footerBg from "../assets/fo1.jpg";
import { useTranslation } from "react-i18next";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { MapPin, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

function Footer() {
  const { t } = useTranslation();

  const socialIcons = [FaFacebookF, FaInstagram, FaLinkedinIn];

  const quickLinks = [
    { label: t("event"), id: "events" },
    { label: t("program"), id: "glimpses" },
    { label: t("benefits"), id: "benefits" },
    { label: t("speakers"), id: "speakers" },
  ];

  return (
    <footer className="relative mt-0">
      <div
        className="relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${footerBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F2E1C]/85 via-[#0F2E1C]/80 to-[#0a1f13]/90" />
        <div className="pointer-events-none absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#E8C468]/70 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
          >
            <div>
              <h2
                className="text-lg md:text-xl font-bold text-[#E8C468]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {t("vedacrafts")}
              </h2>
              <p className="mt-2 md:mt-3 text-[#FBF8F0]/85 text-xs md:text-sm leading-relaxed">
                {t("empowering")}
              </p>
            </div>

            <div>
              <h3
                className="text-sm md:text-base font-bold text-white mb-2.5 md:mb-3.5"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {t("quick")}
              </h3>
              <ul className="space-y-1.5 md:space-y-2 text-[#FBF8F0]/85 text-xs md:text-sm">
                {quickLinks.map(function (link) {
                  return (
                    <li key={link.id}>
                      <button
                        onClick={() =>
                          document
                            .getElementById(link.id)
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="group inline-flex items-center gap-1.5 hover:text-[#E8C468] transition-colors duration-200"
                      >
                        <span className="w-0 group-hover:w-3 h-[1.5px] bg-[#E8C468] transition-all duration-200" />
                        {link.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <h3
                className="text-sm md:text-base font-bold text-white mb-2.5 md:mb-3.5"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {t("contact")}
              </h3>
              <div className="space-y-1.5 md:space-y-2 text-[#FBF8F0]/85 text-xs md:text-sm">
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="text-[#E8C468] shrink-0 mt-0.5" />
                  {t("vsoft")}
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={15} className="text-[#E8C468] shrink-0" />
                  vsoftsolutions@gmail.com
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={15} className="text-[#E8C468] shrink-0" />
                  +91 98765 43210
                </p>
              </div>
            </div>
          </motion.div>

          <div className="border-t border-white/15 mt-6 md:mt-8 pt-4 md:pt-5 pb-4 md:pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[#FBF8F0]/70 text-[11px] md:text-xs text-center sm:text-left tracking-wide">
                &copy; 2026 {t("vedacrafts")}. {t("allRightsReserved") || "All rights reserved."}
              </p>

              <div className="flex gap-2.5 md:gap-3">
                {socialIcons.map(function (Icon, i) {
                  return (
                    
                      <a key={i}
                      href="#"
                      aria-label="Social link"
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 border border-[#E8C468]/30 flex items-center justify-center text-[#FBF8F0] hover:bg-[#E8C468] hover:text-[#0F2E1C] hover:border-[#E8C468] hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <Icon size={14} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;