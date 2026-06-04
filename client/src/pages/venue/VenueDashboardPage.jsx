import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import api from "../../utils/api";

const detailsSchema = z.object({
  name: z.string().min(3, "Venue name must be at least 3 characters"),
  city: z.string().min(2, "City is required"),
  generalLocation: z.string().min(3, "General location is required"),
  fullAddress: z.string().min(10, "Full address must be at least 10 characters"),
  capacity: z.string().min(2, "Capacity range is required"),
  priceRange: z.string().min(2, "Price range is required"),
  description: z.string().min(20, "Please write a brief description of at least 20 characters"),
  phone: z.string().min(7, "Contact phone is required"),
  whatsapp: z.string().min(7, "WhatsApp is required"),
  mapLink: z.string().url("Please enter a valid Google Maps URL"),
  style: z.enum(["Classic", "Modern", "Beach", "Rustic", "Garden"]),
  email: z.string().email("Please enter a valid public contact email"),
  website: z.string().optional(),
});

const loadPaystackScript = () => {
  return new Promise((resolve) => {
    if (window.PaystackPop) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const VenueDashboardPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("listing"); // listing, photos, billing, security

  // Live performance stats (polled every 30s)
  const [stats, setStats] = useState({ views: null, inquiries: null });

  // Photo management state
  const [photos, setPhotos] = useState([]);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [submittingDelete, setSubmittingDelete] = useState(false);
  
  // Billing subscription modal state
  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    tier: "",
    price: 0,
    reference: "",
    submitting: false,
  });

  const uploadToCloudinary = async (base64Str) => {
    const toastId = toast.loading("Uploading image to Cloudinary...");
    const token = localStorage.getItem("venueToken");
    try {
      const res = await api.post(
        "/venues/auth/upload",
        { file: base64Str },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.update(toastId, {
        render: "Upload complete! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
      return res.data.url;
    } catch (err) {
      toast.update(toastId, {
        render: "Upload failed: " + (err.response?.data?.message || err.message),
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      throw err;
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.warning("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    const token = localStorage.getItem("venueToken");
    try {
      setSubmittingPassword(true);
      await api.put(
        "/venues/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password changed successfully! ✓");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.warning("Please enter your password to confirm.");
      return;
    }

    const token = localStorage.getItem("venueToken");
    try {
      setSubmittingDelete(true);
      await api.delete(
        "/venues/auth/delete-account",
        {
          data: { confirmPassword: deletePassword },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success("Your venue account has been deleted. Goodbye!");

      localStorage.removeItem("venueToken");
      localStorage.removeItem("venue");

      navigate("/");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Deletion failed. Check password.");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem("venueToken");
    if (!token) {
      toast.error("Please sign in to access the dashboard.");
      navigate("/venue/login");
      return;
    }

    try {
      const res = await api.get("/venues/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVenue(res.data);
      setPhotos(res.data.photos || []);
      reset(res.data);
    } catch (err) {
      toast.error("Failed to load profile. Please log in again.");
      localStorage.removeItem("venueToken");
      localStorage.removeItem("venue");
      navigate("/venue/login");
    } finally {
      setLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(detailsSchema),
  });

  // ── Fetch live stats (views + inquiries) from server ─────────────────────
  const fetchStats = async () => {
    const token = localStorage.getItem("venueToken");
    if (!token) return;
    try {
      const res = await api.get("/venues/auth/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({ views: res.data.views, inquiries: res.data.inquiries });
    } catch {
      // Silently ignore; stale values remain visible
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Poll stats every 30 seconds for live updates
  useEffect(() => {
    // Initial fetch once venue is loaded
    if (venue) {
      fetchStats();
    }
    const interval = setInterval(() => {
      if (localStorage.getItem("venueToken")) fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [venue?._id]);

  const onUpdateDetails = async (data) => {
    setSaving(true);
    const token = localStorage.getItem("venueToken");
    try {
      const res = await api.put(
        "/venues/auth/me",
        {
          ...data,
          photos,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVenue(res.data.venue);
      toast.success(res.data.message || "Listing details updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save details.");
    } finally {
      setSaving(false);
    }
  };

  // Log out venue owner
  const handleLogout = () => {
    localStorage.removeItem("venueToken");
    localStorage.removeItem("venue");
    toast.info("Logged out successfully.");
    navigate("/venue/login");
  };

  // Photo handlers
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let maxPhotos = 3;
    if (venue?.subscriptionTier === "listed") maxPhotos = 8;
    if (venue?.subscriptionTier === "featured") maxPhotos = 15;

    if (photos.length + files.length > maxPhotos) {
      toast.warning(`Your current ${venue?.subscriptionTier.toUpperCase()} tier allows up to ${maxPhotos} photos. Upgrade your tier to upload more!`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const url = await uploadToCloudinary(reader.result);
          setPhotos((prev) => [...prev, url]);
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    toast.info("Photo removed. Click Save Changes to publish.");
  };

  // Subscription upgrade handlers
  const handleInitiateUpgrade = async (tier) => {
    const token = localStorage.getItem("venueToken");
    
    setCheckoutModal({
      isOpen: true,
      tier,
      price: tier === "listed" ? 5000 : 15000,
      reference: "",
      submitting: true,
    });

    const loaded = await loadPaystackScript();
    setCheckoutModal((prev) => ({ ...prev, submitting: false }));

    if (!loaded) {
      toast.error("Failed to load Paystack payment gateway. Please check your connection.");
      setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
      return;
    }

    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_live_c3d7e8c28a21ae50bd22b5d448b1a80d0a00ed07",
      email: venue.ownerEmail,
      amount: (tier === "listed" ? 5000 : 15000) * 100, // Price in kobo
      currency: "NGN",
      metadata: {
        paymentType: "venue_subscription",
        tier,
        venueId: venue._id,
      },
      onSuccess: async (transaction) => {
        setCheckoutModal({ isOpen: true, tier, price: tier === "listed" ? 5000 : 15000, reference: transaction.reference, submitting: true });
        toast.info("Payment successful! Verifying upgrade...");
        try {
          const res = await api.post(
            "/venues/subscribe/verify",
            {
              reference: transaction.reference,
              tier,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setVenue(res.data.venue);
          setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
          toast.success(`Welcome to ${tier.toUpperCase()} tier! subscription activated! 🚀`);
          
          const currentLocal = JSON.parse(localStorage.getItem("venue") || "{}");
          localStorage.setItem("venue", JSON.stringify({ ...currentLocal, subscriptionTier: tier }));
          
          setActiveTab("listing");
        } catch (err) {
          toast.error("Payment verification failed. Please contact admin.");
          setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
        }
      },
      onCancel: () => {
        toast.info("Subscription payment cancelled.");
        setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
      },
    });
  };

  const handleDemoApprove = async () => {
    try {
      const res = await api.post(`/venues/approve/${venue._id}`);
      setVenue(res.data.venue);
      toast.success("Venue listing approved successfully! 🎉 It is now visible to couples.");
    } catch (err) {
      toast.error("Failed to approve venue listing.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-[#D8B76A] border-t-transparent rounded-full mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#D8B76A]">Loading Venue Dashboard...</p>
        </div>
      </div>
    );
  }

  const tier = venue?.subscriptionTier || "basic";
  const isBasic = tier === "basic";
  const isListed = tier === "listed";
  const isFeatured = tier === "featured";

  const inputBase =
    "w-full rounded-xl border bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none transition";
  const inputOk =
    "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
  const inputErr = "border-red-400/50 focus:border-red-400/70";
  const labelClass = "mb-1.5 block text-[10px] uppercase tracking-wider text-white/50 font-semibold";

  return (
    <div className="min-h-screen bg-[#070A13] text-white flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#0D1220] py-4 px-6 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-serif text-xl tracking-wider font-bold text-[#D8B76A] hover:opacity-90">
            VowLink <span className="font-sans text-xs uppercase tracking-widest text-white/40 font-normal">Venues</span>
          </Link>
          {isFeatured && (
            <span className="rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#070A13] shadow-md flex items-center gap-1">
              ⭐ Featured
            </span>
          )}
          {isListed && (
            <span className="rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/80">
              ✓ Listed
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs text-white/55">Owner: <span className="text-[#D8B76A] font-semibold">{venue?.ownerEmail}</span></span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-[10px] uppercase tracking-wider font-bold hover:bg-white/10 hover:text-red-400 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 grid grid-cols-12 gap-8">
        {/* Left Column: Navigation / Quick Stats */}
        <div className="col-span-12 md:col-span-3 space-y-6">
          {/* Navigation Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("listing")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition ${
                activeTab === "listing"
                  ? "bg-[#D8B76A] text-[#070A13]"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              🏢 Listing Details
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition flex justify-between items-center ${
                activeTab === "photos"
                  ? "bg-[#D8B76A] text-[#070A13]"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              <span>📷 Gallery Photos</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                {photos.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition ${
                activeTab === "billing"
                  ? "bg-[#D8B76A] text-[#070A13]"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              💳 Subscriptions
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition ${
                activeTab === "security"
                  ? "bg-[#D8B76A] text-[#070A13]"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              🔒 Security & Danger Zone
            </button>
          </div>

          {/* Quick Stats Card — live-polled every 30s */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A]">Performance Stats</h3>
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/3 rounded-xl transition-all">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block">Total Views</span>
                <span className="text-xl font-bold font-mono">
                  {stats.views !== null ? stats.views : (venue?.views ?? 0)}
                </span>
              </div>
              <div className="p-3 bg-white/3 rounded-xl transition-all">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block">Inquiries</span>
                <span className="text-xl font-bold font-mono text-[#D8B76A]">
                  {stats.inquiries !== null ? stats.inquiries : (venue?.inquiries ?? 0)}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-white/30 italic">Auto-refreshes every 30 seconds.</p>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="col-span-12 md:col-span-9">
          {/* Pending Approval Banner */}
          {!venue?.isApproved && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 space-y-4 mb-6 animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-red-400">Pending Admin Approval</h3>
                  <p className="text-white/60 text-xs mt-1">
                    Your venue is currently undergoing verification by VowLink Admins. It will not appear in the "Suggested Venues" couple directory until it is approved.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-4">
                <span className="text-[10px] text-white/40 italic">Demo Mode: You can bypass validation and approve the listing instantly for testing.</span>
                <button
                  type="button"
                  onClick={handleDemoApprove}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition cursor-pointer"
                >
                  ⚡ Approve Listing
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: LISTING DETAILS */}
          {activeTab === "listing" && (
            <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-serif text-2xl">Manage Listing</h2>
                <p className="text-xs text-white/40 mt-1">Keep your wedding venue specifications accurate and up to date.</p>
              </div>

              <form onSubmit={handleSubmit(onUpdateDetails)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className={labelClass}>Venue Name *</label>
                    <input
                      type="text"
                      {...register("name")}
                      className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
                    />
                    {errors.name && <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>}
                  </div>

                  {/* Style */}
                  <div>
                    <label className={labelClass}>Style Category *</label>
                    <select
                      {...register("style")}
                      className="w-full rounded-xl border bg-[#070A13] border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
                    >
                      <option value="Classic">Classic Elegance</option>
                      <option value="Modern">Sleek Modern</option>
                      <option value="Beach">Waterfront / Beach</option>
                      <option value="Rustic">Cozy Rustic Wood</option>
                      <option value="Garden">Outdoor Garden</option>
                    </select>
                    {errors.style && <p className="mt-1 text-[10px] text-red-400">{errors.style.message}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className={labelClass}>City *</label>
                    <input
                      type="text"
                      {...register("city")}
                      className={`${inputBase} ${errors.city ? inputErr : inputOk}`}
                    />
                    {errors.city && <p className="mt-1 text-[10px] text-red-400">{errors.city.message}</p>}
                  </div>

                  {/* General Location */}
                  <div>
                    <label className={labelClass}>General Location *</label>
                    <input
                      type="text"
                      {...register("generalLocation")}
                      className={`${inputBase} ${errors.generalLocation ? inputErr : inputOk}`}
                    />
                    {errors.generalLocation && <p className="mt-1 text-[10px] text-red-400">{errors.generalLocation.message}</p>}
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className={labelClass}>Guest Capacity *</label>
                    <input
                      type="text"
                      {...register("capacity")}
                      className={`${inputBase} ${errors.capacity ? inputErr : inputOk}`}
                    />
                    {errors.capacity && <p className="mt-1 text-[10px] text-red-400">{errors.capacity.message}</p>}
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className={labelClass}>Price Range / Cost *</label>
                    <input
                      type="text"
                      {...register("priceRange")}
                      className={`${inputBase} ${errors.priceRange ? inputErr : inputOk}`}
                    />
                    {errors.priceRange && <p className="mt-1 text-[10px] text-red-400">{errors.priceRange.message}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelClass}>Phone Contact *</label>
                    <input
                      type="text"
                      {...register("phone")}
                      className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
                    />
                    {errors.phone && <p className="mt-1 text-[10px] text-red-400">{errors.phone.message}</p>}
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className={labelClass}>WhatsApp Contact (intl format, no +)*</label>
                    <input
                      type="text"
                      {...register("whatsapp")}
                      className={`${inputBase} ${errors.whatsapp ? inputErr : inputOk}`}
                    />
                    {errors.whatsapp && <p className="mt-1 text-[10px] text-red-400">{errors.whatsapp.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={labelClass}>Public Email *</label>
                    <input
                      type="email"
                      {...register("email")}
                      className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                    />
                    {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>}
                  </div>

                  {/* Website */}
                  <div>
                    <label className={labelClass}>Website Link (Optional)</label>
                    <input
                      type="text"
                      {...register("website")}
                      className={`${inputBase} ${errors.website ? inputErr : inputOk}`}
                    />
                    {errors.website && <p className="mt-1 text-[10px] text-red-400">{errors.website.message}</p>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={labelClass}>Full Address *</label>
                  <input
                    type="text"
                    {...register("fullAddress")}
                    className={`${inputBase} ${errors.fullAddress ? inputErr : inputOk}`}
                  />
                  {errors.fullAddress && <p className="mt-1 text-[10px] text-red-400">{errors.fullAddress.message}</p>}
                </div>

                {/* Map Link */}
                <div>
                  <label className={labelClass}>Google Maps URL *</label>
                  <input
                    type="text"
                    {...register("mapLink")}
                    className={`${inputBase} ${errors.mapLink ? inputErr : inputOk}`}
                  />
                  {errors.mapLink && <p className="mt-1 text-[10px] text-red-400">{errors.mapLink.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea
                    rows={4}
                    {...register("description")}
                    className="w-full rounded-xl border bg-white/5 px-4 py-3 text-xs text-white placeholder-white/30 outline-none resize-none focus:border-[#D8B76A]/60 transition"
                  />
                  {errors.description && <p className="mt-1 text-[10px] text-red-400">{errors.description.message}</p>}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-xs font-bold uppercase tracking-widest text-[#070A13] hover:-translate-y-0.5 transition hover:shadow-lg disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: GALLERY PHOTOS */}
          {activeTab === "photos" && (
            <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-2xl">Venue Image Gallery</h2>
                  <p className="text-xs text-white/40 mt-1">Upload high-resolution shots to display to prospective couples.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-white/40 block">Staged Slots</span>
                  <span className="text-lg font-bold font-mono text-[#D8B76A]">{photos.length} / {isBasic ? 3 : isListed ? 8 : 15}</span>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/3 text-center space-y-3">
                <span className="text-3xl block">📁</span>
                <p className="text-xs text-white/60">Upload venue cover and hall details photos</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 rounded-xl bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] hover:bg-[#D8B76A]/20 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                >
                  Browse Device Photos
                </button>
                <p className="text-[9px] text-white/30">Select image files (.jpg, .png). Up to 5MB.</p>
              </div>

              {/* Photo Grid */}
              {photos.length === 0 ? (
                <p className="text-center text-xs text-white/30 py-8">No photos uploaded yet. Staged photos will be listed here.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="h-32 rounded-xl overflow-hidden border border-white/10 relative group bg-white/5">
                      <img src={photo} alt={`Venue ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute inset-0 bg-black/75 flex items-center justify-center text-[10px] text-red-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save changes wrapper */}
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleSubmit(onUpdateDetails)}
                  disabled={saving}
                  className="px-8 py-3 rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-xs font-bold uppercase tracking-widest text-[#070A13] hover:-translate-y-0.5 transition hover:shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Staged Photos"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTIONS & CHECKOUT */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Current Subscription Card */}
              <div className="rounded-3xl border border-[#D8B76A]/30 bg-linear-to-b from-[#121829] to-[#0D1220] p-6 sm:p-8">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D8B76A] tracking-[0.2em]">Partner Status</span>
                    <h2 className="font-serif text-3xl text-white mt-1 capitalize">{tier} Plan</h2>
                    <p className="text-xs text-white/50 mt-2">
                      {isBasic && "Your venue is listed in VowLink with base features. Photos are capped at 3."}
                      {isListed && "Priority listed. Enhanced visibility, WhatsApp direct contacts enabled."}
                      {isFeatured && "Premium top placement. Golden Sponsored badge, up to 15 photos."}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#D8B76A] text-[#070A13] px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                    {isBasic ? "Free Directory" : "Active Subscription"}
                  </div>
                </div>

                {/* Subscription metadata */}
                {!isBasic && venue?.subscriptionExpiry && (
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/55">
                    <span>Next Renewal / Expiry:</span>
                    <span className="font-mono text-white font-semibold">{new Date(venue.subscriptionExpiry).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Upgrade Tiers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Basic (Free) */}
                <div className={`rounded-2xl border p-5 bg-[#0D1220] flex flex-col justify-between ${isBasic ? "border-[#D8B76A]/30" : "border-white/10 opacity-70"}`}>
                  <div className="space-y-3">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-white/40">Tier 1</p>
                    <h3 className="font-serif text-lg text-white font-semibold">Basic Free</h3>
                    <p className="text-2xl font-serif font-bold text-white">₦0 <span className="text-xs font-normal text-white/40">/ month</span></p>
                    <ul className="space-y-2 text-[10px] text-white/60">
                      <li>• Listed in suggested venues</li>
                      <li>• 3 Photo uploads</li>
                      <li>• Contact details redacted for free couples</li>
                    </ul>
                  </div>
                  <button
                    disabled
                    className="w-full mt-6 py-2 rounded-xl bg-white/5 text-white/30 text-xs font-semibold uppercase border border-dashed border-white/15"
                  >
                    {isBasic ? "Current Plan" : "Base Account"}
                  </button>
                </div>

                {/* Listed */}
                <div className={`rounded-2xl border p-5 bg-[#0D1220] flex flex-col justify-between ${isListed ? "border-[#D8B76A]/30" : "border-white/10"}`}>
                  <div className="space-y-3">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#D8B76A]">Tier 2 (Recommended)</p>
                    <h3 className="font-serif text-lg text-white font-semibold">Priority Listed</h3>
                    <p className="text-2xl font-serif font-bold text-[#D8B76A]">₦5,000 <span className="text-xs font-normal text-white/40">/ month</span></p>
                    <ul className="space-y-2 text-[10px] text-white/60">
                      <li>• Priority listing in directory</li>
                      <li>• 8 Photo uploads</li>
                      <li>• Direct WhatsApp chat integration</li>
                      <li>• Full address and cost public to all</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleInitiateUpgrade("listed")}
                    disabled={isListed}
                    className={`w-full mt-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                      isListed
                        ? "bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A]"
                        : "bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-[#070A13] cursor-pointer"
                    }`}
                  >
                    {isListed ? "Current Plan" : isFeatured ? "Downgrade (Basic)" : "Upgrade Account"}
                  </button>
                </div>

                {/* Featured */}
                <div className={`rounded-2xl border p-5 bg-[#0D1220] flex flex-col justify-between ${isFeatured ? "border-[#D8B76A]/30" : "border-white/10"}`}>
                  <div className="space-y-3">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-amber-400">Tier 3 (Exclusive)</p>
                    <h3 className="font-serif text-lg text-white font-semibold">Top Featured</h3>
                    <p className="text-2xl font-serif font-bold text-amber-400">₦15,000 <span className="text-xs font-normal text-white/40">/ month</span></p>
                    <ul className="space-y-2 text-[10px] text-white/60">
                      <li>• Sticky placement at the top</li>
                      <li>• 15 Photo uploads</li>
                      <li>• Direct WhatsApp + Direct Inquiries</li>
                      <li>• Golden "Sponsored" badge</li>
                      <li>• Custom Tags & Website linkage</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleInitiateUpgrade("featured")}
                    disabled={isFeatured}
                    className={`w-full mt-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                      isFeatured
                        ? "bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A]"
                        : "bg-linear-to-r from-amber-400 to-yellow-500 text-[#070A13] hover:opacity-95 cursor-pointer"
                    }`}
                  >
                    {isFeatured ? "Current Plan" : "Go Premium"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & DANGER ZONE */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-fade-in">
              {/* Change Password Block */}
              <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-serif text-xl">Change Password</h3>
                  <p className="text-xs text-white/40 mt-1">Update your password to keep your venue listing secure.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputBase}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 text-xs"
                      >
                        {showCurrentPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputBase}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 text-xs"
                      >
                        {showNewPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputBase}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 text-xs"
                      >
                        {showConfirmNewPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={submittingPassword}
                    className="px-6 py-2 rounded-xl bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-xs font-bold uppercase tracking-wider text-[#070A13] transition disabled:opacity-50"
                  >
                    {submittingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>

              {/* Danger Zone Block */}
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-serif text-xl text-red-400">Danger Zone</h3>
                  <p className="text-xs text-white/40 mt-1">Permanently delete your VowLink Venue partner account and listings.</p>
                </div>

                {!showDeleteConfirm ? (
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <p className="text-xs text-white/60">
                      Deleting your account will remove your venue details, photos, and listing reviews forever.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/35 text-xs font-bold uppercase tracking-wider transition"
                    >
                      Delete Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in max-w-md">
                    <p className="text-xs text-red-400 font-semibold">
                      ⚠️ Are you absolutely sure? This action is irreversible. Enter your password to proceed:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password to delete"
                        className={`${inputBase} flex-1`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword("");
                          }}
                          className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 text-xs font-bold uppercase transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={submittingDelete}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold uppercase text-white transition disabled:opacity-50"
                        >
                          {submittingDelete ? "Deleting..." : "Confirm Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Subscription Paystack Checkout Modal */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-[#D8B76A]/30 bg-[#0D1220] p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false })}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition text-lg"
            >
              ✕
            </button>

            {/* Paystack Header */}
            <div className="text-center space-y-1 mb-6 border-b border-white/5 pb-4">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#3EC58E] font-bold">💳 Secured by Paystack</span>
              <h3 className="font-serif text-xl">VowLink Partnership</h3>
              <p className="text-[11px] text-white/50">Live Payment Gateway Session</p>
            </div>

            {checkoutModal.submitting ? (
              <div className="text-center py-4 space-y-2">
                <div className="animate-spin h-6 w-6 border-2 border-[#D8B76A] border-t-transparent rounded-full mx-auto" />
                <p className="text-[10px] text-white/40">Securing payment channel...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-white/60 text-center leading-relaxed">
                  Paystack checkout modal is open. Please complete your payment inside the secure popup.
                </p>

                {/* Dev Bypass Quick Trigger for Venues on Localhost */}
                {isLocal && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("venueToken");
                      setCheckoutModal((prev) => ({ ...prev, submitting: true }));
                      try {
                        const res = await api.post(
                          "/venues/subscribe/verify",
                          {
                            reference: "MOCK-VENUE-" + Math.random().toString(36).substring(3).toUpperCase(),
                            tier: checkoutModal.tier,
                          },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setVenue(res.data.venue);
                        setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
                        toast.success(`[DEV BYPASS] Upgraded venue to ${checkoutModal.tier.toUpperCase()} successfully! 🚀`);
                        const currentLocal = JSON.parse(localStorage.getItem("venue") || "{}");
                        localStorage.setItem("venue", JSON.stringify({ ...currentLocal, subscriptionTier: checkoutModal.tier }));
                        setActiveTab("listing");
                      } catch (err) {
                        toast.error("Dev bypass failed.");
                        setCheckoutModal((prev) => ({ ...prev, submitting: false }));
                      }
                    }}
                    className="w-full py-2.5 rounded-full border border-dashed border-[#D8B76A]/40 text-[#D8B76A] hover:bg-white/5 text-[10px] uppercase font-bold tracking-wider transition"
                  >
                    ⚡ Dev Bypass Activation
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueDashboardPage;
