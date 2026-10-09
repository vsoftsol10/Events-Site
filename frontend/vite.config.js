import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { getDeadlineInstant } from "./src/utils/deadline.js";

function localMockApi(deadline) {
  const row = Array(19).fill("");
  Object.assign(row, {
    0: "local-demo-event",
    1: "Tirunelveli Women Entrepreneurs Networking Meetup",
    2: "திருநெல்வேலி பெண்கள் தொழில்முனைவோர் சந்திப்பு",
    3: "Offline",
    4: "2026-10-10",
    5: "4:30 PM to 6:30 PM IST",
    6: "Tirunelveli",
    7: "திருநெல்வேலி",
    8: "30",
    9: "Tirunelveli",
    10: deadline || "2026-10-11",
    11: "Local demo event; no registration data is saved.",
    12: "உள்ளூர் மாதிரி நிகழ்வு; பதிவு விவரங்கள் சேமிக்கப்படாது.",
    13: "[]",
    14: "[]",
    15: "published",
    16: "",
    18: "0",
  });
  return row;
}

function mockApiPlugin(deadline) {
  const currentEvent = localMockApi(deadline);
  return {
    name: "vedacrafts-local-mock-api",
    configureServer(server) {
      server.middlewares.use("/__mock_api__", (req, res, next) => {
        const pathname = (req.url || "").split("?")[0];
        const json = (status, payload) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(payload));
        };

        if (req.method === "GET" && pathname === "/events") return json(200, [currentEvent]);
        if (req.method === "GET" && pathname === "/registrations") return json(200, []);
        if (req.method === "GET" && pathname === "/glimpses") return json(200, []);
        if (req.method === "GET" && /^\/payment-settings\//.test(pathname)) {
          return json(200, { merchantName: "Local Demo", upiId: "demo@upi", qrCodeImage: "" });
        }
        if (req.method === "POST" && pathname === "/add-event") {
          const closeAt = getDeadlineInstant(currentEvent[10]);
          if (currentEvent[15] === "closed" || closeAt == null || Date.now() >= closeAt) {
            return json(403, { error: "REGISTRATION_CLOSED", message: "Registration is closed" });
          }
          return json(200, { success: true, registrationId: "LOCAL-DEMO-ONLY" });
        }
        if (req.method === "PUT" && /^\/events\/[^/]+\/status$/.test(pathname)) {
          return json(200, { success: true });
        }
        if (req.method === "PUT" && /^\/events\/[^/]+\/edit$/.test(pathname)) {
          return json(200, { success: true });
        }
        if (req.method === "POST" && pathname === "/events") return json(200, { success: true });
        next();
      });

    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  const plugins = [react(), tailwindcss()];
  if (env.VITE_USE_MOCK_API === "true") plugins.push(mockApiPlugin(env.VITE_MOCK_DEADLINE));
  return {
    plugins,
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
    },
  };
});
