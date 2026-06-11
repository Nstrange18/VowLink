import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";

const VenueDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  
  // Slideshow state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Inquiry form states
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const tier = user.tier || "free";
  const isFree = tier === "free";
  const isPlus = tier === "plus";
  const isPro = tier === "pro";

  const fetchVenue = async () => {
    try {
      const res = await api.get(`/venues/${id}`);
      setVenue(res.data);
      setActivePhotoIndex(0);
    } catch (err) {
      toast.error("Failed to load venue details.");
      navigate("/admin/venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenue();
  }, [id]);

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!isPro) {
      toast.info("Direct inquiries are a Pro feature! Upgrade to unlock.");
      navigate("/admin/billing");
      return;
    }
    if (!inquiryMsg.trim()) {
      toast.warning("Please type a message before sending.");
      return;
    }

    setSubmittingInquiry(true);
    try {
      const res = await api.post("/venues/inquire", {
        venueId: venue._id,
        message: inquiryMsg,
      });
      toast.success(res.data.message);
      setInquiryMsg("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Inquiry failed to send.");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#D8B76A] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white/40 text-sm tracking-widest uppercase">Loading Venue Details...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center">
        <p className="text-white/50 text-sm">Venue not found.</p>
        <Link to="/admin/venues" className="text-[#D8B76A] underline mt-4 inline-block">
          Return to Suggested Venues
        </Link>
      </div>
    );
  }

  // Retrieve safety checklist from venue DB fields
  const safetyChecklist = [
    { name: "Certified Fire Extinguishers & Exit Signage", checked: !!venue.safetyFireExits },
    { name: "24/7 Professional Guard Security Personnel", checked: !!venue.safetySecurity },
    { name: "Structural Integrity and Safety Certification", checked: !!venue.safetyStructural },
    { name: "Public Liability and Venue Insurance Coverage", checked: !!venue.safetyInsurance },
    { name: "Full CCTV Coverage in Public/Parking Areas", checked: !!venue.safetyCctv },
  ];

  const trustScore = (venue.trustScore !== undefined && venue.trustScore > 0) ? venue.trustScore : null;
  const trustVerified = trustScore !== null;

  // Determine active photos list
  const photosList = venue.photos && venue.photos.length > 0 ? venue.photos : ["/default_venue.svg"];
  const currentPhoto = photosList[activePhotoIndex] || "/default_venue.svg";

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          to="/admin/venues"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#D8B76A] hover:text-[#F2D894] transition"
        >
          <span>←</span> Back to Suggested Venues
        </Link>
      </div>

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-3xl sm:text-4xl text-white">{venue.name}</h1>
            {venue.isFeatured && (
              <span className="rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#070A13] shadow-md">
                Sponsored
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm mt-1">{venue.city} &bull; {venue.style} Style</p>
        </div>

        {isFree && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-xs font-semibold text-[#D8B76A] uppercase tracking-wider">Free Preview Mode</p>
              <p className="text-white/60 text-[10px] mt-0.5">Upgrade to unlock exact address, maps & manager contacts.</p>
              <Link to="/admin/billing" className="text-xs text-[#D8B76A] underline font-bold mt-1 inline-block">
                Upgrade Workspace →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Photo Slideshow & Specifications */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Photo Slideshow */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-4 space-y-4">
            <div className="h-64 sm:h-96 w-full rounded-2xl overflow-hidden bg-white/5 relative">
              <img
                src={currentPhoto}
                alt={venue.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default_venue.svg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1220]/80 via-transparent to-transparent" />
            </div>

            {/* Thumbnail Navigation */}
            {photosList.length > 1 && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {photosList.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhotoIndex(index)}
                    className={`h-16 w-20 rounded-xl overflow-hidden border-2 bg-white/5 transition duration-200 ${
                      activePhotoIndex === index ? "border-[#D8B76A] scale-95" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={photo}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default_venue.svg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Tags */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-4">
            <h3 className="font-serif text-xl text-white">About the Venue</h3>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{venue.description}</p>
            
            {venue.tags && venue.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                {venue.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/70"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-4">
            <h3 className="font-serif text-xl text-white">Specifications</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] block mb-1">Style</span>
                <span className="text-sm font-semibold text-white">{venue.style}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] block mb-1">Capacity</span>
                <span className="text-sm font-semibold text-white">{venue.capacity}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] block mb-1">Price Range</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {isFree ? "🔒 Locked" : venue.priceRange}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] block mb-1">Location</span>
                <span className="text-sm font-semibold text-white">{venue.generalLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact, Trust/Safety & Direct Inquiry */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Trust Score & Safety Checklist */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-white">Trust & Safety</h3>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                trustVerified
                  ? trustScore >= 7
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-white/5 border border-white/15 text-white/40"
              }`}>
                <span className="text-[10px] uppercase font-bold tracking-wider">Score</span>
                <span className="text-xs font-bold font-mono">{trustVerified ? `${trustScore}/10` : "—"}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3.5">
              <p className="text-xs text-white/50 leading-relaxed">
                VowLink safety standards checklist verified by administration:
              </p>
              
              <div className="space-y-3">
                {safetyChecklist.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-2.5 ${item.checked ? "" : "opacity-40"}`}>
                    {item.checked ? (
                      <span className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] flex items-center justify-center font-bold mt-0.5 shrink-0">
                        ✓
                      </span>
                    ) : (
                      <span className="h-4 w-4 rounded-full bg-white/5 border border-white/10 text-white/30 text-[9px] flex items-center justify-center font-bold mt-0.5 shrink-0">
                        ✕
                      </span>
                    )}
                    <span className={`text-xs leading-snug ${item.checked ? "text-white/80" : "text-white/50 line-through decoration-white/20"}`}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Details & Maps */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-6">
            <h3 className="font-serif text-lg text-white">Location & Contact</h3>

            {isFree ? (
              // Locked View
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-3">
                  <span className="text-2xl block">🔒</span>
                  <p className="text-xs text-white/60">
                    Contact numbers, WhatsApp chats, full address and Google maps references are locked on the Free Plan.
                  </p>
                  <Link
                    to="/admin/billing"
                    className="w-full text-center bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] py-2 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#D8B76A]/20 transition inline-block"
                  >
                    Unlock Marketplace Details
                  </Link>
                </div>
              </div>
            ) : (
              // Unlocked View
              <div className="space-y-5">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] block mb-1">Full Address</span>
                    <p className="text-xs text-white/80 leading-relaxed">{venue.fullAddress}</p>
                  </div>

                  {venue.phone && (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] block mb-1">Phone Contact</span>
                      <p className="text-xs text-white/80">{venue.phone}</p>
                    </div>
                  )}

                  {venue.website && (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] block mb-1">Website Link</span>
                      <a
                        href={venue.website.startsWith("http") ? venue.website : `https://${venue.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#D8B76A] hover:underline break-all"
                      >
                        {venue.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Grid for Maps & WhatsApp buttons */}
                <div className="grid grid-cols-2 gap-3.5">
                  <a
                    href={venue.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    🗺 Directions
                  </a>
                  
                  <a
                    href={`https://wa.me/${venue.whatsapp}?text=${encodeURIComponent(
                      `Hi! We are viewing ${venue.name} on VowLink and would love to check rates and available dates.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center bg-[#25D366] text-[#070A13] py-2.5 rounded-xl text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5"
                  >
                    📲 WhatsApp
                  </a>
                </div>

                {/* Maps Frame / Embed Map Placeholder */}
                <div className="rounded-xl overflow-hidden border border-white/10 h-36 bg-[#070A13] flex flex-col items-center justify-center text-center p-4 relative group">
                  <span className="text-2xl mb-1 text-white/40">📍</span>
                  <span className="text-[10px] text-white/50 max-w-40 leading-snug">Interactive Navigation Maps Link Connected</span>
                  <a
                    href={venue.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] uppercase tracking-wider font-bold text-[#D8B76A] transition-all duration-300"
                  >
                    Open Google Maps ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Direct Inquiry Form */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-4">
            <h3 className="font-serif text-lg text-white">Direct Inquiry</h3>

            {!isPro ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-3">
                <span className="text-xl block">✉️</span>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Direct lead communication and quotes submission requires a Pro Subscription.
                </p>
                <Link
                  to="/admin/billing"
                  className="w-full text-center bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] py-2 rounded-xl text-xs font-semibold uppercase tracking-wider hover:opacity-95 transition inline-block"
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5">Your Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Inquire about custom dates, packages, catering options, etc..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-white/30 focus:border-[#D8B76A]/60 outline-none resize-none"
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                  />
                </div>

                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-[9px] text-white/40 leading-normal">
                    Your names and email ({user.email}) will automatically be shared with the venue manager.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full rounded-xl bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#070A13] transition hover:opacity-95 disabled:opacity-60"
                >
                  {submittingInquiry ? "Sending..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default VenueDetailsPage;
