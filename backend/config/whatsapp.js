// ─── Meta WhatsApp Cloud API integration ─────────────────────────────────────
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
//
// IMPORTANT: WhatsApp only allows a business to *start* a conversation with a
// template message that has already been approved in Meta Business Manager.
// Free-form text only works if the recipient messaged your business number
// first, within the last 24 hours. So both the "registration confirmation"
// message (to the participant) and the "new registration alert" (to your own
// company number) must be sent as approved templates.
//
// Required env vars:
//   WHATSAPP_PHONE_NUMBER_ID          Phone Number ID from Meta app (not the phone number itself)
//   WHATSAPP_ACCESS_TOKEN             Permanent access token for the WhatsApp app
//   COMPANY_WHATSAPP_NUMBER           Your company's WhatsApp number in E.164 w/o "+", e.g. 919876543210
//
// Optional env vars:
//   WHATSAPP_API_VERSION              Defaults to v21.0
//   WHATSAPP_COUNTRY_CODE              Defaults to 91 (India), used to expand 10-digit numbers
//   WHATSAPP_REGISTRATION_TEMPLATE     Defaults to "registration_confirmation"
//   WHATSAPP_REGISTRATION_TEMPLATE_LANG Defaults to "en"
//   WHATSAPP_COMPANY_ALERT_TEMPLATE    Defaults to "new_registration_alert"
//   WHATSAPP_COMPANY_ALERT_TEMPLATE_LANG Defaults to "en"

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_COUNTRY_CODE = process.env.WHATSAPP_COUNTRY_CODE || "91";
const COMPANY_WHATSAPP_NUMBER = process.env.COMPANY_WHATSAPP_NUMBER;

const REGISTRATION_TEMPLATE_NAME =
  process.env.WHATSAPP_REGISTRATION_TEMPLATE || "registration_confirmation";
const REGISTRATION_TEMPLATE_LANG =
  process.env.WHATSAPP_REGISTRATION_TEMPLATE_LANG || "en";

const COMPANY_ALERT_TEMPLATE_NAME =
  process.env.WHATSAPP_COMPANY_ALERT_TEMPLATE || "new_registration_alert";
const COMPANY_ALERT_TEMPLATE_LANG =
  process.env.WHATSAPP_COMPANY_ALERT_TEMPLATE_LANG || "en";

/**
 * Normalize a raw phone number into the digits-only E.164 form WhatsApp expects
 * (no "+", no spaces). A bare 10-digit Indian mobile number gets the country
 * code prefixed; anything already longer is assumed to include a country code.
 */
function normalizeToE164(rawPhone, defaultCountryCode = WHATSAPP_COUNTRY_CODE) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  if (digits.length > 10) return digits;
  return null;
}

function assertConfigured() {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in the backend .env."
    );
  }
}

/**
 * Low-level helper: sends an approved WhatsApp template message.
 * `parameters` fills the template's {{1}}, {{2}}, ... body placeholders in order.
 */
async function sendWhatsAppTemplateMessage({ to, templateName, languageCode = "en", parameters = [] }) {
  assertConfigured();

  const toNumber = normalizeToE164(to);
  if (!toNumber) {
    throw new Error(`Invalid WhatsApp recipient number: "${to}"`);
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: toNumber,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: parameters.length
        ? [
            {
              type: "body",
              parameters: parameters.map((value) => ({ type: "text", text: String(value ?? "-") })),
            },
          ]
        : [],
    },
  };

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
    const errMessage = data?.error?.message || `WhatsApp API request failed (${response.status})`;
    const err = new Error(errMessage);
    err.details = data;
    throw err;
  }

  return data;
}

/**
 * Sends the registration confirmation template to the person who just registered.
 * Adjust the `parameters` order/count to match your approved template's body variables.
 */
const sendRegistrationWhatsApp = async ({
  phone,
  name,
  registrationId,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
}) => {
  return sendWhatsAppTemplateMessage({
    to: phone,
    templateName: REGISTRATION_TEMPLATE_NAME,
    languageCode: REGISTRATION_TEMPLATE_LANG,
    parameters: [
      name || "Participant",
      eventName || "VedaCraft Event",
      registrationId || "-",
      eventDate || "-",
      eventTime || "-",
      eventVenue || "-",
    ],
  });
};

/**
 * Sends a new-registration alert template to the company's own WhatsApp number.
 */
const sendCompanyWhatsAppAlert = async ({ name, phone, email, businessName, eventName, registrationId }) => {
  if (!COMPANY_WHATSAPP_NUMBER) {
    throw new Error("COMPANY_WHATSAPP_NUMBER is not set in the backend .env.");
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
      eventName || "-",
      registrationId || "-",
    ],
  });
};

module.exports = {
  normalizeToE164,
  sendWhatsAppTemplateMessage,
  sendRegistrationWhatsApp,
  sendCompanyWhatsAppAlert,
};