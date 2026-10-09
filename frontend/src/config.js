export const API_URL = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
  ? "/__mock_api__"
  : import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
      ? "http://localhost:5000"
      : "https://events-site-ov46.onrender.com");
