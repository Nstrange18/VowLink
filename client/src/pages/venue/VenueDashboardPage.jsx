import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import api from "../../utils/api";
import VenueSidebar from "../../components/venue/VenueSidebar";
import { Icon } from "@iconify/react";
import VenueListingForm from "../../components/venue/VenueListingForm";
import VenuePhotosGallery from "../../components/venue/VenuePhotosGallery";
import VenueSubscriptions from "../../components/venue/VenueSubscriptions";
import Skeleton from "../../components/common/Skeleton";

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
  email: z.union([z.string().email("Please enter a valid public contact email"), z.literal("")]).optional(),
  website: z.string().optional(),
  claimedFireExits: z.boolean().optional(),
  claimedCctv: z.boolean().optional(),
  claimedSecurity: z.boolean().optional(),
  claimedStructural: z.boolean().optional(),
  claimedInsurance: z.boolean().optional(),
  verificationProofUrls: z.array(z.string()).optional(),
  verificationNotes: z.string().optional(),
});

const loadPaystackScript = () => {
  return new Promise((resolve) => {
    if (window.PaystackPop) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
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

const VenueDashboardSkeleton = () => (
  <div className="min-h-screen bg-[#070A13] text-white overflow-x-clip">
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#0D1220]/95 px-3 py-3 shadow-2xl shadow-black/20 backdrop-blur sm:px-8 sm:py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl md:hidden" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="hidden h-4 w-48 sm:block" />
          <Skeleton className="hidden h-8 w-20 rounded-full sm:block" />
        </div>
      </div>
    </header>

    <main className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-8 px-4 pb-4 pt-24 sm:px-8 sm:pb-8 sm:pt-28">
      <aside className="hidden md:col-span-3 md:flex md:flex-col md:gap-6 md:self-start md:sticky md:top-28 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
        <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </aside>

      <section className="col-span-12 space-y-6 md:col-span-9">
        <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </section>
    </main>
  </div>
);

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

  // Verification proofs state (max 5 documents)
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUrls, setProofUrls] = useState([]);

  const handleProofUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentCount = proofUrls.length;
    if (currentCount >= 5) {
      toast.warning("You have already uploaded the maximum of 5 proof documents.");
      e.target.value = "";
      return;
    }

    const remainingSlots = 5 - currentCount;
    const filesToUpload = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.warning(`You can only add ${remainingSlots} more document(s). Only the first ${remainingSlots} file(s) will be uploaded.`);
    }

    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    const invalidFile = filesToUpload.find((f) => !validTypes.includes(f.type));
    if (invalidFile) {
      toast.error("Invalid file format. Please upload PDFs or Images (PNG, JPG) only.");
      e.target.value = "";
      return;
    }

    const oversizedFile = filesToUpload.find((f) => f.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      toast.error("Each file must be under 5MB.");
      e.target.value = "";
      return;
    }

    setUploadingProof(true);
    e.target.value = "";

    const uploadPromises = filesToUpload.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const url = await uploadToCloudinary(reader.result);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          };
          reader.readAsDataURL(file);
        })
    );

    try {
      const newUrls = await Promise.all(uploadPromises);
      const updatedUrls = [...proofUrls, ...newUrls].slice(0, 5);
      setProofUrls(updatedUrls);
      setValue("verificationProofUrls", updatedUrls, { shouldDirty: true });
      toast.success(
        `${newUrls.length} proof document(s) uploaded! Click 'Save Changes' to update your listing.`
      );
    } catch (err) {
      console.error("Proof upload error:", err);
    } finally {
      setUploadingProof(false);
    }
  };

  const removeProofUrl = (index) => {
    toast.dismiss();
    const ToastConfirm = ({ closeToast }) => (
      <div className="flex flex-col gap-2 p-1 text-white">
        <p className="font-semibold text-xs leading-relaxed">
          Are you sure you want to remove this verification proof document?
        </p>
        <div className="flex gap-2 justify-end mt-1">
          <button
            type="button"
            onClick={closeToast}
            className="px-2 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const updated = proofUrls.filter((_, i) => i !== index);
              setProofUrls(updated);
              setValue("verificationProofUrls", updated, { shouldDirty: true });
              closeToast();
              toast.info("Proof document removed. Click 'Save Changes' to update.");
            }}
            className="px-2 py-1 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition"
          >
            Confirm
          </button>
        </div>
      </div>
    );
    toast.warn(<ToastConfirm />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
    });
  };

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        render: "Upload complete!",
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
      toast.success("Password changed successfully!");
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
      // Migrate legacy single URL to array if needed
      const existingUrls = res.data.verificationProofUrls?.length
        ? res.data.verificationProofUrls
        : res.data.verificationProofUrl
        ? [res.data.verificationProofUrl]
        : [];
      setProofUrls(existingUrls);
      reset({ ...res.data, verificationProofUrls: existingUrls });
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
    setValue,
    watch,
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
          verificationProofUrls: proofUrls,
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
    toast.dismiss();
    toast.warn(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2 p-1 text-white">
          <p className="font-semibold text-xs leading-relaxed">
            Are you sure you want to log out of your venue listing portal?
          </p>
          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={closeToast}
              className="px-2.5 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("venueToken");
                localStorage.removeItem("venue");
                closeToast();
                toast.info("Logged out successfully.");
                navigate("/venue/login");
              }}
              className="px-2.5 py-1 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition"
            >
              Confirm Logout
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
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
      e.target.value = "";
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

    e.target.value = "";
  };

  const removePhoto = (index) => {
    toast.dismiss();
    const ToastConfirm = ({ closeToast }) => (
      <div className="flex flex-col gap-2 p-1 text-white">
        <p className="font-semibold text-xs leading-relaxed">
          Are you sure you want to remove this venue gallery photo?
        </p>
        <div className="flex gap-2 justify-end mt-1">
          <button
            type="button"
            onClick={closeToast}
            className="px-2 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setPhotos((prev) => prev.filter((_, i) => i !== index));
              closeToast();
              toast.info("Photo removed. Click Save Changes to publish.");
            }}
            className="px-2 py-1 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition"
          >
            Confirm
          </button>
        </div>
      </div>
    );
    toast.warn(<ToastConfirm />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
    });
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

    const paystackOptions = {
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
          toast.success(`Welcome to ${tier.toUpperCase()} tier! subscription activated!`);
          
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
    };

    // Version-resilient wrapper to handle both v1 (setup) and v2 (new constructor)
    if (typeof window.PaystackPop === "function") {
      try {
        const paystack = new window.PaystackPop();
        paystack.newTransaction(paystackOptions);
        return;
      } catch (e) {
        console.warn("Paystack Pop V2 instantiation failed, falling back to V1 setup", e);
      }
    }

    if (window.PaystackPop && typeof window.PaystackPop.setup === "function") {
      const handler = window.PaystackPop.setup({
        ...paystackOptions,
        callback: paystackOptions.onSuccess,
        onClose: paystackOptions.onCancel
      });
      handler.openIframe();
    } else {
      toast.error("Paystack payment SDK is not initialized. Please refresh the page.");
    }
  };

  const handleDemoApprove = async () => {
    try {
      const res = await api.post(`/venues/approve/${venue._id}`);
      setVenue(res.data.venue);
      toast.success("Venue listing approved successfully! It is now visible to couples.");
    } catch (err) {
      toast.error("Failed to approve venue listing.");
    }
  };



  if (loading) {
    return <VenueDashboardSkeleton />;
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
    <div className="min-h-screen bg-[#070A13] text-white flex flex-col overflow-x-clip">
      {/* Header Bar */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#0D1220]/95 py-3 px-3 sm:py-4 sm:px-8 flex justify-between items-center animate-fade-in shadow-2xl shadow-black/20 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex flex-col gap-1.5 p-2 text-white/60 hover:text-white transition mr-1"
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-6 rounded bg-current" />
            <span className="block h-0.5 w-5 rounded bg-current" />
            <span className="block h-0.5 w-6 rounded bg-current" />
          </button>
          <Link to="/" className="font-serif text-xl tracking-wider font-bold text-[#D8B76A] hover:opacity-90">
            VowLink <span className="hidden sm:inline font-sans text-xs uppercase tracking-widest text-white/40 font-normal">Venues</span>
          </Link>
          {isFeatured && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#070A13] shadow-md">
              <Icon icon="lucide:sparkles" className="h-2.5 w-2.5" />
              Featured
            </span>
          )}
          {isListed && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/80">
              <Icon icon="lucide:check" className="w-2.5 h-2.5" /> Listed
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs text-white/55 font-sans">Owner: <span className="text-[#D8B76A] font-semibold">{venue?.ownerEmail}</span></span>
          <button
            onClick={handleLogout}
            className="hidden sm:inline-block px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-[10px] uppercase tracking-wider font-bold hover:bg-white/10 hover:text-red-400 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r border-white/10 bg-[#0D1220] p-5 transition-transform duration-300 md:hidden overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-[#D8B76A]">VowLink</span>
            <span className="text-[10px] text-white/40 uppercase font-sans font-normal">Venues</span>
            {isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest text-[#070A13] shadow-md">
                <Icon icon="lucide:sparkles" className="h-2.5 w-2.5" />
                Featured
              </span>
            )}
            {isListed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest text-white/80">
                <Icon icon="lucide:check" className="w-2.5 h-2.5" /> Listed
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/40 hover:text-white text-lg p-1"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Content (Navigation Links + Quick Stats) */}
        <div className="flex-1 py-4">
          <VenueSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            photosLength={photos.length}
            stats={stats}
            venue={venue}
            setSidebarOpen={setSidebarOpen}
            isFeatured={isFeatured}
            isListed={isListed}
          />
        </div>

        {/* Footer / Account Details */}
        <div className="border-t border-white/10 pt-4 text-xs text-white/55 space-y-3">
          <div className="truncate">
            <span className="block text-[9px] uppercase text-white/30">Owner Email</span>
            <span className="font-semibold text-white/80">{venue?.ownerEmail}</span>
          </div>
          <button
            onClick={() => { handleLogout(); setSidebarOpen(false); }}
            className="w-full py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] uppercase font-bold text-center hover:bg-white/10 hover:text-red-400 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pb-4 pt-24 sm:px-8 sm:pb-8 sm:pt-28 grid grid-cols-12 gap-8">
        {/* Left Column: Navigation / Quick Stats */}
        <aside className="hidden md:flex flex-col col-span-12 md:col-span-3 space-y-6 sticky top-28 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          <VenueSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            photosLength={photos.length}
            stats={stats}
            venue={venue}
            isFeatured={isFeatured}
            isListed={isListed}
          />
        </aside>

        {/* Right Column: Tab Content */}
        <div className="col-span-12 md:col-span-9">
          {/* Pending Approval Banner */}
          {!venue?.isApproved && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 space-y-4 mb-6 animate-fade-in">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:alert-triangle" className="text-2xl text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 font-sans">Pending Admin Approval</h3>
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
                  <Icon icon="lucide:zap" className="w-3.5 h-3.5" /> Approve Listing
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: LISTING DETAILS */}
          {activeTab === "listing" && (
            <VenueListingForm
              register={register}
              errors={errors}
              handleSubmit={handleSubmit}
              onUpdateDetails={onUpdateDetails}
              saving={saving}
              setValue={setValue}
              watch={watch}
              uploadingProof={uploadingProof}
              handleProofUpload={handleProofUpload}
              proofUrls={proofUrls}
              removeProofUrl={removeProofUrl}
            />
          )}

          {/* TAB 2: GALLERY PHOTOS */}
          {activeTab === "photos" && (
            <VenuePhotosGallery
              photos={photos}
              setPhotos={setPhotos}
              venue={venue}
              isBasic={isBasic}
              isListed={isListed}
              fileInputRef={fileInputRef}
              handlePhotoUpload={handlePhotoUpload}
              removePhoto={removePhoto}
              handleSubmit={handleSubmit}
              onUpdateDetails={onUpdateDetails}
              saving={saving}
            />
          )}

          {/* TAB 3: SUBSCRIPTIONS & CHECKOUT */}
          {activeTab === "billing" && (
            <VenueSubscriptions
              venue={venue}
              tier={tier}
              isBasic={isBasic}
              isListed={isListed}
              isFeatured={isFeatured}
              handleInitiateUpgrade={handleInitiateUpgrade}
            />
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
                        <Icon icon={showCurrentPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="w-4 h-4" />
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
                        <Icon icon={showNewPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="w-4 h-4" />
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
                        <Icon icon={showConfirmNewPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="w-4 h-4" />
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
                      <Icon icon="lucide:alert-triangle" className="w-3.5 h-3.5 text-red-400 shrink-0" /> <span>Are you absolutely sure? This action is irreversible. Enter your password to proceed:</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#D8B76A]/30 bg-[#0D1220] p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false })}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition text-lg"
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>

            {/* Paystack Header */}
            <div className="text-center space-y-1 mb-6 border-b border-white/5 pb-4">
              <span className="inline-flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-[#3EC58E] font-bold"><Icon icon="mdi:credit-card-check-outline" className="w-3.5 h-3.5 shrink-0" />Secured by Paystack</span>
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
                        toast.success(`[DEV BYPASS] Upgraded venue to ${checkoutModal.tier.toUpperCase()} successfully!`);
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
                    <Icon icon="lucide:zap" className="w-3.5 h-3.5" /> Dev Bypass Activation
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
