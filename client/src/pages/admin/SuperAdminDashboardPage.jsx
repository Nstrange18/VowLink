import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { Icon } from "@iconify/react";

const getVenueVerifiedClaims = (venue) =>
  [
    venue.safetyFireExits,
    venue.safetySecurity,
    venue.safetyStructural,
    venue.safetyInsurance,
    venue.safetyCctv,
  ].filter(Boolean).length;

const isVenueTrustVerified = (venue) => {
  const status = venue?.verificationStatus;
  const hasVerifiedClaims = getVenueVerifiedClaims(venue) > 0 || (venue?.trustScore || 0) > 0;
  if (status === "verified") return hasVerifiedClaims;
  if (["pending_review", "changes_requested", "rejected"].includes(status)) return false;
  return hasVerifiedClaims;
};

const getVerificationStatusLabel = (status) => {
  const labels = {
    not_submitted: "Not submitted",
    pending_review: "Needs review",
    verified: "Verified",
    changes_requested: "Changes requested",
    rejected: "Rejected",
  };
  return labels[status] || "Not submitted";
};

const isVenuePublicReady = (venue) => {
  const photos = Array.isArray(venue?.photos) ? venue.photos.filter(Boolean) : [];
  const proofUrls = Array.isArray(venue?.verificationProofUrls) ? venue.verificationProofUrls.filter(Boolean) : [];

  return Boolean(
    venue?.isApproved &&
      venue?.isActive !== false &&
      (venue?.description || "").trim().length >= 80 &&
      (venue?.city || "").trim() &&
      (venue?.generalLocation || "").trim() &&
      (venue?.fullAddress || "").trim() &&
      (venue?.whatsapp || "").trim() &&
      (venue?.mapLink || "").trim() &&
      (venue?.priceRange || "").trim() &&
      photos.length >= 3 &&
      (proofUrls.length > 0 || (venue?.verificationProofUrl || "").trim())
  );
};

const getVenueStage = (venue) => {
  if (!venue?.isApproved) return { label: "Needs approval", tone: "text-red-300 bg-red-500/10 border-red-500/25" };
  if (venue?.isActive === false) return { label: "Suspended", tone: "text-amber-300 bg-amber-500/10 border-amber-400/25" };
  if (venue?.verificationStatus === "changes_requested") return { label: "Changes requested", tone: "text-amber-200 bg-amber-400/10 border-amber-400/25" };
  if (venue?.verificationStatus === "pending_review") return { label: "Review proof", tone: "text-sky-200 bg-sky-400/10 border-sky-400/25" };
  if (isVenuePublicReady(venue)) return { label: "Live", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" };
  return { label: "Approved, hidden", tone: "text-white/55 bg-white/5 border-white/10" };
};

const getInquiryStatusLabel = (status = "new") => {
  const labels = {
    new: "New",
    contacted: "Contacted",
    inspection_booked: "Inspection booked",
    replied: "Replied",
    unavailable: "Unavailable",
    booked_elsewhere: "Booked elsewhere",
    archived: "Archived",
  };
  return labels[status] || "New";
};

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analytics");
  const [venueFilter, setVenueFilter] = useState("all");
  const [venues, setVenues] = useState([]);
  const [couples, setCouples] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Deletion confirmation modals
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [coupleToDelete, setCoupleToDelete] = useState(null);
  const [deletingVenue, setDeletingVenue] = useState(false);
  const [deletingCouple, setDeletingCouple] = useState(false);

  // Verification Edit inline states
  const [verifyingVenueId, setVerifyingVenueId] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    safetyFireExits: false,
    safetyCctv: false,
    safetySecurity: false,
    safetyStructural: false,
    safetyInsurance: false,
    trustScore: 0,
    verificationStatus: "verified",
    verificationNotes: "",
  });

  const setActionBusy = (key, busy) => {
    setActionLoading((prev) => {
      if (busy) return { ...prev, [key]: true };
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCheckboxChange = (field, checked) => {
    setVerificationForm((prev) => {
      const next = { ...prev, [field]: checked };
      let score = 0;
      if (next.safetyFireExits) score += 2;
      if (next.safetyCctv) score += 2;
      if (next.safetySecurity) score += 2;
      if (next.safetyStructural) score += 2;
      if (next.safetyInsurance) score += 2;
      next.trustScore = score;
      return next;
    });
  };

  const startVerificationEdit = (venue) => {
    setVerifyingVenueId(venue._id);
    setVerificationForm({
      safetyFireExits: !!venue.safetyFireExits,
      safetyCctv: !!venue.safetyCctv,
      safetySecurity: !!venue.safetySecurity,
      safetyStructural: !!venue.safetyStructural,
      safetyInsurance: !!venue.safetyInsurance,
      trustScore: venue.trustScore !== undefined ? venue.trustScore : 0,
      verificationStatus: venue.verificationStatus || "not_submitted",
      verificationNotes: venue.verificationNotes || "",
    });
  };

  const handleSaveVerification = async (venueId) => {
    const actionKey = `verify-${venueId}`;
    if (actionLoading[actionKey]) return;
    setActionBusy(actionKey, true);
    try {
      const res = await api.put(`/super-admin/venues/verify/${venueId}`, verificationForm);
      toast.success("Verification saved.");
      setVenues((prev) =>
        prev.map((v) =>
          v._id === venueId ? { ...v, ...res.data.venue } : v
        )
      );
      setVerifyingVenueId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save verification. Please try again.");
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [venuesRes, couplesRes, inquiriesRes] = await Promise.all([
        api.get("/super-admin/venues"),
        api.get("/super-admin/couples"),
        api.get("/super-admin/inquiries"),
      ]);
      setVenues(venuesRes.data);
      setCouples(couplesRes.data);
      setInquiries(inquiriesRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load admin data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Venue actions
  const handleUpdateVenueStatus = async (venueId, status) => {
    const actionKey = `status-${venueId}`;
    if (actionLoading[actionKey]) return;
    setActionBusy(actionKey, true);
    try {
      const res = await api.post(`/super-admin/venues/status/${venueId}`, { status });
      toast.success(status === "approved" ? "Venue approved." : status === "active" ? "Venue activated." : "Venue suspended.");
      // Update local state
      setVenues((prev) =>
        prev.map((v) => (v._id === venueId ? { ...v, ...res.data.venue } : v))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update venue status.");
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  const handleToggleFeatured = async (venueId) => {
    const actionKey = `featured-${venueId}`;
    if (actionLoading[actionKey]) return;
    setActionBusy(actionKey, true);
    try {
      const res = await api.post(`/super-admin/venues/featured/${venueId}`);
      toast.success(res.data.venue.isFeatured ? "Venue featured." : "Featured placement removed.");
      setVenues((prev) =>
        prev.map((v) => (v._id === venueId ? { ...v, ...res.data.venue } : v))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update featured placement.");
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    setVenueToDelete(venueId);
  };

  const confirmDeleteVenue = async () => {
    if (!venueToDelete || deletingVenue) return;
    setDeletingVenue(true);
    try {
      await api.delete(`/super-admin/venues/${venueToDelete}`);
      toast.success("Venue deleted.");
      setVenues((prev) => prev.filter((v) => v._id !== venueToDelete));
      const inquiriesRes = await api.get("/super-admin/inquiries");
      setInquiries(inquiriesRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete venue.");
    } finally {
      setDeletingVenue(false);
      setVenueToDelete(null);
    }
  };

  // Couple actions
  const handleUpdateCoupleTier = async (userId, tier) => {
    const actionKey = `couple-tier-${userId}`;
    if (actionLoading[actionKey]) return;
    setActionBusy(actionKey, true);
    try {
      const res = await api.put(`/super-admin/couples/tier/${userId}`, { tier });
      toast.success("Couple plan updated.");
      setCouples((prev) =>
        prev.map((c) => (c._id === userId ? { ...c, tier: res.data.user.tier } : c))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update couple plan.");
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  const handleDeleteCouple = async (userId) => {
    setCoupleToDelete(userId);
  };

  const confirmDeleteCouple = async () => {
    if (!coupleToDelete || deletingCouple) return;
    setDeletingCouple(true);
    try {
      await api.delete(`/super-admin/couples/${coupleToDelete}`);
      toast.success("Couple account deleted.");
      setCouples((prev) => prev.filter((c) => c._id !== coupleToDelete));
      const inquiriesRes = await api.get("/super-admin/inquiries");
      setInquiries(inquiriesRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete couple account.");
    } finally {
      setDeletingCouple(false);
      setCoupleToDelete(null);
    }
  };

  // Calculations
  const stats = {
    totalCouples: couples.length,
    unpaidCouples: couples.filter((c) => (c.tier || "unpaid") === "unpaid").length,
    classicCouples: couples.filter((c) => c.tier === "free").length,
    plusCouples: couples.filter((c) => c.tier === "plus").length,
    proCouples: couples.filter((c) => c.tier === "pro").length,
    totalVenues: venues.length,
    approvedVenues: venues.filter((v) => v.isApproved).length,
    pendingVenues: venues.filter((v) => !v.isApproved).length,
    verifiedVenues: venues.filter(isVenueTrustVerified).length,
    pendingVerificationVenues: venues.filter((v) => v.verificationStatus === "pending_review").length,
    featuredVenues: venues.filter((v) => v.isFeatured).length,
    paidFeaturedVenues: venues.filter((v) => v.subscriptionTier === "featured").length,
    manualFeaturedVenues: venues.filter((v) => v.isFeatured && v.subscriptionTier !== "featured").length,
    totalInquiries: inquiries.length,
  };

  const getCoupleTierMeta = (tier = "unpaid") => {
    if (tier === "pro") return { label: "Pro", icon: "lucide:crown", className: "border-amber-400/30 bg-amber-400/15 text-amber-200" };
    if (tier === "plus") return { label: "Plus", icon: "lucide:sparkles", className: "border-[#7FA6D9]/30 bg-[#7FA6D9]/15 text-[#B9D4F4]" };
    if (tier === "free") return { label: "Classic", icon: "lucide:badge-check", className: "border-[#D8B76A]/30 bg-[#D8B76A]/15 text-[#F2D894]" };
    return { label: "Trial", icon: "lucide:timer", className: "border-[#7FA6D9]/25 bg-[#7FA6D9]/15 text-[#B9D4F4]" };
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-white">

      {/* ── Venue Deletion Confirmation Modal ── */}
      {venueToDelete && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deletingVenue && setVenueToDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/25 bg-[#0D1220] p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <Icon icon="lucide:trash-2" className="text-2xl text-red-500 shrink-0" />
              <h2 className="font-serif text-xl text-white">Delete Venue?</h2>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Are you sure you want to <span className="text-red-400 font-semibold">permanently delete</span> this venue listing?
              This will also cascade-delete all inquiry logs tied to it.
              <span className="block mt-2 text-red-400/80 font-semibold">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setVenueToDelete(null)}
                disabled={deletingVenue}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVenue}
                disabled={deletingVenue}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition cursor-pointer shadow-lg shadow-red-500/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Icon icon={deletingVenue ? "lucide:loader-2" : "lucide:trash-2"} className={`h-4 w-4 ${deletingVenue ? "animate-spin" : ""}`} />
                {deletingVenue ? "Deleting..." : "Yes, Delete Venue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Couple Deletion Confirmation Modal ── */}
      {coupleToDelete && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deletingCouple && setCoupleToDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/25 bg-[#0D1220] p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <Icon icon="lucide:alert-triangle" className="text-2xl text-red-500 shrink-0" />
              <h2 className="font-serif text-xl text-white">Delete Couple Account?</h2>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              This will <span className="text-red-400 font-semibold">permanently delete</span> this couple's workspace, including all of their:
            </p>
            <ul className="text-sm text-white/50 space-y-1 ml-4 list-disc">
              <li>Wedding invitation settings & themes</li>
              <li>Guest RSVP records</li>
              <li>All inquiry logs to venues</li>
            </ul>
            <p className="text-red-400/90 font-bold text-sm flex items-center gap-1.5">
              <Icon icon="lucide:alert-triangle" className="w-4 h-4 text-red-500 shrink-0" />
              <span>This action CANNOT be undone.</span>
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setCoupleToDelete(null)}
                disabled={deletingCouple}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCouple}
                disabled={deletingCouple}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition cursor-pointer shadow-lg shadow-red-500/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Icon icon={deletingCouple ? "lucide:loader-2" : "lucide:trash-2"} className={`h-4 w-4 ${deletingCouple ? "animate-spin" : ""}`} />
                {deletingCouple ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-6 flex-wrap gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-[#D8B76A]">Operations</span>
          <h1 className="font-serif text-3xl sm:text-4xl mt-1">Super admin</h1>
          <p className="text-white/40 text-xs mt-1">Review venues, manage couple plans, and monitor marketplace activity.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] text-xs font-semibold tracking-wider hover:bg-[#D8B76A]/20 transition cursor-pointer"
          >
            <Icon icon="ph:rings-bold" className="w-4 h-4" /> Couple workspace
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5"
          >
            <Icon icon="lucide:refresh-cw" className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Couples */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-4 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col xs:flex-row justify-between items-start gap-2">
            <Icon icon="ph:rings-bold" className="text-2xl text-emerald-400 shrink-0" />
            <span className="text-[9px] sm:text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">Active</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight mt-4">{stats.totalCouples}</p>
          <h3 className="text-[10px] sm:text-xs text-white/50 font-medium mt-1 leading-tight">Couple workspaces</h3>
          <p className="text-[10px] text-white/35 mt-2">Trial: {stats.unpaidCouples} | Classic: {stats.classicCouples} | Plus: {stats.plusCouples} | Pro: {stats.proCouples}</p>
        </div>

        {/* Total Venues */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-4 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col xs:flex-row justify-between items-start gap-2">
            <Icon icon="lucide:building-2" className="text-2xl text-[#D8B76A] shrink-0" />
            <span className="text-[9px] sm:text-[10px] bg-[#D8B76A]/10 border border-[#D8B76A]/20 text-[#D8B76A] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">Marketplace</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight mt-4">{stats.totalVenues}</p>
          <h3 className="text-[10px] sm:text-xs text-white/50 font-medium mt-1 leading-tight">Venue listings</h3>
          <p className="text-[10px] text-white/35 mt-2">Approved: {stats.approvedVenues} | Pending: {stats.pendingVenues}</p>
        </div>

        {/* Sponsored / Featured Listings */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-4 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col xs:flex-row justify-between items-start gap-2">
            <Icon icon="lucide:sparkles" className="text-2xl text-amber-400 shrink-0" />
            <span className="text-[9px] sm:text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">Featured</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight mt-4">{stats.featuredVenues}</p>
          <h3 className="text-[10px] sm:text-xs text-white/50 font-medium mt-1 leading-tight">Featured listings</h3>
          <p className="text-[10px] text-white/35 mt-2">Active top-placements in couple search</p>
        </div>

        {/* Direct leads inquiries */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-4 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col xs:flex-row justify-between items-start gap-2">
            <Icon icon="lucide:mail" className="text-2xl text-[#7FA6D9] shrink-0" />
            <span className="text-[9px] sm:text-[10px] bg-[#7FA6D9]/10 border border-[#7FA6D9]/20 text-[#7FA6D9] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">Leads</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight mt-4">{stats.totalInquiries}</p>
          <h3 className="text-[10px] sm:text-xs text-white/50 font-medium mt-1 leading-tight">Direct inquiries generated</h3>
          <p className="text-[10px] text-white/35 mt-2">Couples communicating with venues</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/15 gap-4 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition shrink-0 whitespace-nowrap ${
            activeTab === "analytics" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon icon="lucide:line-chart" className="w-3.5 h-3.5" /> Overview
          </span>
        </button>
        <button
          onClick={() => setActiveTab("venues")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition shrink-0 whitespace-nowrap ${
            activeTab === "venues" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon icon="lucide:building-2" className="w-3.5 h-3.5" /> Venues ({stats.pendingVenues} review)
          </span>
        </button>
        <button
          onClick={() => setActiveTab("couples")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition shrink-0 whitespace-nowrap ${
            activeTab === "couples" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon icon="ph:rings-bold" className="w-3.5 h-3.5" /> Couples ({stats.totalCouples})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition shrink-0 whitespace-nowrap ${
            activeTab === "inquiries" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon icon="lucide:mail" className="w-3.5 h-3.5" /> Inquiries ({stats.totalInquiries})
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {/* Couple stats card skeleton */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-6">
            <div className="h-5 bg-white/10 rounded w-1/2" />
            <div className="space-y-3">
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-full" />
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between">
              <div className="h-4 bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-white/10 rounded w-12" />
            </div>
          </div>

          {/* Venue stats card skeleton */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-6">
            <div className="h-5 bg-white/10 rounded w-1/2" />
            <div className="space-y-3">
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-full" />
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between">
              <div className="h-4 bg-white/5 rounded w-1/4" />
              <div className="h-4 bg-white/10 rounded w-12" />
            </div>
          </div>

          {/* Large bottom table skeleton */}
          <div className="col-span-1 md:col-span-2 rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-4">
            <div className="h-5 bg-white/10 rounded w-1/4" />
            <div className="space-y-2">
              <div className="h-10 bg-[#070A13] rounded-xl w-full" />
              <div className="h-10 bg-[#070A13] rounded-xl w-full" />
              <div className="h-10 bg-[#070A13] rounded-xl w-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: STATS OVERVIEW */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 items-start md:grid-cols-2 gap-6 animate-fade-in">
              <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-4">
                <h3 className="font-serif text-lg text-[#D8B76A]">Couples Workspace Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Trial onboarding accounts</span>
                    <span className="font-bold font-mono">{couples.filter((c) => (c.tier || "unpaid") === "unpaid").length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Classic Invitation accounts (NGN 30,000 upgrade)</span>
                    <span className="font-bold font-mono">{couples.filter((c) => c.tier === "free").length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Plus Invitation accounts (NGN 68,000 upgrade)</span>
                    <span className="font-bold font-mono text-[#7FA6D9]">{stats.plusCouples}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Pro Invitation accounts (NGN 120,000 upgrade)</span>
                    <span className="font-bold font-mono text-[#D8B76A]">{stats.proCouples}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-4">
                <h3 className="font-serif text-lg text-[#D8B76A]">Marketplace Venues Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Pending approval list</span>
                    <span className="font-bold font-mono text-rose-400">{stats.pendingVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Approved listings</span>
                    <span className="font-bold font-mono text-emerald-400">{stats.approvedVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Verified venues</span>
                    <span className="font-bold font-mono text-sky-300">{stats.verifiedVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Pending verification review</span>
                    <span className="font-bold font-mono text-amber-300">{stats.pendingVerificationVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Featured placement (paid + manual)</span>
                    <span className="font-bold font-mono text-[#D8B76A]">{stats.featuredVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Paid Featured tier (NGN 50,000/mo)</span>
                    <span className="font-bold font-mono text-amber-300">{stats.paidFeaturedVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Manual featured grants</span>
                    <span className="font-bold font-mono text-amber-300">{stats.manualFeaturedVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Priority Listed tier (NGN 20,000/mo)</span>
                    <span className="font-bold font-mono text-[#7FA6D9]">{venues.filter((v) => v.subscriptionTier === "listed").length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENUES MANAGEMENT */}
          {activeTab === "venues" && (
            <div className="space-y-4 animate-fade-in">
              {/* Filter Bar */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "all",      label: "All",      count: venues.length },
                  { key: "pending",  label: "Needs Approval", icon: "lucide:stamp",  count: venues.filter(v => !v.isApproved).length },
                  { key: "live", label: "Live", icon: "lucide:eye", count: venues.filter(isVenuePublicReady).length },
                  { key: "verified", label: "Verified", icon: "mdi:shield-check-outline", count: venues.filter(isVenueTrustVerified).length },
                  { key: "pendingVerification", label: "Needs Review", icon: "mdi:shield-clock-outline", count: venues.filter(v => v.verificationStatus === "pending_review").length },
                  { key: "changesRequested", label: "Needs Changes", icon: "lucide:file-warning", count: venues.filter(v => v.verificationStatus === "changes_requested").length },
                  { key: "paused", label: "Suspended", icon: "lucide:pause-circle", count: venues.filter(v => v.isActive === false).length },
                  { key: "sponsored", label: "Sponsored", icon: "mdi:star-four-points", count: venues.filter(v => v.subscriptionTier === "featured").length },
                  { key: "manualFeatured", label: "Manual Featured", icon: "mdi:star", count: venues.filter(v => v.isFeatured && v.subscriptionTier !== "featured").length },
                ].map(({ key, label, icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setVenueFilter(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition ${
                      venueFilter === key
                        ? key === "pending"
                          ? "bg-red-500/20 border-red-500/40 text-red-400"
                          : key === "sponsored" || key === "manualFeatured"
                          ? "bg-[#D8B76A]/20 border-[#D8B76A]/40 text-[#D8B76A]"
                          : key === "pendingVerification"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : key === "verified"
                          ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                          : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {icon && <Icon icon={icon} className="w-3 h-3 shrink-0" />}
                    <span>{label}</span>
                    <span className="bg-white/10 rounded-full px-1.5 py-0.5 font-mono text-[9px]">{count}</span>
                  </button>
                ))}
              </div>

              {[
                ...venues.filter(v => v.isApproved),
                ...venues.filter(v => !v.isApproved),
              ].filter((v) => {
                if (venueFilter === "pending") return !v.isApproved;
                if (venueFilter === "live") return isVenuePublicReady(v);
                if (venueFilter === "verified") return isVenueTrustVerified(v);
                if (venueFilter === "pendingVerification") return v.verificationStatus === "pending_review";
                if (venueFilter === "changesRequested") return v.verificationStatus === "changes_requested";
                if (venueFilter === "paused") return v.isActive === false;
                if (venueFilter === "sponsored") return v.subscriptionTier === "featured";
                if (venueFilter === "manualFeatured") return v.isFeatured && v.subscriptionTier !== "featured";
                return true;
              }).length === 0 ? (
                <p className="text-center text-xs text-white/40 py-10 bg-[#0D1220] rounded-3xl border border-white/10">No venues match this filter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {[
                    ...venues.filter(v => v.isApproved),
                    ...venues.filter(v => !v.isApproved),
                  ].filter((v) => {
                    if (venueFilter === "pending") return !v.isApproved;
                    if (venueFilter === "live") return isVenuePublicReady(v);
                    if (venueFilter === "verified") return isVenueTrustVerified(v);
                    if (venueFilter === "pendingVerification") return v.verificationStatus === "pending_review";
                    if (venueFilter === "changesRequested") return v.verificationStatus === "changes_requested";
                    if (venueFilter === "paused") return v.isActive === false;
                    if (venueFilter === "sponsored") return v.subscriptionTier === "featured";
                    if (venueFilter === "manualFeatured") return v.isFeatured && v.subscriptionTier !== "featured";
                    return true;
                  }).map((venue) => {
                    const verifiedClaims = getVenueVerifiedClaims(venue);
                    const isVerified = isVenueTrustVerified(venue);
                    const statusBusy = !!actionLoading[`status-${venue._id}`];
                    const featuredBusy = !!actionLoading[`featured-${venue._id}`];
                    const verificationBusy = !!actionLoading[`verify-${venue._id}`];
                    const venueStage = getVenueStage(venue);
                    const recentVenueActivity = Array.isArray(venue.activityLog) ? venue.activityLog.slice(0, 3) : [];

                    return (

                    <div
                      key={venue._id}
                      className={`rounded-3xl border p-5 bg-[#0D1220] flex flex-col justify-between transition relative ${
                        !venue.isApproved ? "border-red-500/20 bg-[#1e0f12]/10" : "border-white/10"
                      }`}
                    >
                      <div>
                        {/* Approval, verification, and placement badges */}
                        <div className="flex gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${venueStage.tone}`}>
                            {venueStage.label}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            venue.isApproved ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                          }`}>
                            Listing: {venue.isApproved ? "Approved" : "Needs approval"}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            venue.verificationStatus === "pending_review"
                              ? "bg-amber-500/10 text-amber-300 border-amber-400/25"
                              : isVerified
                                ? "bg-sky-500/10 text-sky-300 border-sky-400/20"
                                : "bg-white/5 text-white/45 border-white/10"
                          }`}>
                            Verification: {venue.verificationStatus === "pending_review" ? "Needs review" : isVerified ? `${verifiedClaims} checks` : getVerificationStatusLabel(venue.verificationStatus)}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            venue.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {venue.isActive ? "Active" : "Suspended"}
                          </span>
                          <span className="text-[9px] font-mono text-[#D8B76A] bg-[#D8B76A]/10 px-2 py-0.5 rounded-full uppercase">
                            Plan: {venue.subscriptionTier}
                          </span>
                          {venue.isFeatured && (
                            <span className="text-[9px] font-bold text-[#070A13] bg-[#D8B76A] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <span className="inline-flex items-center gap-1">
                                <Icon icon="mdi:star" className="w-3 h-3 shrink-0" />
                                {venue.subscriptionTier === "featured" ? "Paid Featured" : "Manual Featured"}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Title & Details */}
                        <div className="mt-4">
                          <h3 className="font-serif text-lg text-white font-semibold">{venue.name}</h3>
                          <p className="text-xs text-white/40">{venue.city} • {venue.style}</p>
                          
                          <div className="mt-3 space-y-1 text-[11px] text-white/60 font-mono">
                            <p className="flex items-center gap-1.5">
                              <Icon icon="mdi:email-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                              <span>Owner: {venue.ownerEmail}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Icon icon="mdi:phone-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                              <span>Phone: {venue.phone}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Icon icon="mdi:cash-multiple" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                              <span>Price Range: {venue.priceRange}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Icon icon="mdi:ticket-confirmation-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                              <span>Inquiries: {venue.inquiries || 0} leads | Views: {venue.views || 0}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Icon icon="mdi:shield-check-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                              <span>Safety: {
                              [
                                venue.safetyFireExits && "Fire Exits",
                                venue.safetySecurity && "Security",
                                venue.safetyStructural && "Structural",
                                venue.safetyInsurance && "Insurance",
                                venue.safetyCctv && "CCTV"
                              ].filter(Boolean).join(", ") || "No checks verified"
                            }</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Icon icon="mdi:star-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                              <span>Trust Score: {venue.trustScore !== undefined && venue.trustScore > 0 ? `${venue.trustScore}/10` : "— (not verified yet)"}</span>
                            </p>
                            {venue.verificationNotes && (
                              <p className="text-[#D8B76A] italic flex items-center gap-1.5">
                                <Icon icon="mdi:note-edit-outline" className="w-3.5 h-3.5 shrink-0" />
                                <span>Admin Notes: {venue.verificationNotes}</span>
                              </p>
                            )}
                            {venue.reviewReason && (
                              <p className="text-amber-300 flex items-center gap-1.5">
                                <Icon icon="lucide:file-warning" className="w-3.5 h-3.5 shrink-0" />
                                <span>Owner sees: {venue.reviewReason}</span>
                              </p>
                            )}
                            {venue.verificationSubmittedAt && (
                              <p className="flex items-center gap-1.5">
                                <Icon icon="mdi:clock-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                                <span>Submitted: {new Date(venue.verificationSubmittedAt).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>
                          {recentVenueActivity.length > 0 && (
                            <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-3">
                              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/35">Recent activity</p>
                              <div className="space-y-2">
                                {recentVenueActivity.map((item, index) => (
                                  <div key={`${venue._id}-${item.createdAt || index}`} className="flex items-start justify-between gap-3 text-[10px]">
                                    <span className="text-white/65">{item.title}</span>
                                    {item.createdAt && <span className="shrink-0 text-white/30">{new Date(item.createdAt).toLocaleDateString()}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inline glassmorphic verification editor */}
                      {verifyingVenueId === venue._id && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-[#D8B76A]/20 space-y-3 animate-fade-in">
                          <h4 className="text-xs uppercase tracking-wider text-[#D8B76A] font-bold">Review trust and safety</h4>
                          
                          {/* Submitted Proof Links (supports both old single URL and new array) */}
                          {(() => {
                            const allProofs = [
                              ...(venue.verificationProofUrls || []),
                              ...(venue.verificationProofUrl && !venue.verificationProofUrls?.includes(venue.verificationProofUrl) ? [venue.verificationProofUrl] : []),
                            ];
                            return allProofs.length > 0 ? (
                              <div className="space-y-1.5">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-[#D8B76A] flex items-center gap-1.5">
                                  <Icon icon="mdi:folder-open-outline" className="w-3.5 h-3.5 shrink-0" />
                                  Submitted proof documents ({allProofs.length})
                                </span>
                                {allProofs.map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D8B76A]/10 text-[#D8B76A] hover:bg-[#D8B76A]/20 border border-[#D8B76A]/20 text-[10px] font-bold uppercase tracking-wider transition w-full justify-center"
                                  >
                                    <Icon icon="mdi:file-document-outline" className="w-3.5 h-3.5 shrink-0" />
                                    <span>Document {idx + 1} - Open</span>
                                    <Icon icon="lucide:arrow-right" className="w-3 h-3 shrink-0" />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-1 text-[10px] text-white/40 italic text-center p-2.5 border border-dashed border-white/10 rounded-xl">
                                No proof documents uploaded yet.
                              </div>
                            );
                          })()}

                          {/* Declarations by the Venue Owner */}
                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1.5 text-[11px] text-white/70">
                            <span className="font-bold text-[#D8B76A] block uppercase text-[9px] tracking-wider mb-0.5">Declared by Venue Owner:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                              <div className="flex items-center gap-1.5">
                                <Icon icon="mdi:fire-extinguisher" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                                <span>Fire Exits: <span className={venue.claimedFireExits ? "text-emerald-400 font-bold" : "text-white/40"}>{venue.claimedFireExits ? "Yes" : "No"}</span></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Icon icon="mdi:cctv" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                                <span>CCTV: <span className={venue.claimedCctv ? "text-emerald-400 font-bold" : "text-white/40"}>{venue.claimedCctv ? "Yes" : "No"}</span></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Icon icon="mdi:shield-lock-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                                <span>Security: <span className={venue.claimedSecurity ? "text-emerald-400 font-bold" : "text-white/40"}>{venue.claimedSecurity ? "Yes" : "No"}</span></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Icon icon="mdi:crane" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                                <span>Structural: <span className={venue.claimedStructural ? "text-emerald-400 font-bold" : "text-white/40"}>{venue.claimedStructural ? "Yes" : "No"}</span></span>
                              </div>
                              <div className="sm:col-span-2 flex items-center gap-1.5">
                                <Icon icon="mdi:briefcase-check-outline" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                                <span>Insurance: <span className={venue.claimedInsurance ? "text-emerald-400 font-bold" : "text-white/40"}>{venue.claimedInsurance ? "Yes" : "No"}</span></span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyFireExits}
                                onChange={(e) => handleCheckboxChange("safetyFireExits", e.target.checked)}
                                className="accent-[#D8B76A]"
                              />
                              Fire Exits & Signage
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyCctv}
                                onChange={(e) => handleCheckboxChange("safetyCctv", e.target.checked)}
                                className="accent-[#D8B76A]"
                              />
                              Full CCTV Coverage
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetySecurity}
                                onChange={(e) => handleCheckboxChange("safetySecurity", e.target.checked)}
                                className="accent-[#D8B76A]"
                              />
                              Guard Security Personnel
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyStructural}
                                onChange={(e) => handleCheckboxChange("safetyStructural", e.target.checked)}
                                className="accent-[#D8B76A]"
                              />
                              Structural Integrity
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyInsurance}
                                onChange={(e) => handleCheckboxChange("safetyInsurance", e.target.checked)}
                                className="accent-[#D8B76A]"
                              />
                              Venue Liability Insurance
                            </label>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Trust Score (0-10):</label>
                            <input
                              type="number"
                              disabled
                              value={verificationForm.trustScore}
                              className="w-20 rounded bg-[#070A13]/50 border border-white/10 px-2 py-1 text-xs text-white/50 cursor-not-allowed font-mono font-bold"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5 pt-2">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Review Decision:</label>
                            <select
                              value={verificationForm.verificationStatus}
                              onChange={(e) => setVerificationForm((prev) => ({ ...prev, verificationStatus: e.target.value }))}
                              className="w-full rounded-xl border bg-[#070A13]/50 border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-[#D8B76A]/60"
                            >
                              <option value="verified">Verified - publish approved checks</option>
                              <option value="changes_requested">Changes requested - ask for clearer proof</option>
                              <option value="rejected">Rejected - proof does not validate claims</option>
                              <option value="pending_review">Keep pending review</option>
                              <option value="not_submitted">Not submitted</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5 pt-2">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Verification Audit Notes / Feedback:</label>
                            <textarea
                              value={verificationForm.verificationNotes}
                              onChange={(e) => setVerificationForm((prev) => ({ ...prev, verificationNotes: e.target.value }))}
                              placeholder="Record verification review logs (e.g. document validity, expiry dates, or request details)..."
                              rows={3}
                              className="w-full rounded-xl border bg-[#070A13]/50 border-white/10 px-3 py-2 text-xs text-white placeholder-white/30 outline-none resize-none focus:border-[#D8B76A]/60"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => setVerifyingVenueId(null)}
                              disabled={verificationBusy}
                              className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveVerification(venue._id)}
                              disabled={verificationBusy}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded bg-[#D8B76A] text-[#070A13] hover:opacity-90 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Icon icon={verificationBusy ? "lucide:loader-2" : "mdi:shield-check-outline"} className={`w-3.5 h-3.5 shrink-0 ${verificationBusy ? "animate-spin" : ""}`} />
                              {verificationBusy ? "Saving..." : "Save review"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center gap-2 flex-wrap">
                        <div className="flex gap-2 flex-wrap">
                          {!venue.isApproved ? (
                            <button
                              onClick={() => handleUpdateVenueStatus(venue._id, "approved")}
                              disabled={statusBusy}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-bold text-[#070A13] hover:bg-emerald-400 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Icon icon={statusBusy ? "lucide:loader-2" : "mdi:check-circle-outline"} className={`w-3.5 h-3.5 shrink-0 ${statusBusy ? "animate-spin" : ""}`} />
                              {statusBusy ? "Approving..." : "Approve"}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUpdateVenueStatus(venue._id, venue.isActive ? "suspended" : "active")}
                                disabled={statusBusy}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
                                  venue.isActive ? "bg-amber-500 text-[#070A13] hover:bg-amber-400" : "bg-emerald-500 text-[#070A13] hover:bg-emerald-400"
                                }`}
                              >
                                <Icon icon={statusBusy ? "lucide:loader-2" : venue.isActive ? "mdi:pause-circle-outline" : "mdi:play-circle-outline"} className={`w-3.5 h-3.5 shrink-0 ${statusBusy ? "animate-spin" : ""}`} />
                                {statusBusy ? (venue.isActive ? "Suspending..." : "Activating...") : venue.isActive ? "Suspend" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(venue._id)}
                                disabled={featuredBusy}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
                                  venue.isFeatured ? "border-[#D8B76A] text-[#D8B76A] bg-[#D8B76A]/10 hover:bg-[#D8B76A]/20" : "border-white/20 text-white hover:bg-white/5"
                                }`}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <Icon icon={featuredBusy ? "lucide:loader-2" : "mdi:star"} className={`w-3.5 h-3.5 shrink-0 ${featuredBusy ? "animate-spin" : ""}`} />
                                  {featuredBusy
                                    ? venue.isFeatured
                                      ? "Removing..."
                                      : "Featuring..."
                                    : venue.isFeatured
                                      ? "Unfeature"
                                      : "Feature"}
                                </span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => startVerificationEdit(venue)}
                            disabled={verificationBusy}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/35 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Icon icon="mdi:shield-edit-outline" className="w-3.5 h-3.5 shrink-0" />
                              Review checks
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteVenue(venue._id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5 shrink-0" />
                            Delete
                          </span>
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COUPLES MANAGEMENT */}
          {activeTab === "couples" && (
            <div className="rounded-3xl border border-white/10 bg-[#0D1220] overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-white/50 text-[10px]">
                      <th className="p-4 font-bold">Couple Names</th>
                      <th className="p-4 font-bold">Email</th>
                      <th className="p-4 font-bold">Wedding Date</th>
                      <th className="p-4 font-bold">Active Tier</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {couples.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-white/30">No couple workspaces active.</td>
                      </tr>
                    ) : (
                      couples.map((couple) => {
                        const tierBusy = !!actionLoading[`couple-tier-${couple._id}`];
                        const tierMeta = getCoupleTierMeta(couple.tier);

                        return (
                        <tr key={couple._id} className="hover:bg-white/2 transition">
                          <td className="p-4 font-serif text-sm font-medium">
                            {couple.partner1Name} & {couple.partner2Name}
                          </td>
                          <td className="p-4 font-mono text-white/70">{couple.email}</td>
                          <td className="p-4 text-white/70">
                            {couple.weddingDate ? new Date(couple.weddingDate).toLocaleDateString() : "Not set"}
                          </td>
                          <td className="p-4">
                            <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tierMeta.className}`}>
                              <Icon icon={tierMeta.icon} className="h-3.5 w-3.5" />
                              {tierMeta.label}
                            </div>
                            <select
                              value={couple.tier}
                              onChange={(e) => handleUpdateCoupleTier(couple._id, e.target.value)}
                              disabled={tierBusy}
                              className="bg-[#070A13] border border-white/10 px-2 py-1 rounded text-xs outline-none text-white focus:border-[#D8B76A]/60 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="unpaid">Trial</option>
                              <option value="free">Classic Plan</option>
                              <option value="plus">Plus Plan</option>
                              <option value="pro">Pro Plan</option>
                            </select>
                            {tierBusy && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#D8B76A]">
                                <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" />
                                Saving
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteCouple(couple._id)}
                              disabled={tierBusy}
                              className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition text-[11px] font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5 shrink-0" />
                                Delete
                              </span>
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT INQUIRIES FEED */}
          {activeTab === "inquiries" && (
            <div className="space-y-4 animate-fade-in">
              {inquiries.length === 0 ? (
                <p className="text-center text-xs text-white/40 py-10 bg-[#0D1220] rounded-3xl border border-white/10">No inquiries logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <div key={inq._id} className="rounded-2xl border border-white/10 bg-[#0D1220] p-5 space-y-3 text-xs">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-white/80">
                            <span className="inline-flex items-center gap-1.5">
                              <Icon icon="mdi:ring" className="w-3.5 h-3.5 shrink-0 text-[#D8B76A]" />
                              {inq.user ? `${inq.user.partner1Name} & ${inq.user.partner2Name}` : "[Deleted Couple]"}
                            </span>
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Email: {inq.user?.email || "N/A"} • Date: {inq.user?.weddingDate ? new Date(inq.user.weddingDate).toLocaleDateString() : "N/A"}
                          </p>
                          <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/55">
                            {getInquiryStatusLabel(inq.status)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-[#D8B76A] font-semibold text-sm">
                            <span className="inline-flex items-center justify-end gap-1.5">
                              <Icon icon="mdi:castle" className="w-3.5 h-3.5 shrink-0" />
                              {inq.venue ? inq.venue.name : "[Deleted Venue]"}
                            </span>
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            City: {inq.venue?.city || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-white/75 font-mono leading-relaxed wrap-break-word whitespace-pre-wrap">
                        {inq.message}
                      </div>

                      <div className="flex justify-between text-[10px] text-white/30 italic pt-1 border-t border-white/5">
                        <span>Lead Generated: {new Date(inq.createdAt).toLocaleString()}</span>
                        {inq.statusHistory?.[0]?.createdAt && (
                          <span>Last update: {new Date(inq.statusHistory[0].createdAt).toLocaleString()}</span>
                        )}
                        <span>Direct Inquiry Log ID: {inq._id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboardPage;
