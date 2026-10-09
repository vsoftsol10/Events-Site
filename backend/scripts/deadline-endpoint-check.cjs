const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const http = require("node:http");
const { once } = require("node:events");

process.env.PORT = "53179";
process.env.GOOGLE_CLIENT_EMAIL = "mock@example.invalid";
process.env.GOOGLE_PRIVATE_KEY = "mock-private-key";
process.env.GOOGLE_SHEET_ID = "mock-sheet-id";
process.env.CLOUDINARY_CLOUD_NAME = "mock";
process.env.CLOUDINARY_API_KEY = "mock";
process.env.CLOUDINARY_API_SECRET = "mock";

let eventRows = [];
let appendedRows = [];
let appendCalls = [];
let paymentSettingsReads = 0;
let cloudinaryCalls = 0;
const sheets = {
  spreadsheets: {
    values: {
      async get({ range }) {
        if (String(range).startsWith("PaymentSettings!")) paymentSettingsReads++;
        if (String(range).startsWith("Registrations!")) return { data: { values: [] } };
        return { data: { values: eventRows } };
      },
      async update({ range, requestBody }) {
        const match = /Events!A(\d+):S\d+/.exec(range);
        if (match) eventRows[Number(match[1]) - 1] = requestBody.values[0];
        return { data: {} };
      },
      async append({ range, requestBody }) {
        appendCalls.push({ range, row: requestBody.values[0] });
        if (range === "Events!A:S") appendedRows.push(requestBody.values[0]);
        return { data: {} };
      },
    },
    async get() { return { data: { sheets: [] } }; },
  },
};

const fakeMail = new Proxy({}, { get: () => async () => { paymentSettingsReads++; } });
const fakeWhatsapp = new Proxy({}, { get: () => async () => { paymentSettingsReads++; } });
const fakeCloudinary = { uploader: { upload_stream() { cloudinaryCalls++; throw new Error("unexpected mocked upload"); } } };
const indexPath = path.resolve(__dirname, "../index.js");
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (parent?.filename === indexPath) {
    if (request === "dotenv") return { config() {} };
    if (request === "./config/googleSheets") return { sheets, spreadsheetId: "mock-sheet-id" };
    if (request === "./config/cloudinary") return fakeCloudinary;
    if (request === "./config/mail") return fakeMail;
    if (request === "./config/whatsapp") return fakeWhatsapp;
  }
  return originalLoad.call(this, request, parent, isMain);
};

let server;
const originalListen = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) {
  server = this;
  return originalListen.apply(this, args);
};
require(indexPath);
http.Server.prototype.listen = originalListen;

const baseUrl = `http://127.0.0.1:${process.env.PORT}`;
const event = (deadline, status = "published") => {
  const row = Array(19).fill("");
  row[0] = "event-1";
  row[8] = "5";
  row[10] = deadline;
  row[15] = status;
  return row;
};
const registrationForm = () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    eventId: "event-1", name: "Mock User", phone: "9876543210",
    email: "mock@example.invalid", businessName: "Mock Business",
    category: "Other", businessLocation: "Tirunelveli", upiReference: "ABCDEF123456",
  })) form.append(key, value);
  return form;
};
const eventForm = (deadline, eventId = "event-1") => {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    eventId, titleEn: "Mock Event", titleTa: "மாதிரி நிகழ்வு", type: "Offline",
    date: "2026-10-10", time: "16:30", venueEn: "Mock Venue", venueTa: "மாதிரி இடம்",
    seats: "5", district: "Tirunelveli", deadline, descriptionEn: "", descriptionTa: "",
    speakersdetailsEn: "[]", speakersdetailsTa: "[]", status: "published", registrationFee: "0",
  })) form.append(key, value);
  return form;
};

async function postForm(url, form, method = "POST") {
  return fetch(`${baseUrl}${url}`, { method, body: form });
}

(async () => {
  await once(server, "listening");
  try {
    for (const [label, deadline] of [["passed", "2020-01-01"], ["empty", ""], ["invalid", "2026-13-45"]]) {
      eventRows = [event(deadline)];
      appendedRows = [];
      appendCalls = [];
      const beforeUploads = cloudinaryCalls;
      const response = await postForm("/add-event", registrationForm());
      assert.equal(response.status, 403, `${label} deadline status`);
      assert.deepEqual(await response.json(), { error: "REGISTRATION_CLOSED", message: "Registration is closed" });
      assert.equal(appendedRows.length, 0, `${label}: no registration/event append`);
      assert.equal(appendCalls.length, 0, `${label}: no rows appended to any Sheet`);
      assert.equal(cloudinaryCalls, beforeUploads, `${label}: no Cloudinary/file upload`);
      assert.equal(paymentSettingsReads, 0, `${label}: no payment or messaging integrations`);
    }
    eventRows = [event("2999-10-11", "closed")];
    const closedResponse = await postForm("/add-event", registrationForm());
    assert.equal(closedResponse.status, 403, "closed event status");

    eventRows = [event("2999-10-11")];
    const futureResponse = await postForm("/add-event", registrationForm());
    assert.equal(futureResponse.status, 400, "future deadline proceeds to expected missing screenshot validation");
    assert.notEqual((await futureResponse.json()).error, "REGISTRATION_CLOSED");

    eventRows = [];
    appendedRows = [];
    let response = await postForm("/events", eventForm("2026-10-11", "new-event"));
    assert.equal(response.status, 200, "create event valid date-only deadline");
    assert.equal(appendedRows[0][10], "2026-10-11T23:59:59+05:30");
    response = await postForm("/events", eventForm("2026-13-45", "bad-event"));
    assert.equal(response.status, 400, "create event invalid deadline");

    eventRows = [event("2026-10-11", "published")];
    const updateForm = eventForm("2026-10-11T18:30", "event-1");
    response = await postForm("/events/event-1/edit", updateForm, "PUT");
    assert.equal(response.status, 200, "update event valid IST datetime");
    assert.equal(eventRows[0][10], "2026-10-11T18:30:00+05:30");
    response = await postForm("/events/event-1/edit", eventForm("2026-13-45"), "PUT");
    assert.equal(response.status, 400, "update event invalid deadline");

    process.stdout.write("PASS mocked POST /add-event and event create/update endpoint checks\n");
  } finally {
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  if (server?.listening) server.close();
});
