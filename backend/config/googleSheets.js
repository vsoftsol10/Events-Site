const { google } = require("googleapis");

const fs = require("fs");
const path = require("path");

const normalizePrivateKey = (value) =>
  (value || "")
    .replace(/\\r/g, "")
    .replace(/\\n/g, "\n")
    .trim();

const googleCredentials = (() => {
  const envClientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const envPrivateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (envClientEmail && envPrivateKey) {
    return {
      client_email: envClientEmail,
      private_key: envPrivateKey,
    };
  }

  const credentialPath = path.resolve(__dirname, "../credientials.json");
  if (fs.existsSync(credentialPath)) {
    const credentials = require(credentialPath);
    return {
      client_email: credentials.client_email || envClientEmail,
      private_key: normalizePrivateKey(credentials.private_key || envPrivateKey),
    };
  }

  throw new Error(
    "Missing Google Sheets credentials. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY, or provide backend/credientials.json."
  );
})();

const auth = new google.auth.GoogleAuth({
  credentials: googleCredentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

const spreadsheetId = process.env.GOOGLE_SHEET_ID;

module.exports = { sheets, spreadsheetId };

