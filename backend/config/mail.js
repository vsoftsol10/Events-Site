const path = require("path");
const nodemailer = require("nodemailer");

const mailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === "true" || process.env.EMAIL_SECURE === "1" || Number(process.env.EMAIL_PORT || 587) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
};

const transporter = mailConfig.auth.user && mailConfig.auth.pass
  ? nodemailer.createTransport(mailConfig)
  : null;

const verifyTransporter = async () => {
  if (!transporter) {
    throw new Error(
      "Email transporter not initialized. Check EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM."
    );
  }

  await transporter.verify();
  return transporter;
};

const sendRegistrationEmail = async ({ to, name, registrationId, eventName, eventDate, eventTime, eventVenue, registrationFee, phone }) => {
  if (!to || typeof to !== "string" || !to.trim()) {
    throw new Error("Recipient email is missing or invalid.");
  }

  const transporterInstance = await verifyTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || mailConfig.auth.user,
    to: to.trim(),
    subject: "Registration Confirmed – Tirunelveli Business Digital Summit 2026",
    html: `
      <p>Dear ${name || "Participant"},</p>
      <p>Thank you for registering for the Tirunelveli Business Digital Summit 2026.</p>
      <p>Your registration has been confirmed successfully.</p>
      <p><strong>Registration ID:</strong> ${registrationId || ""}</p>
      <p><strong>Event:</strong> ${eventName || ""}</p>
      <p><strong>Date:</strong> ${eventDate || ""}</p>
      <p><strong>Time:</strong> ${eventTime || ""}</p>
      <p><strong>Venue Details:</strong> ${eventVenue || ""}</p>
      <p><strong>Registration Fee:</strong> ${registrationFee || ""}</p>
      <p><strong>Phone:</strong> ${phone || ""}</p>
      <p>Please arrive 15 minutes before the session.</p>
      <p>Kindly carry this email or your Registration ID during check-in.</p>
      <p>We look forward to welcoming you.</p>
      <p>Regards,<br/>Vsoft Solutions</p>
    `,
    text: `Dear ${name || "Participant"},\n\nThank you for registering for the Tirunelveli Business Digital Summit 2026.\nYour registration has been confirmed successfully.\n\nRegistration ID: ${registrationId || ""}\nEvent: ${eventName || ""}\nDate: ${eventDate || ""}\nTime: ${eventTime || ""}\nVenue Details: ${eventVenue || ""}\nRegistration Fee: ${registrationFee || ""}\nPhone: ${phone || ""}\n\nPlease arrive 15 minutes before the session.\nKindly carry this email or your Registration ID during check-in.\n\nRegards,\nVsoft Solutions`,
    attachments: [
      {
        filename: "poster.png",
        path: path.resolve(__dirname, "../../frontend/src/assets/poster.png"),
        cid: "posterImage",
      },
    ],
  };

  return transporterInstance.sendMail(mailOptions);
};

module.exports = {
  transporter,
  verifyTransporter,
  sendRegistrationEmail,
};