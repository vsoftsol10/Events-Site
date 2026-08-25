import Nav from "./Nav";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_URL } from "../config";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  businessName: "",
  category: "",
  designation: "",
  businessLocation: "",
  yearsInBusiness: "",
  employees: "",
  website: "",
  heardAbout: "",
  whyAttend: "",
};

function RegistrationPage() {
  const { i18n } = useTranslation();
  const [event, setEvent] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [upiReference, setUpiReference] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState("");

  useEffect(() => {
    fetchEvent();
  }, []);

  useEffect(() => {
    if (event?.eventId) fetchPaymentSettings(event.eventId);
  }, [event?.eventId]);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      const rows = res.data;
      if (rows.length > 0) {
        const latest = rows[rows.length - 1];
        setEvent({
          eventId: latest[0],
          titleEn: latest[1],
          titleTa: latest[2],
          type: latest[3],
          date: latest[4],
          time: latest[5],
          venueEn: latest[6],
          venueTa: latest[7],
          seats: latest[8],
          district: latest[9],
          deadline: latest[10],
          descriptionEn: latest[11],
          descriptionTa: latest[12],
          registrationFee: latest[18] || "",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchPaymentSettings = async (eventId) => {
    try {
      const res = await axios.get(`${API_URL}/payment-settings/${eventId}?t=${Date.now()}`);
      setPaymentSettings({ ...(res.data || {}), loadedAt: Date.now() });
    } catch (err) {
      console.log(err);
    }
  };

  const eventTitle = i18n.language === "ta" ? event?.titleTa : event?.titleEn;
  const eventVenue = i18n.language === "ta" ? event?.venueTa : event?.venueEn;
  const fee = event?.registrationFee != null && event.registrationFee !== ""
    ? event.registrationFee
    : "0";
  const qrCodeSrc = paymentSettings?.qrCodeImage
    ? `${paymentSettings.qrCodeImage}${paymentSettings.qrCodeImage.includes("?") ? "&" : "?"}v=${paymentSettings.loadedAt || Date.now()}`
    : "";

  const formattedDate = useMemo(() => {
    if (!event?.date) return "Coming Soon";
    return new Date(event.date).toLocaleDateString("en-GB").replace(/\//g, "-");
  }, [event?.date]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateDetails = () => {
    if (!form.name.trim()) return "Please enter your full name";
    if (!/^\d{10}$/.test(form.phone)) return "Mobile number must be exactly 10 digits";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid email address";
    if (!form.businessName.trim()) return "Please enter your company or business name";
 
    
    if (!form.businessLocation.trim()) return "Please enter your business location";
    
    return "";
  };

  const continueToPayment = (e) => {
    e.preventDefault();
    const error = validateDetails();
    if (error) {
      alert(error);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validatePayment = () => {
    const reference = upiReference.trim();
    if (!reference) return "UPI Reference Number is required";
    if (reference.length < 10) return "UPI Reference Number is too short";
    if (reference.length > 30) return "UPI Reference Number is too long";
    if (!/^[A-Za-z0-9]+$/.test(reference)) {
      return "UPI Reference Number contains invalid characters";
    }
    if (!paymentScreenshot) return "Please upload your payment screenshot";
    if (!["image/jpeg", "image/jpg", "image/png"].includes(paymentScreenshot.type)) {
      return "Payment screenshot must be JPG, JPEG, or PNG";
    }
    if (paymentScreenshot.size > 5 * 1024 * 1024) {
      return "Payment screenshot must be 5 MB or smaller";
    }
    return "";
  };

  const confirmRegistration = async (e) => {
    e.preventDefault();
    const error = validatePayment();
    if (error) {
      alert(error);
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    payload.append("upiReference", upiReference.trim());
    payload.append("paymentScreenshot", paymentScreenshot);
    payload.append("eventId", event?.eventId || "");
    payload.append("eventTitle", event?.titleEn || "");
    payload.append("eventDate", event?.date || "");
    payload.append("eventTime", event?.time || "");
    payload.append("eventVenue", event?.venueEn || "");

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/add-event`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessId(res.data.registrationId);
      setForm(initialForm);
      setUpiReference("");
      setPaymentScreenshot(null);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || "Registration Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Nav />

      <section id="register" className="min-h-screen bg-[#f8f5ef] pt-28 md:pt-36 pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 md:gap-8">
          <aside className="bg-white rounded-3xl shadow-lg border border-[#e6dcc6] p-5 md:p-6 h-fit">
            <div className="bg-gradient-to-r from-green-800 to-[#b17b4a] rounded-2xl p-6 md:p-8 text-center text-white">
              <h2 className="text-xl md:text-2xl font-bold">{eventTitle}</h2>
            </div>

            <div className="mt-6 space-y-3 md:space-y-4 text-[#5C4033] text-sm md:text-base">
              <div>Date: {formattedDate}</div>
              <div>Time: {event?.time || "TBA"}</div>
              <div>Venue: {eventVenue}</div>
              <div>Registration Fee: Rs. {fee}</div>
              <div>30 </div>
            </div>

            <div className="mt-6 md:mt-8 bg-[#fff4dd] border border-[#ffbe2a] rounded-2xl p-4 md:p-5">
              <h3 className="font-bold text-center text-[#b17b4a] mb-4">
                Registration Steps
              </h3>
              <div className="space-y-3 text-sm text-[#5C4033]">
                <div className={step === 1 ? "font-semibold text-green-800" : ""}>Step 1: Registration Details</div>
                <div className="text-center text-[#b17b4a]">↓</div>
                <div className={step === 2 ? "font-semibold text-green-800" : ""}>Step 2: Payment</div>
              </div>
            </div>
          </aside>

          <main>
            <button
              onClick={() => (step === 2 ? setStep(1) : window.history.back())}
              className="text-red-800 font-medium hover:text-black mb-4 flex items-center gap-2 text-sm"
            >
              ← {step === 2 ? "Back to Details" : "Back"}
            </button>

            {successId ? (
              <div className="bg-white rounded-3xl shadow-lg border border-[#e6dcc6] p-6 md:p-10 text-center">
                <h1 className="text-2xl md:text-3xl font-serif text-green-800">
                  Registration Successful
                </h1>
                <p className="mt-4 text-[#5C4033]">Thank you for registering.</p>
                <div className="mt-6 bg-[#fff4dd] border border-[#ffbe2a] rounded-2xl p-5">
                  <p className="text-sm text-[#7a5c47]">Your Registration ID</p>
                  <p className="text-2xl font-bold text-green-800 mt-2">{successId}</p>
                </div>
                <p className="mt-6 text-[#5C4033]">
                  Your registration has been received successfully.
                </p>
                <p className="mt-2 text-[#5C4033]">
                  A confirmation email has been sent to your registered email address.
                </p>
                <p className="mt-2 text-[#5C4033]">
                  We look forward to welcoming you to the event.
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-serif text-green-800">
                  Register for the Event
                </h1>
                <p className="mt-2 text-[#b17b4a] text-sm md:text-base italic">
                  Complete your registration details, then submit your QR payment proof.
                </p>

                <div className="mt-5 bg-white rounded-3xl shadow-lg border border-[#e6dcc6] p-5 md:p-8">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {["Registration Details", "Payment"].map((label, index) => {
                      const active = step === index + 1;
                      return (
                        <div key={label} className={`rounded-2xl px-4 py-3 text-sm font-semibold text-center ${active ? "bg-green-800 text-white" : "bg-[#f8f5ef] text-[#7a5c47]"}`}>
                          Step {index + 1}: {label}
                        </div>
                      );
                    })}
                  </div>

                  {step === 1 ? (
                    <form className="space-y-5" onSubmit={continueToPayment}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Full Name" value={form.name} onChange={(value) => updateField("name", value)} required />
                        <Field label="Mobile Number" value={form.phone} onChange={(value) => updateField("phone", value.replace(/\D/g, "").slice(0, 10))} required />
                        <Field label="Email Address" type="email" value={form.email} onChange={(value) => updateField("email", value)} required />
                        <Field label="Company / Business Name" value={form.businessName} onChange={(value) => updateField("businessName", value)} required />
                        <SelectField label="Business Category" value={form.category} onChange={(value) => updateField("category", value)} options={["Manufacturing", "Retail", "Services", "Food & Beverage", "Technology", "Healthcare", "Education", "Other"]} />
                        <Field label="Designation" value={form.designation} onChange={(value) => updateField("designation", value)} />
                        <Field label="Business Location" value={form.businessLocation} onChange={(value) => updateField("businessLocation", value)} required />
                        <SelectField label="Years in Business" value={form.yearsInBusiness} onChange={(value) => updateField("yearsInBusiness", value)} options={["Planning to start", "Less than 1 year", "1-2 years", "3-5 years", "More than 5 years"]} />
                        <Field label="Number of Employees" value={form.employees} onChange={(value) => updateField("employees", value)} />
                        <Field label="Website / Social Media" value={form.website} onChange={(value) => updateField("website", value)} />
                        <SelectField label="How did you hear about this summit?" value={form.heardAbout} onChange={(value) => updateField("heardAbout", value)} options={["Social Media", "Friend / Colleague", "WhatsApp", "Email", "Poster / Banner", "Other"]} />
                      </div>
                      <TextArea label="Why do you want to attend?" value={form.whyAttend} onChange={(value) => updateField("whyAttend", value)} />

                      <button type="submit" className="w-full bg-green-800 text-white py-3 text-sm rounded-3xl font-semibold cursor-pointer hover:bg-green-700 transition">
                        Continue to Payment
                      </button>
                    </form>
                  ) : (
                    <form className="space-y-6" onSubmit={confirmRegistration}>
                      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
                        <div className="bg-[#f8f5ef] rounded-2xl border border-[#e6dcc6] p-5">
                          <div className="text-center">
                            <p className="text-sm font-medium text-[#7a5c47]">Registration Fee</p>
                            <p className="text-3xl font-bold text-green-800 mt-2">Rs. {fee}</p>
                          </div>
                          <div className="mt-5 bg-white rounded-2xl p-4 border border-[#e6dcc6]">
                            {qrCodeSrc ? (
                              <img
                                key={qrCodeSrc}
                                src={qrCodeSrc}
                                alt="Latest event payment QR code"
                                className="w-full max-w-[240px] mx-auto rounded-xl object-contain"
                              />
                            ) : (
                              <div className="h-56 flex items-center justify-center text-sm text-gray-500">
                                QR Code not configured
                              </div>
                            )}
                          </div>
                          <div className="mt-5 space-y-3 rounded-2xl border border-[#e6dcc6] bg-white p-4 text-left">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#7a5c47]">Merchant Name</p>
                              <p className="mt-1 font-semibold text-green-800 break-words">{paymentSettings?.merchantName || "Not configured"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#7a5c47]">UPI ID</p>
                              <p className="mt-1 font-semibold text-green-800 break-all">{paymentSettings?.upiId || "Not configured"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <Field label="Amount" value={`Rs. ${fee}`} onChange={() => {}} readOnly />
                          <Field label="UPI Reference Number" value={upiReference} onChange={setUpiReference} minLength={10} maxLength={30} required />
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Upload Payment Screenshot <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                              className="w-full border rounded-xl px-4 py-3 text-sm bg-white"
                            />
                            <p className="mt-1 text-xs text-gray-500">JPG, JPEG, or PNG only. Maximum size 5 MB.</p>
                          </div>

                          <div className="bg-[#fff4dd] border border-[#ffbe2a] rounded-2xl p-5 text-sm text-[#5C4033]">
                            <h3 className="font-bold text-[#b17b4a] mb-3">Payment Instructions</h3>
                            <ol className="list-decimal list-inside space-y-2">
                              <li>Scan the QR Code.</li>
                              <li>Complete the payment.</li>
                              <li>Note the UPI Reference Number.</li>
                              <li>Upload the payment screenshot.</li>
                              <li>Click Confirm Registration.</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      <button disabled={submitting} type="submit" className="w-full bg-green-800 text-white py-3 text-sm rounded-3xl font-semibold cursor-pointer hover:bg-green-700 transition disabled:opacity-60">
                        {submitting ? "Confirming..." : "Confirm Registration"}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </section>
    </>
  );
}

function Field({ label, value, onChange, type = "text", required = false, readOnly = false, minLength, maxLength }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        minLength={minLength}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-xl px-4 py-3 text-sm ${readOnly ? "bg-gray-100 text-gray-600" : "bg-white"}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded-xl px-4 py-3 text-sm bg-white">
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full border rounded-xl px-4 py-3 text-sm resize-none" />
    </div>
  );
}

export default RegistrationPage;
