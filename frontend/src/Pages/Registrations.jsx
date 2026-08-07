import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle, Download, Eye, Mail, Search, X, XCircle } from "lucide-react";

import { API_URL } from "../config";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeRegistrationRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const firstRowText = rows[0].map((cell) => String(cell || "")).join(" ").toLowerCase();
  const hasHeader = ["registration id", "email status", "event id"].some((hint) =>
    firstRowText.includes(hint)
  );

  return (hasHeader ? rows.slice(1) : rows)
    .map((row, index) => ({
      key: `${row[14] || "registration"}-${index}`,
      eventId: row[0] || "",
      event: row[1] || "-",
      participantName: row[2] || "-",
      mobile: row[3] || "-",
      email: row[4] || "-",
      district: row[5] || "-",
      businessName: row[6] || "-",
      designation: row[7] || "-",
      category: row[8] || "-",
      registrationId: row[14] || "-",
      upiReference: row[15] || "-",
      paymentScreenshot: row[16] || "",
      emailStatus: row[17] || "Not Sent",
      registrationFee: row[18] || "0",
      merchantName: row[19] || "-",
      registrationDate: row[20] || "",
      paymentStatus: row[21] || "Pending Verification",
      rejectionReason: row[22] || "",
    }))
    .sort((a, b) => {
      const aTime = new Date(a.registrationDate || 0).getTime() || 0;
      const bTime = new Date(b.registrationDate || 0).getTime() || 0;
      return bTime - aTime;
    });
};

function Registrations() {
  const [searchParams] = useSearchParams();
  const initialEvent = searchParams.get("event") || "";
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(initialEvent);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/registrations`);
      setRegistrations(normalizeRegistrationRows(res.data));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (url) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = url.split("/").pop().split("?")[0] || "payment-screenshot";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Unable to download the screenshot directly. Please open it in a new tab and save it manually.");
    }
  };

  const resendEmail = async (registration) => {
    if (!registration.registrationId || registration.registrationId === "-") return;
    setActionLoading(`email-${registration.registrationId}`);
    try {
      await axios.post(`${API_URL}/registrations/${registration.registrationId}/resend-email`);
      setNotice("Confirmation email resent successfully.");
      await fetchRegistrations();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || "Unable to resend email.");
    } finally {
      setActionLoading("");
    }
  };

  const verifyPayment = async (registration) => {
    if (!registration.registrationId || registration.registrationId === "-") return;
    setActionLoading(`verify-${registration.registrationId}`);
    try {
      await axios.post(`${API_URL}/registrations/${registration.registrationId}/verify-payment`);
      setNotice("Payment verified and email sent.");
      await fetchRegistrations();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || "Unable to verify payment.");
    } finally {
      setActionLoading("");
    }
  };

  const rejectPayment = async (registration) => {
    if (!registration.registrationId || registration.registrationId === "-") return;
    const reason = window.prompt("Enter rejection reason");
    if (!reason || !reason.trim()) return;

    setActionLoading(`reject-${registration.registrationId}`);
    try {
      await axios.post(`${API_URL}/registrations/${registration.registrationId}/reject-payment`, {
        reason: reason.trim(),
      });
      setNotice("Payment rejected and email sent.");
      await fetchRegistrations();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || "Unable to reject payment.");
    } finally {
      setActionLoading("");
    }
  };

  const eventList = useMemo(
    () => [...new Set(registrations.map((item) => item.event).filter(Boolean))],
    [registrations]
  );

  const filteredRegistrations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return registrations
      .filter((item) => !selectedEvent || item.event === selectedEvent)
      .filter((item) => {
        if (!search) return true;
        return [
          item.registrationId,
          item.participantName,
          item.mobile,
          item.email,
          item.district,
          item.event,
          item.upiReference,
          item.paymentStatus,
        ].some((value) => String(value || "").toLowerCase().includes(search));
      });
  }, [registrations, selectedEvent, searchTerm]);

  const paidCount = filteredRegistrations.filter((item) =>
    item.paymentStatus.toLowerCase() === "verified"
  ).length;

  return (
    <>
        <div className="mb-7">
          <p className="text-sm font-semibold text-[#7a5c14] uppercase tracking-wide">Admin Panel</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#245c1f]">Registration Management</h1>
          <p className="text-gray-600 mt-1">Newest registrations appear first with complete participant and payment details.</p>
        </div>

        {notice && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {notice}
            <button onClick={() => setNotice("")}><X size={16} /></button>
          </div>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Stat label="Total Registrations" value={filteredRegistrations.length} />
          <Stat label="Email Sent" value={filteredRegistrations.filter((item) => item.emailStatus === "Sent").length} />
          <Stat label="Payment Verified" value={paidCount} />
          <Stat label="Screenshots" value={filteredRegistrations.filter((item) => item.paymentScreenshot).length} />
        </section>

        <section className="bg-white border border-[#e6eadf] rounded-lg p-4 md:p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3">
            <label className="relative">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search name, mobile, email, district, event, UPI reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#245c1f]/30"
              />
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#245c1f]/30"
            >
              <option value="">All Events</option>
              {eventList.map((event) => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="bg-white rounded-lg border border-[#e6eadf] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1420px]">
              <thead className="bg-[#245c1f] text-white">
                <tr>
                  {[
                    "Registration ID",
                    "Participant Name",
                    "Mobile",
                    "Email",
                    "Event Name",
                    "Registration Fee",
                    "UPI Reference Number",
                    "Payment Screenshot",
                    "Payment Status",
                    "Email Status",
                    "Registration Date",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="12" className="p-8 text-center text-gray-500">Loading registrations...</td></tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr><td colSpan="12" className="p-8 text-center text-gray-500">No registrations found.</td></tr>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <tr key={registration.key} className="border-b border-gray-100 text-gray-700 hover:bg-[#fbfdf6]">
                      <td className="px-3 py-2 text-xs font-bold text-[#245c1f]">{registration.registrationId}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-gray-800">{registration.participantName}</td>
                      <td className="px-3 py-2 text-xs">{registration.mobile}</td>
                      <td className="px-3 py-2 text-xs">{registration.email}</td>
                      <td className="px-3 py-2 text-xs max-w-[220px] truncate">{registration.event}</td>
                      <td className="px-3 py-2 text-xs">Rs. {registration.registrationFee}</td>
                      <td className="px-3 py-2 text-xs">{registration.upiReference}</td>
                      <td className="px-3 py-2 text-xs">{registration.paymentScreenshot ? "Uploaded" : "-"}</td>
                      <td className="px-3 py-2 text-xs">
                        <Badge tone={registration.paymentStatus.toLowerCase() === "verified" ? "green" : registration.paymentStatus.toLowerCase() === "rejected" ? "red" : "amber"}>
                          {registration.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <Badge tone={registration.emailStatus === "Sent" ? "green" : "red"}>{registration.emailStatus}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs">{formatDateTime(registration.registrationDate)}</td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex flex-wrap gap-2">
                          <IconButton title="View Screenshot" onClick={() => setSelectedRegistration(registration)}><Eye size={16} /></IconButton>
                          <IconButton title="Verify Payment" loading={actionLoading === `verify-${registration.registrationId}`} onClick={() => verifyPayment(registration)}><CheckCircle size={16} /></IconButton>
                          <IconButton title="Reject Payment" loading={actionLoading === `reject-${registration.registrationId}`} onClick={() => rejectPayment(registration)}><XCircle size={16} /></IconButton>
                          <IconButton title="Download Screenshot" onClick={() => downloadFile(registration.paymentScreenshot)}><Download size={16} /></IconButton>
                          <IconButton title="Resend Email" loading={actionLoading === `email-${registration.registrationId}`} onClick={() => resendEmail(registration)}><Mail size={16} /></IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      {selectedRegistration && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-bold text-[#245c1f]">Registration Details</h3>
              <button onClick={() => setSelectedRegistration(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["Registration ID", selectedRegistration.registrationId],
                  ["Participant Name", selectedRegistration.participantName],
                  ["Mobile", selectedRegistration.mobile],
                  ["Email", selectedRegistration.email],
                  ["District", selectedRegistration.district],
                  ["Event", selectedRegistration.event],
                  ["Registration Date", formatDateTime(selectedRegistration.registrationDate)],
                  ["Payment Status", selectedRegistration.paymentStatus],
                  ["Email Status", selectedRegistration.emailStatus],
                  ["UPI Reference", selectedRegistration.upiReference],
                  ["Registration Fee", `Rs. ${selectedRegistration.registrationFee}`],
                  ["Merchant", selectedRegistration.merchantName],
                  ["Rejection Reason", selectedRegistration.rejectionReason],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#e8eddd] bg-[#f8faf4] p-3">
                    <p className="text-xs font-semibold text-gray-500">{label}</p>
                    <p className="mt-1 font-semibold text-gray-800 break-words">{value || "-"}</p>
                  </div>
                ))}
              </div>
              {selectedRegistration.paymentScreenshot && (
                <img src={selectedRegistration.paymentScreenshot} alt="Payment screenshot" className="mt-5 max-h-96 w-full rounded-lg object-contain bg-gray-50" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-[#e6eadf] p-4 shadow-sm">
      <p className="text-xs md:text-sm text-gray-500">{label}</p>
      <h2 className="mt-2 text-xl md:text-2xl font-bold leading-none text-[#245c1f]">{value}</h2>
    </div>
  );
}

function Badge({ children, tone }) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${classes[tone]}`}>{children}</span>;
}

function IconButton({ children, title, onClick, loading }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe7d3] bg-white text-[#245c1f] transition hover:bg-[#f2f7ed] disabled:opacity-50"
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-[#245c1f] border-t-transparent animate-spin" /> : children}
    </button>
  );
}

export default Registrations;
