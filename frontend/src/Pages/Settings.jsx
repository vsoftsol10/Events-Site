import axios from "axios";
import { useEffect, useState, useCallback } from "react";

import { API_URL } from "../config";

const INPUT_CLS = "w-full mt-2 border border-gray-300 rounded-2xl px-4 md:px-5 py-4 md:py-5 text-gray-800 bg-white outline-none focus:ring-2 focus:ring-[#245c1f] transition";
const INPUT_DISABLED = "w-full mt-2 border border-gray-200 rounded-2xl px-4 md:px-5 py-4 md:py-5 text-gray-400 bg-gray-100 outline-none cursor-not-allowed";

function Banner({ msg }) {
  if (!msg.text) return null;
  const ok = msg.type === "success";
  return (
    <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
      {ok ? "✅" : "⚠️"} {msg.text}
    </div>
  );
}

function Settings() {
  const [fullName, setFullName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [phone, setPhone]                     = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [events, setEvents]                   = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("DEFAULT");
  const [upiId, setUpiId]                     = useState("");
  const [qrCodeImage, setQrCodeImage]         = useState("");
  const [qrCodeFile, setQrCodeFile]           = useState(null);
  const [qrPreview, setQrPreview]             = useState("");
  const [merchantName, setMerchantName]       = useState("");

  const [profileMsg, setProfileMsg]   = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [paymentMsg, setPaymentMsg]   = useState({ type: "", text: "" });
  const [saving, setSaving]           = useState(false);
  const [changingPw, setChangingPw]   = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/settings`);
      setFullName(res.data.fullName || "");
      setEmail(res.data.email || "");
      setPhone(res.data.phone || "");
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/events?admin=true&t=${Date.now()}`);
      setEvents(res.data || []);
      if (res.data?.length) setSelectedEventId(res.data[res.data.length - 1][0]);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const fetchPaymentSettings = useCallback(async (eventId) => {
    try {
      const res = await axios.get(`${API_URL}/payment-settings/${eventId}?t=${Date.now()}`);
      setUpiId(res.data.upiId || "");
      setQrCodeImage(res.data.qrCodeImage || "");
      setQrCodeFile(null);
      setQrPreview(res.data.qrCodeImage || "");
      setMerchantName(res.data.merchantName || "");
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchPaymentSettings(selectedEventId); }, [selectedEventId, fetchPaymentSettings]);

  useEffect(() => {
    if (!qrCodeFile) {
      setQrPreview(qrCodeImage);
      return;
    }
    const previewUrl = URL.createObjectURL(qrCodeFile);
    setQrPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [qrCodeFile, qrCodeImage]);

  const saveSettings = async () => {
    if (!fullName.trim() || !email.trim()) {
      setProfileMsg({ type: "error", text: "Name and email are required." });
      return;
    }
    setSaving(true);
    setProfileMsg({ type: "", text: "" });
    try {
      // ✅ FIXED: Explicitly passing false to keep the backend from breaking
      await axios.put(`${API_URL}/admin/settings`, { fullName, email, phone, notifications: false });
      setProfileMsg({ type: "success", text: "Profile saved. Login email updated successfully." });
    } catch {
      setProfileMsg({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordMsg({ type: "", text: "" });
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: "error", text: "Please fill in all password fields." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setChangingPw(true);
    try {
      await axios.put(`${API_URL}/admin/change-password`, { currentPassword, newPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.response?.data?.error || "Failed to change password." });
    } finally {
      setChangingPw(false);
    }
  };

  const handleQrCodeFile = (file) => {
    setPaymentMsg({ type: "", text: "" });
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setQrCodeFile(null);
      setPaymentMsg({ type: "error", text: "QR Code must be a JPG, JPEG, or PNG image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setQrCodeFile(null);
      setPaymentMsg({ type: "error", text: "QR Code image must be 5 MB or smaller." });
      return;
    }

    setQrCodeFile(file);
  };

  const savePaymentSettings = async () => {
    if (!selectedEventId || !upiId.trim() || !merchantName.trim() || (!qrCodeImage && !qrCodeFile)) {
      setPaymentMsg({ type: "error", text: "Please fill all payment settings." });
      return;
    }
    setSavingPayment(true);
    setPaymentMsg({ type: "", text: "" });
    try {
      const payload = new FormData();
      payload.append("upiId", upiId);
      payload.append("merchantName", merchantName);
      payload.append("existingQrCodeImage", qrCodeImage);
      if (qrCodeFile) payload.append("qrCodeImage", qrCodeFile);

      const res = await axios.put(`${API_URL}/payment-settings/${selectedEventId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setQrCodeImage(res.data.qrCodeImage || qrCodeImage);
      setQrCodeFile(null);
      setPaymentMsg({ type: "success", text: "Payment settings saved successfully." });
    } catch (err) {
      setPaymentMsg({ type: "error", text: err.response?.data?.error || "Failed to save payment settings." });
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <>

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#245c1f]">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your account and application preferences.</p>
        </div>

        {/* ── Admin Profile ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 md:p-8 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-[#245c1f] mb-5 md:mb-6">Admin Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="text-sm text-gray-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setProfileMsg({ type: "", text: "" })}
                placeholder="Admin User"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">
                Email Address
                <span className="ml-2 text-xs text-[#245c1f] bg-green-50 px-2 py-0.5 rounded-full font-normal">
                  Used for login
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setProfileMsg({ type: "", text: "" })}
                placeholder="admin@vsoftsolutions.com"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Role</label>
              <input
                type="text"
                value="Super Admin"
                disabled
                className={INPUT_DISABLED}
              />
            </div>
          </div>

          <Banner msg={profileMsg} />

          <div className="flex justify-end mt-6">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full sm:w-auto bg-[#f5c518] hover:bg-[#e0b315] text-black font-semibold px-8 py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 md:p-8 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-[#245c1f] mb-5 md:mb-6">Payment Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="text-sm text-gray-700">Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setPaymentMsg({ type: "", text: "" });
                }}
                className={INPUT_CLS}
              >
                <option value="DEFAULT">Default Settings</option>
                {events.map((event) => (
                  <option key={event[0]} value={event[0]}>
                    {event[1] || event[0]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="merchant@upi"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Merchant Name</label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Vsoft Solutions"
                className={INPUT_CLS}
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-medium">QR Code</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => handleQrCodeFile(e.target.files?.[0] || null)}
                className="w-full mt-2 border rounded-xl px-4 py-3"
              />
              <p className="text-sm text-gray-500 mt-2">
                JPG, JPEG, or PNG only. Maximum size 5 MB.
              </p>
            </div>
          </div>

          {qrPreview && (
            <div className="mt-5 w-full sm:w-64 bg-[#f8f5ef] border border-[#e6dcc6] rounded-2xl p-4">
              <p className="font-medium text-[#245c1f] mb-3">QR Code</p>
              <div className="bg-white border border-[#e6dcc6] rounded-xl p-3">
                <img src={qrPreview} alt="Payment QR preview" className="w-full aspect-square rounded-lg object-contain" />
              </div>
              <label className="mt-4 inline-block bg-[#ffbe2a] hover:bg-[#e0b315] text-black font-semibold px-4 py-2 rounded-xl cursor-pointer transition">
                Replace QR
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={(e) => handleQrCodeFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <Banner msg={paymentMsg} />

          <div className="flex justify-end mt-6">
            <button
              onClick={savePaymentSettings}
              disabled={savingPayment}
              className="w-full sm:w-auto bg-[#245c1f] hover:bg-[#1a4416] text-white font-semibold px-8 py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {savingPayment ? "Saving..." : "Save Payment Settings"}
            </button>
          </div>
        </div>

        {/* ── Change Password ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 md:p-8 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-[#245c1f] mb-5 md:mb-6">Change Password</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="text-sm text-gray-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onFocus={() => setPasswordMsg({ type: "", text: "" })}
                placeholder=""
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=""
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && changePassword()}
                placeholder=""
                className={INPUT_CLS}
              />
            </div>
          </div>

          <Banner msg={passwordMsg} />

          <div className="flex justify-end mt-6">
            <button
              onClick={changePassword}
              disabled={changingPw}
              className="w-full sm:w-auto bg-[#245c1f] hover:bg-[#1a4416] text-white font-semibold px-8 py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {changingPw ? "Changing…" : "Change Password"}
            </button>
          </div>
        </div>
    </>
  );
}

export default Settings;
