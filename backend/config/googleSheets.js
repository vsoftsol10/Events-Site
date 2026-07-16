const { google } = require("googleapis");

const fs = require("fs");
const path = require("path");

const googleCredentials = (() => {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  const credentialPath = path.resolve(__dirname, "../credientials.json");
  if (fs.existsSync(credentialPath)) {
    const credentials = require(credentialPath);
    return {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
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

