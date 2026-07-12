import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Icon } from "@iconify/react";

const AdminVenuesPage = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));

  // Pro-only features states
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [shortlistedOnly, setShortlistedOnly] = useState(false);

  // Inquiry Modal states
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const tier = user.tier || "free";
  const isFree = tier === "free";
  const isPro = tier === "pro";

  const fetchVenues = async () => {
    try {
      const res = await api.get("/venues");
      setVenues(res.data);
    } catch (err) {
      toast.error("Failed to load suggested venues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleShortlistToggle = async (venueId) => {
    if (!isPro) {
      toast.info("Shortlisting venues is a Pro feature! Upgrade to unlock.");
      navigate("/admin/billing");
      return;
    }

    try {
      const res = await api.post(`/venues/shortlist/${venueId}`);
      // Update local storage user shortlisted venues
      const updatedUser = { ...user, shortlistedVenues: res.data.shortlistedVenues };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to update shortlist.");
    }
  };

  const handleOpenInquiry = (venue) => {
    if (!isPro) {
      toast.info("Direct inquiries are a Pro feature! Upgrade to unlock.");
      navigate("/admin/billing");
      return;
    }
    setSelectedVenue(venue);
    setInquiryMsg(`Hi! We are planning our wedding on VowLink and would love to get a quote and check availability for our guests (${venue.capacity}).`);
    setIsInquiryOpen(true);
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    setSubmittingInquiry(true);

    try {
      const res = await api.post("/venues/inquire", {
        venueId: selectedVenue._id,
        message: inquiryMsg,
      });
      toast.success(res.data.message);
      setIsInquiryOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Inquiry failed to send.");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const isShortlisted = (id) => {
    return user.shortlistedVenues?.includes(id);
  };

  // Filter venues (Pro features or fallback client sorting)
  const filteredVenues = venues.filter((v) => {
    // Name or City search
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.city.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Style Filter
    if (styleFilter && v.style !== styleFilter) {
      return false;
    }
    // Shortlisted Filter
    if (shortlistedOnly && !isShortlisted(v._id)) {
      return false;
    }
    // Capacity Filter
    if (capacityFilter) {
      const capNum = parseInt(v.capacity.replace(/[^0-9]/g, ""));
      if (capacityFilter === "small" && capNum >= 200) return false;
      if (capacityFilter === "medium" && (capNum < 200 || capNum > 500)) return false;
      if (capacityFilter === "large" && capNum <= 500) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Curated Directories</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">Suggested Venues</h2>
          <p className="text-white/40 text-sm mt-2 max-w-xl">
            Explore wedding locations tailored for quality, capacity, and style.
          </p>
          <p className="text-amber-400/80 text-[11px] font-medium mt-1.5 max-w-xl italic">
            Venue details are provided for convenience. Users should contact venues directly to confirm availability, pricing, and services.
          </p>
        </div>

        {isFree && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 max-w-sm flex items-start gap-3">
            <Icon icon="lucide:lightbulb" className="h-5 w-5 shrink-0 text-[#D8B76A]" />
            <div>
              <p className="text-xs font-semibold text-[#D8B76A] uppercase tracking-wider">Free Plan Preview</p>
              <p className="text-white/60 text-[11px] mt-0.5">Upgrade to Plus or Pro to see full addresses, exact pricing, and vendor contacts.</p>
              <Link to="/admin/billing" className="text-xs text-[#D8B76A] underline mt-1.5 inline-block font-semibold">
                <span className="inline-flex items-center gap-1">
                  Upgrade Workspace <Icon icon="lucide:arrow-right" className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Pro-only filters */}
      {isPro && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D8B76A]">Pro Smart Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search name or city..."
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Style */}
            <select
              className="rounded-xl border border-white/10 bg-[#090D19] px-4 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
            >
              <option value="">Any Style / Vibe</option>
              <option value="Classic">Classic Elegance</option>
              <option value="Modern">Sleek Modern</option>
              <option value="Beach">Waterfront / Beach</option>
              <option value="Rustic">Cozy Rustic Wood</option>
              <option value="Garden">Outdoor Garden</option>
            </select>

            {/* Capacity */}
            <select
              className="rounded-xl border border-white/10 bg-[#090D19] px-4 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              <option value="">Any Capacity</option>
              <option value="small">Small (&lt; 200 guests)</option>
              <option value="medium">Medium (200 - 500 guests)</option>
              <option value="large">Large (&gt; 500 guests)</option>
            </select>

            {/* Shortlisted */}
            <button
              onClick={() => setShortlistedOnly(!shortlistedOnly)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                shortlistedOnly
                  ? "bg-[#D8B76A] border-[#D8B76A] text-[#070A13]"
                  : "border-white/10 text-white/60 hover:bg-white/5"
              }`}
            >
              {shortlistedOnly ? (
                <span className="flex items-center justify-center gap-1">
                  <Icon icon="lucide:heart" className="w-3.5 h-3.5 fill-current text-[#070A13]" /> Shortlisted Only
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <Icon icon="lucide:heart" className="w-3.5 h-3.5 text-white/60" /> Filter Shortlisted
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-3xl border border-white/10 bg-[#0D1220] p-5 space-y-4">
              <div className="h-48 w-full rounded-2xl bg-white/5" />
              <div className="space-y-2">
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </div>
              <div className="pt-4 flex gap-3 border-t border-white/5">
                <div className="h-8 flex-1 bg-white/5 rounded-xl" />
                <div className="h-8 flex-1 bg-white/5 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center animate-fade-in">
          <p className="text-white/40 text-sm">No venues match your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => {
            const shortlisted = isShortlisted(venue._id);
            return (
              <div
                key={venue._id}
                className="rounded-3xl border border-white/10 bg-[#0D1220] overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300 relative"
              >
                {/* Placement Badge */}
                {venue.isFeatured && (
                  <span className="absolute top-4 left-4 z-10 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#070A13] shadow-md">
                    {venue.subscriptionTier === "featured" ? "Sponsored" : "Featured"}
                  </span>
                )}

                {/* Shortlist Heart Button (Pro Only or Upgrades) */}
                <button
                  onClick={() => handleShortlistToggle(venue._id)}
                  className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm transition hover:scale-115"
                >
                  <Icon
                    icon="lucide:heart"
                    className={`w-4 h-4 ${shortlisted ? "text-red-500 fill-current" : "text-white/60"}`}
                  />
                </button>

                {/* Photo */}
                <Link to={`/admin/venues/${venue._id}`} className="h-48 overflow-hidden bg-white/5 relative block group">
                  <img
                    src={venue.photos && venue.photos.length > 0 && venue.photos[0] ? venue.photos[0] : "/default_venue.svg"}
                    alt={venue.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default_venue.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0D1220] to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-5 right-5 flex justify-between items-baseline z-10">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] bg-[#D8B76A]/10 border border-[#D8B76A]/20 px-2 py-0.5 rounded-full">
                      {venue.style}
                    </span>
                    <span className="text-white/50 text-[11px] font-medium">{venue.city}</span>
                  </div>
                </Link>

                {/* Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-6">
                    <div>
                      <h3 className="font-serif text-xl text-white leading-tight">
                        <Link to={`/admin/venues/${venue._id}`} className="hover:text-[#D8B76A] transition">
                          {venue.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-white/40 mt-1">Capacity: {venue.capacity}</p>
                      {venue.tags && venue.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {venue.tags.map((t, idx) => (
                            <span key={idx} className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-white/60 text-xs leading-relaxed line-clamp-3">{venue.description}</p>

                    {/* Locked fields block */}
                    {isFree ? (
                      <div className="space-y-2 py-2 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-white/30">
                          <Icon icon="lucide:lock" className="h-3.5 w-3.5 shrink-0" />
                          <span className="blur-xs">Price Range: ₦1,500,000</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/30">
                          <Icon icon="lucide:lock" className="h-3.5 w-3.5 shrink-0" />
                          <span className="blur-xs">Address: Plot 14 Admiralty Way, Lekki</span>
                        </div>
                      </div>
                    ) : (
                      // Unlocked fields block
                      <div className="space-y-2 py-2 border-t border-white/5 text-xs text-white/80">
                        <div className="flex justify-between">
                          <span className="text-white/40">Cost:</span>
                          <span className="font-semibold text-emerald-400">{venue.priceRange}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Address:</span>
                          <p className="text-white/70 mt-0.5">{venue.fullAddress}</p>
                        </div>
                        {venue.website && (
                          <div className="flex justify-between mt-1 pt-1 border-t border-white/5">
                            <span className="text-white/40">Website:</span>
                            <a 
                              href={venue.website.startsWith('http') ? venue.website : `https://${venue.website}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[#D8B76A] hover:underline"
                            >
                              {venue.website.replace(/https?:\/\/(www\.)?/, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons based on tiers */}
                  {isFree ? (
                    <div className="space-y-2">
                      <Link
                        to={`/admin/venues/${venue._id}`}
                        className="w-full text-center bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#D8B76A]/20 transition block"
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Icon icon="lucide:search" className="h-3.5 w-3.5" />
                          Preview Venue Details
                        </span>
                      </Link>
                      <Link
                        to="/admin/billing"
                        className="w-full text-center bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:shadow-[0_4px_12px_rgba(216,183,106,0.15)] transition block"
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Icon icon="lucide:lock" className="h-3.5 w-3.5" />
                          Unlock Venue Details
                        </span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Details Link */}
                        <Link
                          to={`/admin/venues/${venue._id}`}
                          className="text-center bg-[#D8B76A]/10 hover:bg-[#D8B76A]/20 text-[#D8B76A] border border-[#D8B76A]/30 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Icon icon="lucide:search" className="h-3.5 w-3.5" />
                          Details
                        </Link>
                        {/* WhatsApp Contact */}
                        <a
                          href={`https://wa.me/${venue.whatsapp}?text=${encodeURIComponent(
                            `Hi! We are viewing ${venue.name} on VowLink and would love to check rates and available dates.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center bg-[#25D366] text-[#070A13] py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5"
                        >
                          <Icon icon="ri:whatsapp-line" className="h-3.5 w-3.5" />
                          Chat
                        </a>
                      </div>

                      {/* Direct Inquiry button for Pro only */}
                      <button
                        onClick={() => handleOpenInquiry(venue)}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                          isPro
                            ? "bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] hover:shadow-[0_4px_12px_rgba(216,183,106,0.15)]"
                            : "bg-white/5 text-white/30 border border-dashed border-white/10 cursor-not-allowed"
                        }`}
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Icon icon="lucide:send" className="h-3.5 w-3.5" />
                          {isPro ? "Send Direct Inquiry" : "Direct Inquiry (Pro Only)"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inquiry Modal */}
      {isInquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#D8B76A]/20 bg-[#0D1220] p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsInquiryOpen(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition text-lg"
            >
              <Icon icon="lucide:x" className="h-4 w-4" />
            </button>

            <h3 className="font-serif text-2xl mb-1">Direct Venue Inquiry</h3>
            <p className="text-white/40 text-xs">
              Sending a message to <span className="text-[#D8B76A] font-semibold">{selectedVenue?.name}</span>
            </p>

            <form onSubmit={handleSendInquiry} className="space-y-4 mt-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5">Your Message *</label>
                <textarea
                  required
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#D8B76A]/60 outline-none resize-none"
                  value={inquiryMsg}
                  onChange={(e) => setInquiryMsg(e.target.value)}
                />
              </div>

              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-start gap-2.5">
                <span className="text-xs mt-0.5">ℹ</span>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Your VowLink partner names and registered email address ({user.email}) will automatically be attached to this inquiry for the venue manager to review and reply.
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingInquiry}
                className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-xs font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submittingInquiry ? "Sending..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVenuesPage;
