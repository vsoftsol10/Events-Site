const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require("dotenv").config();

const bcrypt = require("bcrypt");

const express = require("express");
const cors = require("cors");
const { sheets, spreadsheetId } = require("./config/googleSheets");

const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("./config/cloudinary");
const { sendRegistrationEmail } = require("./config/mail");

// ─── MAKE SURE THIS EXACT BLOCK IS HERE ──────────────────────────────────────
const { Resend } = require("resend");

let otpStore = {};

// const resendApiKey = process.env.RESEND_API_KEY || process.env.BREVO_API_KEY;
// let resend;

// if (resendApiKey) {
//   resend = new Resend(resendApiKey);
// } else {
//   console.warn(
//     "Warning: Missing Resend API key. Set RESEND_API_KEY in backend/.env or provide BREVO_API_KEY as fallback. Email features will be disabled."
//   );
// }
// ──────────────────────────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const paymentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("Image must be a JPG or PNG file"));
  },
});

let cachedEvents = null;
let lastFetchTime = 0;

const PAYMENT_SETTINGS_RANGE = "PaymentSettings!A:E";

const buildUpiPaymentQrCodeUrl = ({ upiId, merchantName, registrationFee }) => {
  if (!upiId || !merchantName || !registrationFee) return "";
  const amount = String(registrationFee).replace(/[^\d.]/g, "");
  if (!amount) return "";
  const upiUrl = new URL("upi://pay");
  upiUrl.searchParams.set("pa", upiId);
  upiUrl.searchParams.set("pn", merchantName);
  upiUrl.searchParams.set("am", amount);
  upiUrl.searchParams.set("cu", "INR");
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiUrl.toString())}`;
};

const ensurePaymentSettingsSheet = async () => {
  try {
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "PaymentSettings!A1:E1",
    });
  } catch (err) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "PaymentSettings" } } }],
      },
    }).catch(() => {});

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "PaymentSettings!A1:E1",
      valueInputOption: "RAW",
      requestBody: {
        values: [["Event ID", "UPI ID", "QR Code Image", "Merchant Name", "Registration Fee"]],
      },
    });
  }
};

const getPaymentSettings = async (eventId = "DEFAULT") => {
  await ensurePaymentSettingsSheet();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: PAYMENT_SETTINGS_RANGE,
  });
  const rows = response.data.values || [];
  const normalizedEventId = (eventId || "DEFAULT").trim();
  const row =
    rows.find((item) => (item[0] || "").trim() === normalizedEventId) ||
    rows.find((item) => (item[0] || "").trim() === "DEFAULT") ||
    [];

  return {
    eventId: row[0] || normalizedEventId,
    upiId: row[1] || "",
    qrCodeImage: buildUpiPaymentQrCodeUrl({
      upiId: row[1] || "",
      merchantName: row[3] || "",
      registrationFee: row[4] || "0",
    }) || row[2] || "",
    merchantName: row[3] || "",
    registrationFee: row[4] || "0",
  };
};

const uploadBufferToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

const generateRegistrationId = async () => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Registrations!A:U",
  });
  const rows = response.data.values || [];
  const existingIds = rows
    .slice(1)
    .map((row) => row[14])
    .filter(Boolean);
  const nextNumber = existingIds.length + 1;
  return `TDBDS2026-${String(nextNumber).padStart(6, "0")}`;
};

const getEventRowById = async (eventId) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Events!A:Q",
  });
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((row) => (row[0] || "").trim() === (eventId || "").trim());
  if (rowIndex === -1) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }
  return { rows, row: rows[rowIndex], rowIndex, sheetRow: rowIndex + 1 };
};

const assertEventSeatsAvailable = async (eventId) => {
  const { row } = await getEventRowById(eventId);
  const availableSeats = Number.parseInt(row[8] || "0", 10);
  if (!Number.isFinite(availableSeats) || availableSeats <= 0) {
    const err = new Error("No Seats Available");
    err.statusCode = 400;
    throw err;
  }
};

const decrementEventSeat = async (eventId) => {
  const { row, sheetRow } = await getEventRowById(eventId);
  const availableSeats = Number.parseInt(row[8] || "0", 10);
  if (!Number.isFinite(availableSeats) || availableSeats <= 0) {
    const err = new Error("No Seats Available");
    err.statusCode = 400;
    throw err;
  }

  const updatedRow = [...row];
  updatedRow[8] = String(Math.max(0, availableSeats - 1));
  if (Number(updatedRow[8]) === 0) updatedRow[15] = "closed";
  while (updatedRow.length < 17) updatedRow.push("");

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Events!A${sheetRow}:Q${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [updatedRow] },
  });

  cachedEvents = null;
  lastFetchTime = 0;
  return Number(updatedRow[8]);
};

// ─── PUT /events/:id/status ───────────────────────────────────────────────────
app.put("/events/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("STATUS UPDATE:", id, "→", status);

    const rows = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Events!A:Q",
    });

    const data = rows.data.values || [];

    const rowIndex = data.findIndex(
      (row) => (row[0] || "").trim() === (id || "").trim()
    );

    if (rowIndex === -1) {
      console.log("EVENT NOT FOUND:", id);
      return res.status(404).json({ error: "Event not found" });
    }

    const sheetRow = rowIndex + 1;

    console.log("rowIndex:", rowIndex, "→ writing to sheet row:", sheetRow);

    const existingRow = [...data[rowIndex]];
    existingRow[15] = status;

    while (existingRow.length < 17) existingRow.push("");

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Events!A${sheetRow}:Q${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [existingRow] },
    });

    console.log("STATUS UPDATED SUCCESSFULLY on sheet row", sheetRow);

    cachedEvents = null;
    lastFetchTime = 0;

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// ─── PUT /events/:id/edit ─────────────────────────────────────────────────────
app.put(
  "/events/:id/edit",
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "speakerImages", maxCount: 20 },
    { name: "glimpses", maxCount: 30 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const rows = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Events!A:Q",
      });
      const data = rows.data.values || [];

      const rowIndex = data.findIndex(
        (row) => (row[0] || "").trim() === (id || "").trim()
      );

      if (rowIndex === -1) {
        return res.status(404).json({ message: "Event not found" });
      }

      const sheetRow = rowIndex + 1;

      const {
        titleEn, titleTa, type, date, time,
        venueEn, venueTa, seats, district, deadline,
        descriptionEn, descriptionTa,
        speakersdetailsEn, speakersdetailsTa,
        status,
      } = req.body;

      // ── Banner upload ──────────────────────────────────────────────────────
      let bannerUrl = data[rowIndex][16] || "";
      if (req.files?.banner?.[0]) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "vedacraft-events" },
            (error, result) => { if (error) reject(error); else resolve(result); }
          );
          streamifier.createReadStream(req.files.banner[0].buffer).pipe(stream);
        });
        bannerUrl = result.secure_url;
      }

      // ── Speaker image uploads ──────────────────────────────────────────────
      const speakerImageUrls = [];
      if (req.files?.speakerImages) {
        for (const file of req.files.speakerImages) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "vedacraft-speakers" },
              (error, result) => { if (error) reject(error); else resolve(result); }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          speakerImageUrls.push(result.secure_url);
        }
      }

      // ── Glimpse uploads ────────────────────────────────────────────────────
      const glimpseUrls = [];
      if (req.files?.glimpses) {
        for (const file of req.files.glimpses) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "vedacraft-glimpses" },
              (error, result) => { if (error) reject(error); else resolve(result); }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          glimpseUrls.push(result.secure_url);
        }
      }

      // ── Parse & merge speaker details ──────────────────────────────────────
      // Parse English speaker details (contains nameEn, designationEn, bioEn)
      const parsedSpeakersEn = JSON.parse(speakersdetailsEn || "[]");

      // Parse Tamil speaker details (contains nameTa, designationTa, bioTa)
      const parsedSpeakersTa = JSON.parse(speakersdetailsTa || "[]");

      // Merge Tamil fields into the English objects & assign uploaded images
      parsedSpeakersEn.forEach((speaker, index) => {
        // Assign uploaded image if available
        if (speakerImageUrls[index]) {
          speaker.image = speakerImageUrls[index];
        } else if (data[rowIndex][13]) {
          // Keep existing image from sheet if no new image uploaded
          try {
            const existing = JSON.parse(data[rowIndex][13] || "[]");
            if (existing[index]?.image) speaker.image = existing[index].image;
          } catch (_) {}
        }

        // Merge Tamil fields
        if (parsedSpeakersTa[index]) {
          speaker.nameTa        = parsedSpeakersTa[index].nameTa        || "";
          speaker.designationTa = parsedSpeakersTa[index].designationTa || "";
          speaker.bioTa         = parsedSpeakersTa[index].bioTa         || "";
        }
      });

      for (const url of glimpseUrls) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Glimpses!A:B",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[id, url]] },
        });
      }

      // ── Write to sheet ─────────────────────────────────────────────────────
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Events!A${sheetRow}:Q${sheetRow}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            id,
            titleEn,
            titleTa,
            type,
            date,
            time,
            venueEn,
            venueTa,
            seats,
            district,
            deadline,
            descriptionEn,
            descriptionTa,
            JSON.stringify(parsedSpeakersEn),   // col 13 (index 13): Speakers details_En — merged object with both EN + TA fields
            JSON.stringify(parsedSpeakersTa),   // col 14 (index 14): Speakers details_Ta — Tamil-only fields for reference
            status || data[rowIndex][15],
            bannerUrl,
          ]],
        },
      });

      cachedEvents = null;
      lastFetchTime = 0;

      res.json({ success: true });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
);

// ─── POST /events ─────────────────────────────────────────────────────────────
app.post(
  "/events",
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "speakerImages", maxCount: 20 },
    { name: "glimpses", maxCount: 30 },
  ]),
  async (req, res) => {
    try {
      const {
        eventId, titleEn, titleTa, type, date, time,
        venueEn, venueTa, seats, district, deadline,
        descriptionEn, descriptionTa,
        speakersdetailsEn, speakersdetailsTa,
        status,
      } = req.body;

      // ── Duplicate check FIRST — before any uploads ─────────────────────────
      const rows = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Events!A:Q",
      });
      const data = rows.data.values || [];
      const exists = data.find(
        (row) => (row[0] || "").trim() === (eventId || "").trim()
      );
      if (exists) {
        return res.status(400).json({ error: "Event already exists" });
      }

      // ── Banner upload ──────────────────────────────────────────────────────
      let bannerUrl = "";
      if (req.files?.banner?.[0]) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "vedacraft-events" },
            (error, result) => { if (error) reject(error); else resolve(result); }
          );
          streamifier.createReadStream(req.files.banner[0].buffer).pipe(stream);
        });
        bannerUrl = result.secure_url;
      }

      // ── Speaker image uploads ──────────────────────────────────────────────
      const speakerImageUrls = [];
      if (req.files?.speakerImages) {
        for (const file of req.files.speakerImages) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "vedacraft-speakers" },
              (error, result) => { if (error) reject(error); else resolve(result); }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          speakerImageUrls.push(result.secure_url);
        }
      }

      // ── Parse & merge speaker details ──────────────────────────────────────
      // Parse English speaker details (contains nameEn, designationEn, bioEn)
      const parsedSpeakersEn = JSON.parse(speakersdetailsEn || "[]");

      // Parse Tamil speaker details (contains nameTa, designationTa, bioTa)
      const parsedSpeakersTa = JSON.parse(speakersdetailsTa || "[]");

      // Merge Tamil fields into the English objects & assign uploaded images
      parsedSpeakersEn.forEach((speaker, index) => {
        // Assign uploaded image
        if (speakerImageUrls[index]) speaker.image = speakerImageUrls[index];

        // Merge Tamil fields
        if (parsedSpeakersTa[index]) {
          speaker.nameTa        = parsedSpeakersTa[index].nameTa        || "";
          speaker.designationTa = parsedSpeakersTa[index].designationTa || "";
          speaker.bioTa         = parsedSpeakersTa[index].bioTa         || "";
        }
      });

      // ── Glimpse uploads ────────────────────────────────────────────────────
      const glimpseUrls = [];
      if (req.files?.glimpses) {
        for (const file of req.files.glimpses) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "vedacraft-glimpses" },
              (error, result) => { if (error) reject(error); else resolve(result); }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          glimpseUrls.push(result.secure_url);
        }
      }

      for (const url of glimpseUrls) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Glimpses!A:B",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[eventId, url]] },
        });
      }

      // ── Write to sheet ─────────────────────────────────────────────────────
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Events!A:Q",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            eventId,
            titleEn,
            titleTa,
            type,
            date,
            time,
            venueEn,
            venueTa,
            seats,
            district,
            deadline,
            descriptionEn,
            descriptionTa,
            JSON.stringify(parsedSpeakersEn),   // col 13 (index 13): Speakers details_En — merged object with both EN + TA fields
            JSON.stringify(parsedSpeakersTa),   // col 14 (index 14): Speakers details_Ta — Tamil-only fields for reference
            status,
            bannerUrl,
          ]],
        },
      });

      cachedEvents = null;
      lastFetchTime = 0;

      res.send("Event saved successfully");
    } catch (err) {
      console.log(err);
      res.status(500).send("Error saving event");
    }
  }
);

// ─── GET /events ──────────────────────────────────────────────────────────────
app.get("/events", async (req, res) => {
  try {
    const now = Date.now();
    const bustCache = !!req.query.t;

    if (!bustCache && cachedEvents && now - lastFetchTime < 10000) {
      return res.json(cachedEvents);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Events!A2:Q",
    });

    const rows = response.data.values || [];

    cachedEvents = rows;
    lastFetchTime = now;

    res.json(rows);
  } catch (err) {
    console.error("GET /events failed:", err.message || err);
    if (cachedEvents) {
      return res.json(cachedEvents);
    }
    res.json([]);
  }
});

// ─── POST /add-event (registration) ──────────────────────────────────────────
app.post("/add-event", paymentUpload.single("paymentScreenshot"), async (req, res) => {
  const {
    name, phone, email, businessName, category, designation,
    businessLocation, yearsInBusiness, employees, website,
    heardAbout, whyAttend, upiReference, eventId, eventTitle,
    eventDate, eventTime, eventVenue,
  } = req.body;

  try {
    if (!name || !phone || !email || !businessName || !category || !designation ||
        !businessLocation || !yearsInBusiness || !heardAbout || !whyAttend) {
      return res.status(400).json({ error: "Missing required registration details" });
    }
    if (!upiReference || upiReference.length < 10 || upiReference.length > 30) {
      return res.status(400).json({ error: "UPI reference number must be 10 to 30 characters" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Payment screenshot is required" });
    }

    await assertEventSeatsAvailable(eventId);

    const paymentSettings = await getPaymentSettings(eventId);
    const registrationId = await generateRegistrationId();
    const screenshot = await uploadBufferToCloudinary(req.file, "event-payment-screenshots");
    const screenshotUrl = screenshot.secure_url;
    let emailStatus = "Not Sent";

    if (!email || typeof email !== "string" || !email.trim()) {
      console.warn("Registration email recipient missing; marking email status as Failed.");
      emailStatus = "Failed";
    } else {
      try {
        await sendRegistrationEmail({
          to: email.trim(),
          name,
          registrationId,
          eventName: eventTitle || "",
          eventDate: eventDate || "",
          eventTime: eventTime || "",
          eventVenue: eventVenue || "",
          registrationFee: paymentSettings.registrationFee || "",
          phone,
        });
        emailStatus = "Sent";
      } catch (emailError) {
        console.error("Registration email failed:", emailError);
        emailStatus = "Failed";
      }
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Registrations!A:U",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          eventId, eventTitle, name, phone, email,
          businessLocation, businessName, designation, category,
          yearsInBusiness, heardAbout, whyAttend, employees || "",
          website || "", registrationId, upiReference, screenshotUrl,
          emailStatus, paymentSettings.registrationFee,
          paymentSettings.merchantName, new Date().toISOString(),
        ]],
      },
    });

    await decrementEventSeat(eventId);

    return res.status(200).json({
      success: true,
      message: "Registration successful",
      registrationId,
      emailStatus,
    });
  } catch (err) {
    console.error("Complete registration workflow crash:", err);
    return res.status(err.statusCode || 500).json({ error: err.message || "Registration Failed" });
  }
});

app.post("/add-event-legacy", async (req, res) => {
  const {
    name, phone, email, district, businessName,
    designation, category, stage, lookingFor, eventId, eventTitle,
  } = req.body;

  try {
    // 1. Append data to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Registrations!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          eventId, eventTitle, name, phone, email,
          district, businessName, designation, category,
          stage, lookingFor?.join(",") || "",
        ]],
      },
    });

    // 2. Send Email Notification via Resend
    if (!resend) {
      console.warn("Resend client unavailable: registration email not sent.");
    } else {
      try {
        await resend.emails.send({
          from: '"Vedacrafts Official (vedacraftsofficial@gmail.com)" <onboarding@resend.dev>',
          to: email,
          subject: "VedaCrafts Registration Successful",
          html: `
            <h2>Registration Confirmed 🎉</h2>
            <p>Hello ${name},</p>
            <p>Your registration has been confirmed.</p>
            <hr/>
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>District:</strong> ${district}</p>
            <br/>
            <p>Thank you for registering with VedaCrafts.</p>
            <p>Team VedaCrafts</p>
          `,
        });
        console.log("✅ Registration email sent successfully via Resend API");
      } catch (emailError) {
        console.error("❌ Failed to send registration email:", emailError);
        // We don't block the frontend even if the email delivery fails
      }
    }

    // ✅ FIXED: Explicitly send a response back so the frontend pops up the success message!
    return res.status(200).json({ success: true, message: "Registration successful" });

  } catch (err) {
    console.error("❌ Complete registration workflow crash:", err);
    return res.status(500).json({ error: "Registration Failed" });
  }
});


// ─── GET /registrations ───────────────────────────────────────────────────────
app.get("/registrations", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Registrations!A:U",
    });
    res.json(response.data.values || []);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// ─── GET /glimpses ────────────────────────────────────────────────────────────
app.get("/glimpses", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Glimpses!A2:B",
    });
    res.json(response.data.values || []);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch glimpses" });
  }
});

app.get("/payment-settings/:eventId", async (req, res) => {
  try {
    const settings = await getPaymentSettings(req.params.eventId);
    res.json(settings);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch payment settings" });
  }
});

app.put("/payment-settings/:eventId", paymentUpload.single("qrCodeImage"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { upiId, qrCodeImage, existingQrCodeImage, merchantName, registrationFee } = req.body;
    await ensurePaymentSettingsSheet();

    const uploadedQrCode = req.file
      ? await uploadBufferToCloudinary(req.file, "event-payment-qr-codes")
      : null;
    const savedQrCodeImage = uploadedQrCode?.secure_url || qrCodeImage || existingQrCodeImage || "";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: PAYMENT_SETTINGS_RANGE,
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => (row[0] || "").trim() === eventId);
    const values = [[
      eventId,
      upiId || "",
      savedQrCodeImage,
      merchantName || "",
      registrationFee || "0",
    ]];

    if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: PAYMENT_SETTINGS_RANGE,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
    } else {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `PaymentSettings!A${rowIndex + 1}:E${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values },
      });
    }

    res.json({ success: true, qrCodeImage: savedQrCodeImage });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || "Failed to save payment settings" });
  }
});
// ADMIN/SETTINGS
app.get("/admin/settings", async (req, res) => {
  try {
    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "AdminSettings!A2:D2",
      });

    const row =
      response.data.values?.[0] || [];

    res.json({
      fullName: row[0] || "",
      email: row[1] || "",
      phone: row[2] || "",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.put("/admin/settings", async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;

    // 1. Save settings
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "AdminSettings!A2:D2",
      valueInputOption: "RAW",
      requestBody: {
        values: [[fullName, email, phone ]],
      },
    });

    // 2. ALSO update AdminAuth email
    const auth = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "AdminAuth!A2:B2",
    });

    const row = auth.data.values?.[0] || [];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "AdminAuth!A2:B2",
      valueInputOption: "RAW",
      requestBody: {
        values: [[email, row[1]]], // keep same password
      },
    });

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

app.put("/admin/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "AdminAuth!A2:B2",
    });

    const row = response.data.values?.[0] || [];

    // 🔥 ADD THESE HERE
    console.log("CURRENT:", currentPassword);
    console.log("HASH:", row[1]);

    const isMatch = await bcrypt.compare(currentPassword, row[1]);

    if (!isMatch) {
      return res.status(400).json({
        error: "Current password incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "AdminAuth!A2:B2",
      valueInputOption: "RAW",
      requestBody: {
        values: [[row[0], hashedPassword]],
      },
    });

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
app.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "AdminAuth!A2:B2",
      });

    const row =
      response.data.values?.[0] || [];

    const savedEmail = row[0];
    const savedPassword = row[1];

    const isMatch =
      await bcrypt.compare(
        password,
        savedPassword
      );

    if (
      email === savedEmail &&
      isMatch
    ) {
      return res.json({
        success: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// app.get("/generate-password", async (req, res) => {

//   const hash = await bcrypt.hash(
//     "SmartVarun@9095",
//     10
//   );

//   res.send(hash);

// });

// ─── REPLACE WITH THIS ────────────────────────────────────────────────────────
app.post("/admin/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Verify if email exists in Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "AdminAuth!A2:B2",
    });

    const row = response.data.values?.[0] || [];
    const savedEmail = row[0];

    if (email !== savedEmail) {
      return res.status(400).json({ error: "Email not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    if (!resend) {
      console.warn("Resend client unavailable: OTP email not sent.");
      return res.status(200).json({
        success: true,
        warning: "OTP generation succeeded, but email delivery is disabled.",
      });
    }

    // Send using official Resend SDK over secure port 443
    await resend.emails.send({
      from: '"Vedacrafts Official (vedacraftsofficial@gmail.com)" <onboarding@resend.dev>',
      to: email,
      subject: "Admin Password Reset OTP",
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `,
    });

    console.log("✅ OTP email sent successfully via Resend API");

    // ⚠️ THIS CRITICAL LINE UNFREEZES YOUR FRONTEND AND OPENS THE OTP INPUTS!
    return res.status(200).json({ success: true, message: "OTP sent successfully" });

  } catch (emailError) {
    console.error("❌ Failed to send OTP email:", emailError);
    return res.status(500).json({ error: "Failed to send OTP email" });
  }
});

app.post("/admin/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ error: "OTP not requested" });
    }

    if (Date.now() > record.expires) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (record.otp != otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (!email || !otp || !newPassword) {
  return res.status(400).json({ error: "Missing fields" });
}

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "AdminAuth!A2:B2",
    });

    const row = response.data.values?.[0] || [];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "AdminAuth!A2:B2",
      valueInputOption: "RAW",
      requestBody: {
        values: [[row[0], hashedPassword]],
      },
    });

    delete otpStore[email];

    res.json({ success: true, message: "Password reset successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Reset failed" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
