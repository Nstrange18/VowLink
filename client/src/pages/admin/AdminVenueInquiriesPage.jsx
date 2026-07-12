import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import api from "../../utils/api";
import Skeleton from "../../components/common/Skeleton";

const formatDate = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const getAgeDays = (date) => {
  if (!date) return 0;
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
};

const getStatusMeta = (status, createdAt) => {
  const normalized = status === "new" || status === "waiting" ? "waiting" : status;
  const ageDays = getAgeDays(createdAt);

  if (normalized === "replied") {
    return {
      label: "Venue replied",
      description: "The venue has responded. Check your email, WhatsApp, or contact thread.",
      icon: "lucide:check-check",
      tone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (normalized === "unavailable") {
    return {
      label: "Venue unavailable",
      description: "The venue marked this request as unavailable. You can explore other suggested venues.",
      icon: "lucide:calendar-x",
      tone: "border-red-400/25 bg-red-400/10 text-red-200",
    };
  }

  if (ageDays >= 2) {
    return {
      label: `Waiting ${ageDays} days`,
      description: "The venue has not marked a reply yet. You can follow up directly if contact details are available.",
      icon: "lucide:clock-alert",
      tone: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    };
  }

  return {
    label: "Sent",
    description: "Your request has been sent to the venue.",
    icon: "lucide:send",
    tone: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  };
};

const filters = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "replied", label: "Replied" },
  { value: "unavailable", label: "Unavailable" },
];

const AdminVenueInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/venues/my-inquiries");
      setInquiries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load venue requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const counts = useMemo(() => {
    return inquiries.reduce(
      (acc, inquiry) => {
        const normalized = inquiry.status === "new" || inquiry.status === "waiting" ? "waiting" : inquiry.status;
        acc.all += 1;
        acc[normalized] = (acc[normalized] || 0) + 1;
        return acc;
      },
      { all: 0, waiting: 0, replied: 0, unavailable: 0 }
    );
  }, [inquiries]);

  const visibleInquiries = useMemo(() => {
    if (filter === "all") return inquiries;
    return inquiries.filter((inquiry) => {
      const normalized = inquiry.status === "new" || inquiry.status === "waiting" ? "waiting" : inquiry.status;
      return normalized === filter;
    });
  }, [filter, inquiries]);

  return (
    <div className="venue-requests-page min-h-full bg-[#070A13] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[#D8B76A]">Venue Requests</p>
            <h1 className="font-serif text-4xl leading-tight">Inquiry History</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
              Track venues you contacted, see whether they have responded, and follow up when a request has been waiting.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchInquiries}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#d4b978] transition hover:text-[#D8B76A] disabled:opacity-50"
          >
            <Icon icon="lucide:refresh-cw" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-[#0D1220] p-3">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
                filter === item.value
                  ? "border-[#D8B76A] bg-[#D8B76A] text-[#070A13]"
                  : "border-white/10 bg-white/5 text-white/55 hover:border-[#D8B76A]/35 hover:text-[#D8B76A]"
              }`}
            >
              {item.label}
              <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${
                filter === item.value ? "bg-[#070A13]/15" : "bg-white/10 text-white/60"
              }`}>
                {counts[item.value] || 0}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-40 w-full rounded-3xl" />
            ))}
          </div>
        ) : visibleInquiries.length ? (
          <div className="grid gap-4">
            {visibleInquiries.map((inquiry) => {
              const statusMeta = getStatusMeta(inquiry.status, inquiry.createdAt);
              const venue = inquiry.venue;
              const photo = venue?.photos?.[0] || "/default_venue.svg";
              const followUpText = encodeURIComponent(
                `Hi ${venue?.name || "there"}, we sent an inquiry through VowLink and wanted to follow up on availability.`
              );

              return (
                <article key={inquiry._id} className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#0D1220] sm:grid-cols-[180px_1fr]">
                  <div className="h-44 bg-white/5 sm:h-full">
                    <img src={photo} alt={venue?.name || "Venue"} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-serif text-2xl text-white">{venue?.name || "Venue unavailable"}</h2>
                          {venue?.isFeatured && (
                            <span className="rounded-full bg-[#D8B76A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#070A13]">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-widest text-[#D8B76A]">
                          {[venue?.generalLocation, venue?.city].filter(Boolean).join(", ") || "Location unavailable"}
                        </p>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusMeta.tone}`}>
                        <Icon icon={statusMeta.icon} className="h-3.5 w-3.5" />
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-white/45">{statusMeta.description}</p>
                    <div className="venue-request-message mt-4 rounded-2xl border border-white/10 bg-[#070A13]/70 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Your message</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">{inquiry.message}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/35">
                        <span>Sent: {formatDate(inquiry.createdAt)}</span>
                        {inquiry.repliedAt && <span>Updated: {formatDate(inquiry.repliedAt)}</span>}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {venue?._id && (
                        <Link
                          to={`/admin/venues/${venue._id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D8B76A] transition hover:text-[#D8B76A]"
                        >
                          <Icon icon="lucide:eye" className="h-3.5 w-3.5" />
                          View venue
                        </Link>
                      )}
                      {venue?.whatsapp && (
                        <a
                          href={`https://wa.me/${venue.whatsapp}?text=${followUpText}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#070A13]"
                        >
                          <Icon icon="ri:whatsapp-line" className="h-3.5 w-3.5" />
                          Follow up
                        </a>
                      )}
                      {venue?.email && (
                        <a
                          href={`mailto:${venue.email}?subject=${encodeURIComponent("VowLink venue inquiry follow-up")}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#D8B76A]/35 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D8B76A]"
                        >
                          <Icon icon="lucide:mail" className="h-3.5 w-3.5" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-[#0D1220] p-10 text-center">
            <Icon icon="lucide:mail-open" className="mx-auto h-10 w-10 text-white/30" />
            <h2 className="mt-5 font-serif text-2xl">No venue requests here yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
              When you send a direct inquiry from a venue profile, it will appear here for tracking.
            </p>
            <Link
              to="/admin/venues"
              className="mt-6 inline-flex rounded-full bg-[#D8B76A] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#070A13]"
            >
              Browse Venues
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVenueInquiriesPage;
