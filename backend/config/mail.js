const fs = require("fs");
const path = require("path");
const { BrevoClient } = require("@getbrevo/brevo");

const client = process.env.BREVO_API_KEY
  ? new BrevoClient({ apiKey: process.env.BREVO_API_KEY })
  : null;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const SUPPORT_CONTACT = "9095422237";
const WEBSITE_URL = "https://vedacraftscommunity.in/";

const verifyTransporter = async () => {
  if (!client) {
    throw new Error("Brevo client not initialized. Check BREVO_API_KEY.");
  }

  const emailFrom = (process.env.EMAIL_FROM || process.env.EMAIL_USER || "").trim();
  if (!emailFrom) {
    throw new Error("Sender email is missing. Set EMAIL_FROM or EMAIL_USER to a verified Brevo sender address.");
  }

  const lower = emailFrom.toLowerCase();
  const placeholderIndicators = [
    "yourdomain",
    "yourverifieddomain",
    "example.com",
    "example.org",
    "localhost",
  ];

  if (placeholderIndicators.some((p) => lower.includes(p))) {
    throw new Error(
      `Sender email ("${emailFrom}") looks like a placeholder. Set EMAIL_FROM to a real email you control and verify it in Brevo.`
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailFrom)) {
    throw new Error(`EMAIL_FROM ("${emailFrom}") is not a valid email address.`);
  }

  return { brevoClient: client, emailFrom };
};

const sendRegistrationEmail = async ({
  to,
  name,
  registrationId,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
  registrationFee,
  phone,
  eventBanner,
  paymentStatus = "Pending Verification",
}) => {
  if (!to || typeof to !== "string" || !to.trim()) {
    throw new Error("Recipient email is missing or invalid.");
  }

  const { brevoClient, emailFrom } = await verifyTransporter();
  const logoPath = path.resolve(__dirname, "../../frontend/src/assets/logo.png");
  const posterPath = path.resolve(__dirname, "../../frontend/src/assets/poster.png");
  const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString("base64") : "";
  const posterBase64 = fs.existsSync(posterPath) ? fs.readFileSync(posterPath).toString("base64") : "";
  const safeName = escapeHtml(name || "Participant");
  const safeEventName = escapeHtml(eventName || "VedaCraft Event");

  const rows = [
    ["Registration ID", registrationId],
    ["Participant Name", name],
    ["Event Name", eventName],
    ["Date", eventDate],
    ["Time", eventTime],
    ["Venue", eventVenue],
    ["Registration Fee", registrationFee ? `Rs. ${String(registrationFee).replace(/^rs\.?\s*/i, "")}` : ""],
    ["Payment Status", paymentStatus],
    ["Contact Number", SUPPORT_CONTACT],
    ["Website", WEBSITE_URL],
  ];

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Confirmation</title>
  </head>
  <body style="margin:0;background:#f6f8ed;font-family:Arial,'Segoe UI',sans-serif;color:#24311f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8ed;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4ebd2;box-shadow:0 18px 44px rgba(36,92,31,.13);">
            <tr>
              <td style="background:#245c1f;padding:24px 28px;text-align:center;">
                ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" width="150" alt="VedaCraft" style="display:block;margin:0 auto 14px;max-width:150px;height:auto;">` : ""}
                <div style="display:inline-block;background:#ffbe2a;color:#173914;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;border-radius:999px;padding:8px 13px;">Registration Confirmation</div>
                <h1 style="margin:18px 0 0;color:#ffffff;font-size:26px;line-height:1.25;">${safeEventName}</h1>
              </td>
            </tr>
            <tr>
              <td>
                ${
                  eventBanner
                    ? `<img src="${escapeHtml(eventBanner)}" alt="${safeEventName}" style="display:block;width:100%;max-height:280px;object-fit:cover;">`
                    : posterBase64
                      ? `<img src="data:image/png;base64,${posterBase64}" alt="${safeEventName}" style="display:block;width:100%;max-height:280px;object-fit:cover;">`
                      : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:28px 30px 8px;">
                <p style="margin:0 0 12px;font-size:16px;line-height:1.65;">Dear <strong>${safeName}</strong>,</p>
                <p style="margin:0;font-size:16px;line-height:1.65;">Thank you for registering with VedaCraft. Your registration has been received successfully. Please keep your Registration ID handy for check-in.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e7edd7;border-radius:12px;overflow:hidden;">
                  ${rows.map(([label, value], index) => `
                    <tr style="background:${index % 2 === 0 ? "#fbfdf6" : "#ffffff"};">
                      <td style="padding:13px 16px;border-bottom:1px solid #eef2e3;color:#62705a;font-size:13px;width:42%;">${escapeHtml(label)}</td>
                      <td style="padding:13px 16px;border-bottom:1px solid #eef2e3;color:#245c1f;font-size:14px;font-weight:700;">${escapeHtml(value || "-")}</td>
                    </tr>`).join("")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 28px;">
                <div style="background:#fff8df;border:1px solid #ffe59a;border-radius:12px;padding:16px 18px;color:#5f4700;font-size:14px;line-height:1.65;">
                  We look forward to welcoming you. Please arrive a little early and bring this email or your Registration ID.
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#245c1f;padding:22px 30px;text-align:center;color:#dfead6;font-size:13px;line-height:1.7;">
                <strong style="color:#ffbe2a;">Thank you, Team VedaCraft</strong><br>
                Contact: ${SUPPORT_CONTACT} | Website: ${WEBSITE_URL}<br>
                This is an automated confirmation email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Dear ${name || "Participant"},

Your registration has been received successfully.

Registration ID: ${registrationId || "-"}
Participant Name: ${name || "-"}
Event Name: ${eventName || "-"}
Date: ${eventDate || "-"}
Time: ${eventTime || "-"}
Venue: ${eventVenue || "-"}
Registration Fee: ${registrationFee || "-"}
Payment Status: ${paymentStatus}
Contact Number: ${SUPPORT_CONTACT}
Website: ${WEBSITE_URL}

Thank you,
Team VedaCraft`;

  await brevoClient.transactionalEmails.sendTransacEmail({
    sender: { email: emailFrom, name: "VedaCraft" },
    to: [{ email: to.trim(), name: name || "Participant" }],
    subject: `Registration Confirmed - ${eventName || "VedaCraft Event"}`,
    htmlContent: html,
    textContent: text,
    headers: {
      "X-Mailin-Tag": "event-registration",
    },
  });
};

const sendPaymentVerifiedEmail = async ({
  to,
  name,
  registrationId,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
  registrationFee,
  paymentStatus = "Verified",
}) => {
  if (!to || typeof to !== "string" || !to.trim()) {
    throw new Error("Recipient email is missing or invalid.");
  }

  const { brevoClient, emailFrom } = await verifyTransporter();
  const rows = [
    ["Registration ID", registrationId],
    ["Participant Name", name],
    ["Event Name", eventName],
    ["Venue", eventVenue],
    ["Date", eventDate],
    ["Time", eventTime],
    ["Registration Fee", registrationFee ? `Rs. ${String(registrationFee).replace(/^rs\.?\s*/i, "")}` : ""],
    ["Payment Status", paymentStatus],
  ];

  const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#f6f8ed;font-family:Arial,'Segoe UI',sans-serif;color:#24311f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8ed;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #e4ebd2;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#245c1f;color:#ffffff;padding:24px 28px;">
            <h1 style="margin:0;font-size:24px;">Payment Verified</h1>
            <p style="margin:10px 0 0;line-height:1.6;">Your registration is confirmed.</p>
          </td></tr>
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 16px;line-height:1.6;">Dear <strong>${escapeHtml(name || "Participant")}</strong>, your payment has been verified by the admin team. Thank you for registering with VedaCraft.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e7edd7;border-radius:10px;overflow:hidden;">
              ${rows.map(([label, value], index) => `
                <tr style="background:${index % 2 === 0 ? "#fbfdf6" : "#ffffff"};">
                  <td style="padding:12px 14px;border-bottom:1px solid #eef2e3;color:#62705a;font-size:13px;width:42%;">${escapeHtml(label)}</td>
                  <td style="padding:12px 14px;border-bottom:1px solid #eef2e3;color:#245c1f;font-size:14px;font-weight:700;">${escapeHtml(value || "-")}</td>
                </tr>`).join("")}
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `Payment Verified – Registration Confirmed

Registration ID: ${registrationId || "-"}
Participant Name: ${name || "-"}
Event Name: ${eventName || "-"}
Venue: ${eventVenue || "-"}
Date: ${eventDate || "-"}
Time: ${eventTime || "-"}
Registration Fee: ${registrationFee || "-"}
Payment Status: ${paymentStatus}`;

  await brevoClient.transactionalEmails.sendTransacEmail({
    sender: { email: emailFrom, name: "VedaCraft" },
    to: [{ email: to.trim(), name: name || "Participant" }],
    subject: "Payment Verified – Registration Confirmed",
    htmlContent: html,
    textContent: text,
    headers: {
      "X-Mailin-Tag": "payment-verified",
    },
  });
};

const sendPaymentRejectedEmail = async ({
  to,
  name,
  registrationId,
  eventName,
  reason,
  supportContact,
}) => {
  if (!to || typeof to !== "string" || !to.trim()) {
    throw new Error("Recipient email is missing or invalid.");
  }

  const { brevoClient, emailFrom } = await verifyTransporter();
  const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#fff7f7;font-family:Arial,'Segoe UI',sans-serif;color:#3b1f1f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f7;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #f1d4d4;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#9f1d1d;color:#ffffff;padding:24px 28px;">
            <h1 style="margin:0;font-size:24px;">Payment Verification Failed</h1>
          </td></tr>
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 16px;line-height:1.6;">Dear <strong>${escapeHtml(name || "Participant")}</strong>, we could not verify your payment for ${escapeHtml(eventName || "the event")}.</p>
            <p style="margin:0 0 10px;color:#7f1d1d;font-weight:700;">Reason</p>
            <div style="border:1px solid #f1d4d4;background:#fff7f7;border-radius:10px;padding:14px 16px;line-height:1.6;">${escapeHtml(reason || "-")}</div>
            <p style="margin:18px 0 0;line-height:1.6;"><strong>Registration ID:</strong> ${escapeHtml(registrationId || "-")}</p>
            <p style="margin:8px 0 0;line-height:1.6;"><strong>Support Contact:</strong> ${escapeHtml(supportContact || "-")}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `Payment Verification Failed

Registration ID: ${registrationId || "-"}
Event Name: ${eventName || "-"}
Reason: ${reason || "-"}
Support Contact: ${supportContact || "-"}`;

  await brevoClient.transactionalEmails.sendTransacEmail({
    sender: { email: emailFrom, name: "VedaCraft" },
    to: [{ email: to.trim(), name: name || "Participant" }],
    subject: "Payment Verification Failed",
    htmlContent: html,
    textContent: text,
    headers: {
      "X-Mailin-Tag": "payment-rejected",
    },
  });
};

const sendCompanyRegistrationAlert = async ({
  name,
  phone,
  email,
  businessName,
  category,
  designation,
  businessLocation,
  registrationId,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
  registrationFee,
}) => {
  const companyEmail = (
    process.env.COMPANY_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.EMAIL_USER ||
    ""
  ).trim();

  if (!companyEmail) {
    throw new Error("Company alert recipient is missing. Set COMPANY_EMAIL, ADMIN_EMAIL, or EMAIL_USER.");
  }

  const { brevoClient, emailFrom } = await verifyTransporter();
  const rows = [
    ["Registration ID", registrationId],
    ["Participant Name", name],
    ["Phone", phone],
    ["Email", email],
    ["Business Name", businessName],
    ["Category", category],
    ["Designation", designation],
    ["Business Location", businessLocation],
    ["Event Name", eventName],
    ["Date", eventDate],
    ["Time", eventTime],
    ["Venue", eventVenue],
    ["Registration Fee", registrationFee ? `Rs. ${String(registrationFee).replace(/^rs\.?\s*/i, "")}` : ""],
  ];

  const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#f6f8ed;font-family:Arial,'Segoe UI',sans-serif;color:#24311f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8ed;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #e4ebd2;border-radius:14px;overflow:hidden;">
          <tr><td style="background:#245c1f;color:#ffffff;padding:22px 26px;">
            <h1 style="margin:0;font-size:22px;">New Event Registration</h1>
            <p style="margin:8px 0 0;line-height:1.5;">${escapeHtml(eventName || "VedaCraft Event")}</p>
          </td></tr>
          <tr><td style="padding:22px 26px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e7edd7;border-radius:10px;overflow:hidden;">
              ${rows.map(([label, value], index) => `
                <tr style="background:${index % 2 === 0 ? "#fbfdf6" : "#ffffff"};">
                  <td style="padding:11px 14px;border-bottom:1px solid #eef2e3;color:#62705a;font-size:13px;width:42%;">${escapeHtml(label)}</td>
                  <td style="padding:11px 14px;border-bottom:1px solid #eef2e3;color:#245c1f;font-size:14px;font-weight:700;">${escapeHtml(value || "-")}</td>
                </tr>`).join("")}
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `New Event Registration

${rows.map(([label, value]) => `${label}: ${value || "-"}`).join("\n")}`;

  await brevoClient.transactionalEmails.sendTransacEmail({
    sender: { email: emailFrom, name: process.env.EMAIL_FROM_NAME || "VedaCraft" },
    to: [{ email: companyEmail, name: "VedaCraft Admin" }],
    subject: `New Registration - ${eventName || registrationId || "VedaCraft Event"}`,
    htmlContent: html,
    textContent: text,
    headers: {
      "X-Mailin-Tag": "company-registration-alert",
    },
  });
};

module.exports = {
  verifyTransporter,
  sendRegistrationEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
  sendCompanyRegistrationAlert,
};

