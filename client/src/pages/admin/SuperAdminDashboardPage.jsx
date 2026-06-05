import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analytics");
  const [venues, setVenues] = useState([]);
  const [couples, setCouples] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deletion confirmation modals
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [coupleToDelete, setCoupleToDelete] = useState(null);

  // Verification Edit inline states
  const [verifyingVenueId, setVerifyingVenueId] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    safetyFireExits: false,
    safetyCctv: false,
    safetySecurity: false,
    safetyStructural: false,
    safetyInsurance: false,
    trustScore: 9.0,
  });

  const startVerificationEdit = (venue) => {
    setVerifyingVenueId(venue._id);
    setVerificationForm({
      safetyFireExits: !!venue.safetyFireExits,
      safetyCctv: !!venue.safetyCctv,
      safetySecurity: !!venue.safetySecurity,
      safetyStructural: !!venue.safetyStructural,
      safetyInsurance: !!venue.safetyInsurance,
      trustScore: venue.trustScore !== undefined ? venue.trustScore : (venue.isFeatured ? 9.6 : 9.2),
    });
  };

  const handleSaveVerification = async (venueId) => {
    try {
      const res = await api.put(`/super-admin/venues/verify/${venueId}`, verificationForm);
      toast.success(res.data.message);
      setVenues((prev) =>
        prev.map((v) =>
          v._id === venueId
            ? {
                ...v,
                safetyFireExits: res.data.venue.safetyFireExits,
                safetyCctv: res.data.venue.safetyCctv,
                safetySecurity: res.data.venue.safetySecurity,
                safetyStructural: res.data.venue.safetyStructural,
                safetyInsurance: res.data.venue.safetyInsurance,
                trustScore: res.data.venue.trustScore,
              }
            : v
        )
      );
      setVerifyingVenueId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save verification settings.");
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
      toast.error(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Venue actions
  const handleUpdateVenueStatus = async (venueId, status) => {
    try {
      const res = await api.post(`/super-admin/venues/status/${venueId}`, { status });
      toast.success(res.data.message);
      // Update local state
      setVenues((prev) =>
        prev.map((v) => (v._id === venueId ? { ...v, isApproved: res.data.venue.isApproved, isActive: res.data.venue.isActive } : v))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    }
  };

  const handleToggleFeatured = async (venueId) => {
    try {
      const res = await api.post(`/super-admin/venues/featured/${venueId}`);
      toast.success(res.data.message);
      setVenues((prev) =>
        prev.map((v) => (v._id === venueId ? { ...v, isFeatured: res.data.venue.isFeatured } : v))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    }
  };

  const handleDeleteVenue = async (venueId) => {
    setVenueToDelete(venueId);
  };

  const confirmDeleteVenue = async () => {
    if (!venueToDelete) return;
    try {
      const res = await api.delete(`/super-admin/venues/${venueToDelete}`);
      toast.success(res.data.message);
      setVenues((prev) => prev.filter((v) => v._id !== venueToDelete));
      const inquiriesRes = await api.get("/super-admin/inquiries");
      setInquiries(inquiriesRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    } finally {
      setVenueToDelete(null);
    }
  };

  // Couple actions
  const handleUpdateCoupleTier = async (userId, tier) => {
    try {
      const res = await api.put(`/super-admin/couples/tier/${userId}`, { tier });
      toast.success(res.data.message);
      setCouples((prev) =>
        prev.map((c) => (c._id === userId ? { ...c, tier: res.data.user.tier } : c))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    }
  };

  const handleDeleteCouple = async (userId) => {
    setCoupleToDelete(userId);
  };

  const confirmDeleteCouple = async () => {
    if (!coupleToDelete) return;
    try {
      const res = await api.delete(`/super-admin/couples/${coupleToDelete}`);
      toast.success(res.data.message);
      setCouples((prev) => prev.filter((c) => c._id !== coupleToDelete));
      const inquiriesRes = await api.get("/super-admin/inquiries");
      setInquiries(inquiriesRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    } finally {
      setCoupleToDelete(null);
    }
  };

  // Calculations
  const stats = {
    totalCouples: couples.length,
    plusCouples: couples.filter((c) => c.tier === "plus").length,
    proCouples: couples.filter((c) => c.tier === "pro").length,
    totalVenues: venues.length,
    approvedVenues: venues.filter((v) => v.isApproved).length,
    pendingVenues: venues.filter((v) => !v.isApproved).length,
    featuredVenues: venues.filter((v) => v.isFeatured).length,
    totalInquiries: inquiries.length,
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-white">

      {/* ── Venue Deletion Confirmation Modal ── */}
      {venueToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setVenueToDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/25 bg-[#0D1220] p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
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
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVenue}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition cursor-pointer shadow-lg shadow-red-500/25"
              >
                Yes, Delete Venue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Couple Deletion Confirmation Modal ── */}
      {coupleToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCoupleToDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/25 bg-[#0D1220] p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
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
            <p className="text-red-400/90 font-bold text-sm">⚠️ This action CANNOT be undone.</p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setCoupleToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCouple}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition cursor-pointer shadow-lg shadow-red-500/25"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-6 flex-wrap gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-[#D8B76A]">Super Control Center</span>
          <h1 className="font-serif text-3xl sm:text-4xl mt-1">Platform Administrator</h1>
          <p className="text-white/40 text-xs mt-1">Manage venue approvals, couple subscription workspace access, and platform analytics.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] text-xs font-semibold tracking-wider hover:bg-[#D8B76A]/20 transition cursor-pointer"
          >
            <span>💍</span> My Couple Workspace
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider hover:bg-white/10 transition cursor-pointer"
          >
            {loading ? "Refreshing..." : "🔄 Refresh Data"}
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Couples */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex justify-between items-start">
            <span className="text-2xl">💍</span>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight mt-4">{stats.totalCouples}</p>
          <h3 className="text-xs text-white/50 font-medium mt-1">Total Couple Workspaces</h3>
          <p className="text-[10px] text-white/35 mt-2">Plus: {stats.plusCouples} | Pro: {stats.proCouples}</p>
        </div>

        {/* Total Venues */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex justify-between items-start">
            <span className="text-2xl">🏰</span>
            <span className="text-[10px] bg-[#D8B76A]/10 border border-[#D8B76A]/20 text-[#D8B76A] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Marketplace</span>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight mt-4">{stats.totalVenues}</p>
          <h3 className="text-xs text-white/50 font-medium mt-1">Total Venues Registered</h3>
          <p className="text-[10px] text-white/35 mt-2">Approved: {stats.approvedVenues} | Pending: {stats.pendingVenues}</p>
        </div>

        {/* Sponsored / Featured Listings */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex justify-between items-start">
            <span className="text-2xl">✨</span>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Featured</span>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight mt-4">{stats.featuredVenues}</p>
          <h3 className="text-xs text-white/50 font-medium mt-1">Sponsored / Featured</h3>
          <p className="text-[10px] text-white/35 mt-2">Active top-placements in couple search</p>
        </div>

        {/* Direct leads inquiries */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex justify-between items-start">
            <span className="text-2xl">✉️</span>
            <span className="text-[10px] bg-[#7FA6D9]/10 border border-[#7FA6D9]/20 text-[#7FA6D9] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Leads</span>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight mt-4">{stats.totalInquiries}</p>
          <h3 className="text-xs text-white/50 font-medium mt-1">Direct inquiries generated</h3>
          <p className="text-[10px] text-white/35 mt-2">Couples communicating with venues</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/15 gap-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === "analytics" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          📈 Stats Overview
        </button>
        <button
          onClick={() => setActiveTab("venues")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === "venues" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          🏰 Venues ({stats.pendingVenues} Pending)
        </button>
        <button
          onClick={() => setActiveTab("couples")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === "couples" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          💍 Couples ({stats.totalCouples})
        </button>
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`pb-4 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === "inquiries" ? "text-[#D8B76A] border-b-2 border-[#D8B76A]" : "text-white/40 hover:text-white"
          }`}
        >
          ✉️ Direct inquiries ({stats.totalInquiries})
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="h-10 w-10 border-4 border-white/10 border-t-[#D8B76A] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-white/40">Loading platform data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: STATS OVERVIEW */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-4">
                <h3 className="font-serif text-lg text-[#D8B76A]">Couples Workspace Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Free Invitation accounts</span>
                    <span className="font-bold font-mono">{couples.filter((c) => c.tier === "free").length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Plus Invitation accounts (₦2,000 upgrade)</span>
                    <span className="font-bold font-mono text-[#7FA6D9]">{stats.plusCouples}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Pro Invitation accounts (₦5,000 upgrade)</span>
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
                    <span className="text-white/60">Sponsored Featured tier (₦5,000/mo)</span>
                    <span className="font-bold font-mono text-[#D8B76A]">{stats.featuredVenues}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Priority Listed tier (₦2,000/mo)</span>
                    <span className="font-bold font-mono text-[#7FA6D9]">{venues.filter((v) => v.subscriptionTier === "listed").length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENUES MANAGEMENT */}
          {activeTab === "venues" && (
            <div className="space-y-4 animate-fade-in">
              {venues.length === 0 ? (
                <p className="text-center text-xs text-white/40 py-10 bg-[#0D1220] rounded-3xl border border-white/10">No venues registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {venues.map((venue) => (
                    <div
                      key={venue._id}
                      className={`rounded-3xl border p-5 bg-[#0D1220] flex flex-col justify-between transition relative ${
                        !venue.isApproved ? "border-red-500/20 bg-[#1e0f12]/10" : "border-white/10"
                      }`}
                    >
                      <div>
                        {/* Status Badges */}
                        <div className="flex gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            venue.isApproved ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                          }`}>
                            {venue.isApproved ? "Approved" : "Pending Approval"}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            venue.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {venue.isActive ? "Active" : "Suspended"}
                          </span>
                          <span className="text-[9px] font-mono text-[#D8B76A] bg-[#D8B76A]/10 px-2 py-0.5 rounded-full uppercase">
                            Tier: {venue.subscriptionTier}
                          </span>
                          {venue.isFeatured && (
                            <span className="text-[9px] font-bold text-[#070A13] bg-[#D8B76A] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              ★ Featured
                            </span>
                          )}
                        </div>

                        {/* Title & Details */}
                        <div className="mt-4">
                          <h3 className="font-serif text-lg text-white font-semibold">{venue.name}</h3>
                          <p className="text-xs text-white/40">{venue.city} • {venue.style}</p>
                          
                          <div className="mt-3 space-y-1 text-[11px] text-white/60 font-mono">
                            <p>📧 Owner: {venue.ownerEmail}</p>
                            <p>📞 Phone: {venue.phone}</p>
                            <p>💰 Price Range: {venue.priceRange}</p>
                            <p>🎟️ Inquiries: {venue.inquiries || 0} leads | Views: {venue.views || 0}</p>
                            <p>🛡️ Safety: {
                              [
                                venue.safetyFireExits && "Fire Exits",
                                venue.safetySecurity && "Security",
                                venue.safetyStructural && "Structural",
                                venue.safetyInsurance && "Insurance",
                                venue.safetyCctv && "CCTV"
                              ].filter(Boolean).join(", ") || "None Verified"
                            }</p>
                            <p>⭐ Trust Score: {venue.trustScore !== undefined ? venue.trustScore : (venue.isFeatured ? 9.6 : 9.2)}/10</p>
                          </div>
                        </div>
                      </div>

                      {/* Inline glassmorphic verification editor */}
                      {verifyingVenueId === venue._id && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-[#D8B76A]/20 space-y-3 animate-fade-in">
                          <h4 className="text-xs uppercase tracking-wider text-[#D8B76A] font-bold">Edit Trust & Safety Verification</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyFireExits}
                                onChange={(e) => setVerificationForm({ ...verificationForm, safetyFireExits: e.target.checked })}
                                className="accent-[#D8B76A]"
                              />
                              Fire Exits & Signage
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyCctv}
                                onChange={(e) => setVerificationForm({ ...verificationForm, safetyCctv: e.target.checked })}
                                className="accent-[#D8B76A]"
                              />
                              Full CCTV Coverage
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetySecurity}
                                onChange={(e) => setVerificationForm({ ...verificationForm, safetySecurity: e.target.checked })}
                                className="accent-[#D8B76A]"
                              />
                              Guard Security Personnel
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyStructural}
                                onChange={(e) => setVerificationForm({ ...verificationForm, safetyStructural: e.target.checked })}
                                className="accent-[#D8B76A]"
                              />
                              Structural Integrity
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={verificationForm.safetyInsurance}
                                onChange={(e) => setVerificationForm({ ...verificationForm, safetyInsurance: e.target.checked })}
                                className="accent-[#D8B76A]"
                              />
                              Venue Liability Insurance
                            </label>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Trust Score (0-10):</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={verificationForm.trustScore}
                              onChange={(e) => setVerificationForm({ ...verificationForm, trustScore: parseFloat(e.target.value) || 0 })}
                              className="w-20 rounded bg-[#070A13] border border-white/15 px-2 py-1 text-xs text-white"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => setVerifyingVenueId(null)}
                              className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveVerification(venue._id)}
                              className="px-3 py-1 rounded bg-[#D8B76A] text-[#070A13] hover:opacity-90 text-xs font-bold"
                            >
                              Save Verification
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
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-bold text-[#070A13] hover:bg-emerald-400 transition cursor-pointer"
                            >
                              Approve Listing
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUpdateVenueStatus(venue._id, venue.isActive ? "suspended" : "active")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  venue.isActive ? "bg-amber-500 text-[#070A13] hover:bg-amber-400" : "bg-emerald-500 text-[#070A13] hover:bg-emerald-400"
                                }`}
                              >
                                {venue.isActive ? "Suspend" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(venue._id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                  venue.isFeatured ? "border-[#D8B76A] text-[#D8B76A] bg-[#D8B76A]/10 hover:bg-[#D8B76A]/20" : "border-white/20 text-white hover:bg-white/5"
                                }`}
                              >
                                {venue.isFeatured ? "Unfeature" : "Feature ★"}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => startVerificationEdit(venue)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/35 transition cursor-pointer"
                          >
                            Edit Verification 🛡️
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteVenue(venue._id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition cursor-pointer"
                        >
                          Delete 🗑️
                        </button>
                      </div>
                    </div>
                  ))}
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
                      couples.map((couple) => (
                        <tr key={couple._id} className="hover:bg-white/2 transition">
                          <td className="p-4 font-serif text-sm font-medium">
                            {couple.partner1Name} & {couple.partner2Name}
                          </td>
                          <td className="p-4 font-mono text-white/70">{couple.email}</td>
                          <td className="p-4 text-white/70">
                            {couple.weddingDate ? new Date(couple.weddingDate).toLocaleDateString() : "Not set"}
                          </td>
                          <td className="p-4">
                            <select
                              value={couple.tier}
                              onChange={(e) => handleUpdateCoupleTier(couple._id, e.target.value)}
                              className="bg-[#070A13] border border-white/10 px-2 py-1 rounded text-xs outline-none text-white focus:border-[#D8B76A]/60 font-semibold"
                            >
                              <option value="free">Free Tier</option>
                              <option value="plus">Plus Plan</option>
                              <option value="pro">Pro Plan</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteCouple(couple._id)}
                              className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition text-[11px] font-bold cursor-pointer"
                            >
                              Delete Account 🗑️
                            </button>
                          </td>
                        </tr>
                      ))
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
                            💍 {inq.user ? `${inq.user.partner1Name} & ${inq.user.partner2Name}` : "[Deleted Couple]"}
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Email: {inq.user?.email || "N/A"} • Date: {inq.user?.weddingDate ? new Date(inq.user.weddingDate).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-[#D8B76A] font-semibold text-sm">
                            🏰 {inq.venue ? inq.venue.name : "[Deleted Venue]"}
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            City: {inq.venue?.city || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/3 border border-white/5 p-3.5 rounded-xl text-white/75 font-mono leading-relaxed break-words whitespace-pre-wrap">
                        {inq.message}
                      </div>

                      <div className="flex justify-between text-[10px] text-white/30 italic pt-1 border-t border-white/5">
                        <span>Lead Generated: {new Date(inq.createdAt).toLocaleString()}</span>
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
