import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Calendar,
  Clock,
  Copy,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Search,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { API_URL } from "../config";

const STATUS_STYLES = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
  closed: "bg-red-50 text-red-700 border-red-200",
};

const emptyPreview = {
  event: null,
  mode: "",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (value) => (value || "draft").trim().toLowerCase();

const parseCurrency = (value) => {
  const amount = Number(String(value || "0").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const parseSpeakers = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value || "[]") : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const eventFromRow = (row, registrations, fee) => {
  const id = row[0] || "";
  const registeredParticipants = registrations.filter((item) => item[0] === id).length;
  const availableSeats = Number.parseInt(row[8] || "0", 10) || 0;
  const totalSeats = availableSeats + registeredParticipants;

  return {
    id,
    title: row[1] || "Untitled Event",
    titleTa: row[2] || "",
    type: row[3] || "",
    date: row[4] || "",
    time: row[5] || "",
    venue: row[6] || row[7] || "-",
    venueTa: row[7] || "",
    availableSeats,
    totalSeats,
    district: row[9] || "-",
    deadline: row[10] || "",
    description: row[11] || "",
    descriptionTa: row[12] || "",
    speakers: row[13] || "[]",
    status: normalizeStatus(row[15]),
    banner: row[16] || "",
    createdDate: row[17] || "",
    registeredParticipants,
    registrationFee: fee || "0",
  };
};

function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBlocked, setDeleteBlocked] = useState(null);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(emptyPreview);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [eventRes, registrationRes] = await Promise.all([
        axios.get(`${API_URL}/events?admin=true&t=${Date.now()}`),
        axios.get(`${API_URL}/registrations`),
      ]);

      const rows = eventRes.data || [];
      const registrationRows = normalizeRegistrationRows(registrationRes.data || []);
      setRegistrations(registrationRows);

      const today = new Date();
      const updatedEvents = rows.map((ev) => {
        const newEvent = [...ev];
        const status = normalizeStatus(newEvent[15]);
        const deadline = newEvent[10]
  ? new Date(`${newEvent[10]}T23:59:59`)
  : null;

if (
  status === "published" &&
  deadline &&
  !Number.isNaN(deadline.getTime()) &&
  deadline < today
) {
  newEvent[15] = "closed";
          axios.put(`${API_URL}/events/${newEvent[0]}/status`, { status: "closed" })
            .catch((err) => console.log("Auto-close failed:", err));
        } else {
          newEvent[15] = status;
        }

        return newEvent;
      });

      setEvents(updatedEvents);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeRegistrationRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const firstRowText = rows[0].map((cell) => String(cell || "")).join(" ").toLowerCase();
    const hasHeader = ["registration id", "event id", "email status"].some((hint) =>
      firstRowText.includes(hint)
    );
    return hasHeader ? rows.slice(1) : rows;
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const normalizedEvents = useMemo(
    () => events.map((row) => eventFromRow(row, registrations, row[18] || "0")),
    [events, registrations]
  );

  const stats = useMemo(() => {
    const statusCount = (status) => normalizedEvents.filter((event) => event.status === status).length;
    return {
      totalEvents: normalizedEvents.length,
      published: statusCount("published"),
      draft: statusCount("draft"),
      archived: statusCount("archived"),
      totalRegistrations: registrations.length,
      revenue: registrations.reduce((sum, row) => sum + parseCurrency(row[18]), 0),
    };
  }, [normalizedEvents, registrations]);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return normalizedEvents
      .filter((event) => statusFilter === "all" || event.status === statusFilter)
      .filter((event) => !dateFilter || event.date === dateFilter)
      .filter((event) => !search || event.title.toLowerCase().includes(search))
      .sort((a, b) => {
        const aDate = new Date(a.date || 0).getTime() || 0;
        const bDate = new Date(b.date || 0).getTime() || 0;
        return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
      });
  }, [normalizedEvents, statusFilter, dateFilter, searchTerm, sortOrder]);

  const updateStatus = async (eventId, status) => {
    setActionLoading(`${status}-${eventId}`);
    try {
      await axios.put(`${API_URL}/events/${eventId}/status`, { status });
      setNotice(`Event ${status} successfully.`);
      await fetchAdminData();
    } catch (err) {
      console.log(err);
      alert("Unable to update event status.");
    } finally {
      setActionLoading("");
    }
  };

  const handleDuplicate = async (eventId) => {
    setActionLoading(`duplicate-${eventId}`);
    try {
      const res = await axios.post(`${API_URL}/events/${eventId}/duplicate`);
      navigate(`/edit-event/${res.data.eventId}`);
    } catch (err) {
      console.log(err);
      alert("Unable to duplicate event.");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(`delete-${deleteTarget.id}`);
    try {
      await axios.delete(`${API_URL}/events/${deleteTarget.id}`);
      setNotice("Event deleted successfully.");
      setDeleteTarget(null);
      await fetchAdminData();
    } catch (err) {
      if (err.response?.status === 409) {
        setDeleteBlocked(deleteTarget);
      } else {
        alert(err.response?.data?.error || "Unable to delete event.");
      }
    } finally {
      setActionLoading("");
    }
  };

  const archiveBlockedEvent = async () => {
    if (!deleteBlocked) return;
    await updateStatus(deleteBlocked.id, "archived");
    setDeleteTarget(null);
    setDeleteBlocked(null);
  };

  const statCards = [
    ["Total Events", stats.totalEvents, "text-[#245c1f]"],
    ["Published Events", stats.published, "text-emerald-600"],
    ["Draft Events", stats.draft, "text-amber-600"],
    ["Archived Events", stats.archived, "text-slate-600"],
    ["Total Registrations", stats.totalRegistrations, "text-blue-600"],
    ["Total Revenue", `Rs. ${stats.revenue.toLocaleString("en-IN")}`, "text-[#7a4f00]"],
  ];

  return (
    <>
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-7">
          <div>
            <p className="text-sm font-semibold text-[#7a5c14] uppercase tracking-wide">Admin Panel</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#245c1f]">Event Management</h1>
            <p className="text-gray-600 mt-1">Create, monitor, archive, and manage all VedaCraft events.</p>
          </div>
          <button
            onClick={() => navigate("/create-event")}
            className="inline-flex items-center justify-center gap-2 bg-[#245c1f] text-white px-5 py-3 rounded-lg font-semibold shadow-sm hover:bg-[#1c4818] transition"
          >
            <Plus size={18} /> Create Event
          </button>
        </div>

        {notice && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {notice}
            <button onClick={() => setNotice("")} className="text-emerald-800"><X size={16} /></button>
          </div>
        )}

        <section className="grid grid-cols-2 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
          {statCards.map(([label, value, color]) => (
            <div key={label} className="bg-white rounded-lg border border-[#e6eadf] p-4 shadow-sm">
              <p className="text-xs md:text-sm text-gray-500">{label}</p>
              <h2 className={`mt-2 text-xl md:text-2xl font-bold ${color}`}>{value}</h2>
            </div>
          ))}
        </section>

        <section className="bg-white border border-[#e6eadf] rounded-lg p-4 md:p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_.8fr_.8fr_.8fr] gap-3">
            <label className="relative">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by event name"
                className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#245c1f]/30"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#245c1f]/30"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="closed">Closed</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#245c1f]/30"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#245c1f]/30"
            >
              <option value="latest">Sort by Latest</option>
              <option value="oldest">Sort by Oldest</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="bg-white rounded-lg border border-[#e6eadf] p-10 text-center text-gray-500">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#e6eadf] p-10 text-center text-gray-500">No events found.</div>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredEvents.map((event) => (
              <article key={event.id} className="bg-white rounded-lg border border-[#e2e8d8] shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="grid md:grid-cols-[190px_1fr]">
                  <div className="bg-[#eef5ea] min-h-48 md:min-h-full">
                    {event.banner ? (
                      <img src={event.banner} alt={event.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full min-h-48 flex items-center justify-center text-[#245c1f]">
                        <Ticket size={42} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-[#1f4f1c] leading-snug">{event.title}</h2>
                        <p className="mt-1 text-sm text-gray-500">{event.type || "Event"} in {event.district}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLES[event.status] || STATUS_STYLES.draft}`}>
                        {event.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <Info icon={<Calendar size={16} />} label="Event Date" value={formatDate(event.date)} />
                      <Info icon={<Clock size={16} />} label="Event Time" value={event.time || "-"} />
                      <Info icon={<MapPin size={16} />} label="Venue" value={event.venue} />
                      <Info icon={<Ticket size={16} />} label="Registration Fee" value={`Rs. ${event.registrationFee || "0"}`} />
                      <Info icon={<Users size={16} />} label="Total Seats" value={event.totalSeats} />
                      <Info icon={<Users size={16} />} label="Available Seats" value={event.availableSeats} />
                      <Info icon={<Users size={16} />} label="Registered" value={event.registeredParticipants} />
                      <Info icon={<Calendar size={16} />} label="Created Date" value={formatDate(event.createdDate)} />
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Actions</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton icon={<Eye size={16} />} label="View" onClick={() => setPreview({ event, mode: "view" })} />
                        <ActionButton icon={<Edit3 size={16} />} label="Edit" onClick={() => navigate(`/edit-event/${event.id}`)} />
                        <ActionButton icon={<Copy size={16} />} label="Duplicate" loading={actionLoading === `duplicate-${event.id}`} onClick={() => handleDuplicate(event.id)} />
                        <ActionButton icon={<BarChart3 size={16} />} label="Analytics" onClick={() => navigate("/analytics")} />
                        <ActionButton icon={<Users size={16} />} label="Registrations" onClick={() => navigate(`/registrations?event=${encodeURIComponent(event.title)}`)} />
                        <ActionButton danger icon={<Trash2 size={16} />} label="Delete" onClick={() => setDeleteTarget(event)} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.status === "draft" && (
                          <button
                            disabled={!!actionLoading}
                            onClick={() => updateStatus(event.id, "published")}
                            className="rounded-lg bg-[#245c1f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {actionLoading === `published-${event.id}` ? "Publishing..." : "Publish"}
                          </button>
                        )}
                        {event.status === "published" && (
                          <button
                            disabled={!!actionLoading}
                            onClick={() => updateStatus(event.id, "closed")}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Close
                          </button>
                        )}
                        {event.status !== "archived" && (
                          <button
                            disabled={!!actionLoading}
                            onClick={() => updateStatus(event.id, "archived")}
                            className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Event"
          onClose={() => { setDeleteTarget(null); setDeleteBlocked(null); }}
          actions={
            deleteBlocked ? (
              <>
                <button className="rounded-lg border border-gray-200 px-4 py-2 font-semibold" onClick={() => { setDeleteTarget(null); setDeleteBlocked(null); }}>Cancel</button>
                <button className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white" onClick={archiveBlockedEvent}>Archive</button>
              </>
            ) : (
              <>
                <button className="rounded-lg border border-gray-200 px-4 py-2 font-semibold" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!!actionLoading} onClick={handleDelete}>
                  {actionLoading === `delete-${deleteTarget.id}` ? "Deleting..." : "Delete"}
                </button>
              </>
            )
          }
        >
          {deleteBlocked ? (
            <div className="space-y-3 text-gray-700">
              <p>This event already has registrations.</p>
              <p>Permanent deletion is not allowed.</p>
              <p className="font-semibold text-[#245c1f]">Would you like to Archive this event instead?</p>
            </div>
          ) : (
            <div className="space-y-3 text-gray-700">
              <p>Are you sure you want to delete this event?</p>
              <p className="font-bold text-[#245c1f]">{deleteTarget.title}</p>
              <p className="text-red-600">This action cannot be undone.</p>
            </div>
          )}
        </ConfirmModal>
      )}

      {preview.event && (
        <EventPreviewModal
          event={preview.event}
          onClose={() => setPreview(emptyPreview)}
          onEdit={() => navigate(`/edit-event/${preview.event.id}`)}
          onRegistrations={() => navigate(`/registrations?event=${encodeURIComponent(preview.event.title)}`)}
          onAnalytics={() => navigate("/analytics")}
        />
      )}
    </>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-[#f8faf4] border border-[#e8eddd] p-3 min-w-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <span className="text-[#245c1f]">{icon}</span>
        {label}
      </div>
      <p className="mt-1 truncate font-semibold text-gray-800">{value || "-"}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick, danger, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-[#dfe7d3] bg-white text-[#245c1f] hover:bg-[#f2f7ed]"
      }`}
    >
      {icon}
      {loading ? "Working..." : label}
    </button>
  );
}

function ConfirmModal({ title, children, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-bold text-[#245c1f]">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {actions && <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">{actions}</div>}
      </div>
    </div>
  );
}

function EventPreviewModal({ event, onClose, onEdit, onRegistrations, onAnalytics }) {
  const speakers = parseSpeakers(event.speakers);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="max-h-[86vh] overflow-y-auto">
          <div className="relative h-56 bg-[#eef5ea] md:h-72">
            {event.banner ? (
              <img src={event.banner} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#245c1f]">
                <Ticket size={54} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 text-gray-700 shadow-sm transition hover:bg-white"
              title="Close"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize shadow-sm ${STATUS_STYLES[event.status] || STATUS_STYLES.draft}`}>
                  {event.status}
                </span>
                <h2 className="mt-3 max-w-3xl text-2xl font-bold leading-tight text-white drop-shadow md:text-3xl">
                  {event.title}
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Info icon={<Calendar size={16} />} label="Date" value={formatDate(event.date)} />
              <Info icon={<Clock size={16} />} label="Time" value={event.time || "-"} />
              <Info icon={<MapPin size={16} />} label="Venue" value={event.venue} />
              <Info icon={<Ticket size={16} />} label="Registration Fee" value={`Rs. ${event.registrationFee || "0"}`} />
              <Info icon={<Users size={16} />} label="Total Seats" value={event.totalSeats} />
              <Info icon={<Users size={16} />} label="Available Seats" value={event.availableSeats} />
              <Info icon={<Users size={16} />} label="Registered Participants" value={event.registeredParticipants} />
              <Info icon={<Calendar size={16} />} label="Created Date" value={formatDate(event.createdDate)} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
              <section className="rounded-lg border border-[#e6eadf] bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#245c1f]">Description</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                  {event.description || "No description added."}
                </p>
              </section>

              <section className="rounded-lg border border-[#e6eadf] bg-[#fbfdf6] p-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#245c1f]">Speaker Summary</h3>
                {speakers.length ? (
                  <div className="mt-3 space-y-3">
                    {speakers.slice(0, 4).map((speaker, index) => (
                      <div key={`${speaker.nameEn || "speaker"}-${index}`} className="flex gap-3 rounded-lg bg-white p-3">
                        {speaker.image ? (
                          <img src={speaker.image} alt={speaker.nameEn || "Speaker"} className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef5ea] text-sm font-bold text-[#245c1f]">
                            {(speaker.nameEn || "S").charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-800">{speaker.nameEn || speaker.nameTa || "Speaker"}</p>
                          <p className="truncate text-xs text-gray-500">{speaker.designationEn || speaker.company || "Speaker"}</p>
                        </div>
                      </div>
                    ))}
                    {speakers.length > 4 && <p className="text-xs font-semibold text-gray-500">+{speakers.length - 4} more speakers</p>}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No speakers added.</p>
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button onClick={onEdit} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#245c1f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c4818]">
            <Edit3 size={16} /> Edit
          </button>
          <button onClick={onRegistrations} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dfe7d3] bg-white px-4 py-2.5 text-sm font-semibold text-[#245c1f] transition hover:bg-[#f2f7ed]">
            <Users size={16} /> Registrations
          </button>
          <button onClick={onAnalytics} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dfe7d3] bg-white px-4 py-2.5 text-sm font-semibold text-[#245c1f] transition hover:bg-[#f2f7ed]">
            <BarChart3 size={16} /> Analytics
          </button>
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Events;
