// require("dotenv").config();
// const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
// const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
// const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
// const WHATSAPP_COUNTRY_CODE = process.env.WHATSAPP_COUNTRY_CODE || "91";
// const COMPANY_WHATSAPP_NUMBER = process.env.COMPANY_WHATSAPP_NUMBER;

// const REGISTRATION_TEMPLATE_NAME =
//   process.env.WHATSAPP_REGISTRATION_TEMPLATE || "registration_confirmation";
// const REGISTRATION_TEMPLATE_LANG =
//   process.env.WHATSAPP_REGISTRATION_TEMPLATE_LANG || "en";

// const COMPANY_ALERT_TEMPLATE_NAME =
//   process.env.WHATSAPP_COMPANY_ALERT_TEMPLATE || "new_registration_alert";
// const COMPANY_ALERT_TEMPLATE_LANG =
//   process.env.WHATSAPP_COMPANY_ALERT_TEMPLATE_LANG || "en";
// const {
//   sendRegistrationWhatsApp,
//   sendCompanyWhatsAppAlert,
// } = require("./config/whatsapp");
// /**
//  * Normalize a raw phone number into the digits-only E.164 form WhatsApp expects
//  * (no "+", no spaces). A bare 10-digit Indian mobile number gets the country
//  * code prefixed; anything already longer is assumed to include a country code.
//  */
// function normalizeToE164(rawPhone, defaultCountryCode = WHATSAPP_COUNTRY_CODE) {
//   if (!rawPhone) return null;

//   let digits = String(rawPhone).replace(/\D/g, "");
//   if (!digits) return null;

//   if (digits.startsWith("00")) digits = digits.slice(2);
//   if (digits.startsWith("0")) digits = digits.slice(1);
//   if (digits.length === 10) digits = `${defaultCountryCode}${digits}`;

//   return digits.length >= 11 ? digits : null;
// }
// function assertConfigured() {
//   if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
//     throw new Error(
//       "WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in the backend .env."
//     );
//   }
// }
// await sendRegistrationWhatsApp({
//   phone: registration.phone,
//   name: registration.name,
//   registrationId: registration._id.toString(),
//   eventName: event.name,
//   eventDate: event.date,
//   eventTime: event.time,
//   eventVenue: event.venue,
// });
// /**
//  * Low-level helper: sends an approved WhatsApp template message.
//  * `parameters` fills the template's {{1}}, {{2}}, ... body placeholders in order.
//  */
// async function sendWhatsAppTemplateMessage({ to, templateName, languageCode = "en", parameters = [] }) {
//   assertConfigured();

//   const toNumber = normalizeToE164(to);
//   if (!toNumber) {
//     throw new Error(`Invalid WhatsApp recipient number: "${to}"`);
//   }

//   const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

//   const payload = {
//     messaging_product: "whatsapp",
//     to: toNumber,
//     type: "template",
//     template: {
//       name: templateName,
//       language: { code: languageCode },
//       components: parameters.length
//         ? [
//             {
//               type: "body",
//               parameters: parameters.map((value) => ({ type: "text", text: String(value ?? "-") })),
//             },
//           ]
//         : [],
//     },
//   };

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   const data = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     const errMessage = data?.error?.message || `WhatsApp API request failed (${response.status})`;
//     const err = new Error(errMessage);
//     err.details = data;
//     throw err;
//   }

//   return data;
// }

// /**
//  * Sends the registration confirmation template to the person who just registered.
//  * Adjust the `parameters` order/count to match your approved template's body variables.
//  */
// const sendRegistrationWhatsApp = async ({
//   phone,
//   name,
//   registrationId,
//   eventName,
//   eventDate,
//   eventTime,
//   eventVenue,
// }) => {
//   return sendWhatsAppTemplateMessage({
//     to: phone,
//     templateName: REGISTRATION_TEMPLATE_NAME,
//     languageCode: REGISTRATION_TEMPLATE_LANG,
//     parameters: [
//       name || "Participant",
//       eventName || "VedaCraft Event",
//       registrationId || "-",
//       eventDate || "-",
//       eventTime || "-",
//       eventVenue || "-",
//     ],
//   });
// };

// /**
//  * Sends a new-registration alert template to the company's own WhatsApp number.
//  */
// const sendCompanyWhatsAppAlert = async ({ name, phone, email, businessName, eventName, registrationId }) => {
//   if (!COMPANY_WHATSAPP_NUMBER) {
//     throw new Error("COMPANY_WHATSAPP_NUMBER is not set in the backend .env.");
//   }
//   return sendWhatsAppTemplateMessage({
//     to: COMPANY_WHATSAPP_NUMBER,
//     templateName: COMPANY_ALERT_TEMPLATE_NAME,
//     languageCode: COMPANY_ALERT_TEMPLATE_LANG,
//     parameters: [
//       name || "-",
//       phone || "-",
//       email || "-",
//       businessName || "-",
//       eventName || "-",
//       registrationId || "-",
//     ],
//   });
// };

// module.exports = {
//   normalizeToE164,
//   sendWhatsAppTemplateMessage,
//   sendRegistrationWhatsApp,
//   sendCompanyWhatsAppAlert,
// };
require("dotenv").config();

const WHATSAPP_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v21.0";
const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_COUNTRY_CODE =
  process.env.WHATSAPP_COUNTRY_CODE || "91";
const COMPANY_WHATSAPP_NUMBER =
  process.env.COMPANY_WHATSAPP_NUMBER;

const REGISTRATION_TEMPLATE_NAME =
  process.env.WHATSAPP_REGISTRATION_TEMPLATE ||
  "registration_confirmation";

const REGISTRATION_TEMPLATE_LANG =
  process.env.WHATSAPP_REGISTRATION_TEMPLATE_LANG ||
  "en_US";

const COMPANY_ALERT_TEMPLATE_NAME =
  process.env.WHATSAPP_COMPANY_ALERT_TEMPLATE ||
  "new_registration_alert";

const COMPANY_ALERT_TEMPLATE_LANG =
  process.env.WHATSAPP_COMPANY_ALERT_TEMPLATE_LANG ||
  "en_US";

function normalizeToE164(
  rawPhone,
  defaultCountryCode = WHATSAPP_COUNTRY_CODE
) {
  if (!rawPhone) return null;

  let digits = String(rawPhone).replace(/\D/g, "");

  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }

  if (digits.length < 11 || digits.length > 15) {
    return null;
  }

  return digits;
}

function assertConfigured() {
  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing.");
  }

  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing.");
  }
}

async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  languageCode,
  parameters = [],
}) {
  assertConfigured();

  const recipient = normalizeToE164(to);

  if (!recipient) {
    throw new Error(`Invalid WhatsApp number: "${to}"`);
  }

  if (!templateName) {
    throw new Error("WhatsApp template name is missing.");
  }

  const url =
    `https://graph.facebook.com/` +
    `${WHATSAPP_API_VERSION}/` +
    `${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode || "en_US",
      },
    },
  };

  if (parameters.length) {
    payload.template.components = [
      {
        type: "body",
        parameters: parameters.map((value) => ({
          type: "text",
          text: String(value ?? "-"),
        })),
      },
    ];
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        `WhatsApp API request failed with status ${response.status}`
    );

    error.details = data;
    throw error;
  }

  return data;
}

async function sendRegistrationWhatsApp({
  phone,
  name,
  registrationId,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
}) {
  return sendWhatsAppTemplateMessage({
    to: phone,
    templateName: REGISTRATION_TEMPLATE_NAME,
    languageCode: REGISTRATION_TEMPLATE_LANG,
    parameters: [
      name || "Participant",
      eventName || "Vedacrafts Community",
      registrationId || "-",
      eventDate || "-",
      eventTime || "-",
      eventVenue || "-",
    ],
  });
}

// async function sendCompanyWhatsAppAlert({
//   name,
//   phone,
//   email,
//   businessName,
//   eventName,
//   registrationId,
// }) {
//   if (!COMPANY_WHATSAPP_NUMBER) {
//     throw new Error("COMPANY_WHATSAPP_NUMBER is missing.");
//   }

//   return sendWhatsAppTemplateMessage({
//     to: COMPANY_WHATSAPP_NUMBER,
//     templateName: COMPANY_ALERT_TEMPLATE_NAME,
//     languageCode: COMPANY_ALERT_TEMPLATE_LANG,
//     parameters: [
//       name || "-",
//       phone || "-",
//       email || "-",
//       businessName || "-",
//       eventName || "-",
//       registrationId || "-",
//     ],
//   });
// }
// ...existing code...

async function sendCompanyWhatsAppAlert({
  name,
  phone,
  email,
  businessName,
  location,
  eventName,
  registrationId,
}) {
  if (!COMPANY_WHATSAPP_NUMBER) {
    throw new Error("COMPANY_WHATSAPP_NUMBER is missing.");
  }

  return sendWhatsAppTemplateMessage({
    to: COMPANY_WHATSAPP_NUMBER,
    templateName: COMPANY_ALERT_TEMPLATE_NAME,
    languageCode: COMPANY_ALERT_TEMPLATE_LANG,
    parameters: [
      name || "-",
      phone || "-",
      email || "-",
      businessName || "-",
      location || "-",
      eventName || "-",
      registrationId || "-",
    ],
  });
}


module.exports = {
  normalizeToE164,
  sendWhatsAppTemplateMessage,
  sendRegistrationWhatsApp,
  sendCompanyWhatsAppAlert,
};
