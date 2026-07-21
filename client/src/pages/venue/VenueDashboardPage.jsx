import { useCallback, useEffect, useState, useRef } from "react";
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
import VenueVisualGuide, { VENUE_VISUAL_GUIDE_STORAGE_KEY } from "../../components/venue/VenueVisualGuide";
import Skeleton from "../../components/common/Skeleton";
import { buildPublicUrl } from "../../utils/siteUrl";

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

const formatShortDate = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const hasProofDocuments = (venue, proofUrls = []) => {
  return Boolean(
    proofUrls.length ||
      venue?.verificationProofUrls?.length ||
      venue?.verificationProofUrl
  );
};

const buildVenueChecklist = (venue, photos = [], proofUrls = []) => {
  const photoCount = photos.length || venue?.photos?.length || 0;
  const checks = [
    { label: "Description", complete: (venue?.description || "").trim().length >= 80 },
    { label: "Address", complete: Boolean(venue?.city && venue?.fullAddress && venue?.generalLocation) },
    { label: "WhatsApp", complete: Boolean(venue?.whatsapp) },
    { label: "Map link", complete: Boolean(venue?.mapLink) },
    { label: "Photos", complete: photoCount >= 3 },
    { label: "Proof documents", complete: hasProofDocuments(venue, proofUrls) },
    { label: "Price range", complete: Boolean(venue?.priceRange) },
  ];

  const completed = checks.filter((item) => item.complete).length;
  return {
    checks,
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
  };
};

const isVenuePublicShareReady = (venue, photos = [], proofUrls = []) => {
  const photoCount = photos.length || venue?.photos?.length || 0;

  return Boolean(
    (venue?.description || "").trim().length >= 80 &&
      (venue?.city || "").trim() &&
      (venue?.fullAddress || "").trim() &&
      (venue?.generalLocation || "").trim() &&
      photoCount >= 3 &&
      (venue?.whatsapp || "").trim() &&
      (venue?.mapLink || "").trim() &&
      hasProofDocuments(venue, proofUrls) &&
      (venue?.priceRange || "").trim()
  );
};

const getVisibilityStatus = (venue, photos = [], proofUrls = []) => {
  if (!venue?.isApproved) {
    return {
      label: "Pending review",
      tone: "text-amber-300 border-amber-400/25 bg-amber-400/10",
      detail: "Complete the profile checklist while VowLink reviews the listing.",
    };
  }
  if (!venue?.isActive) {
    return {
      label: "Approved, not visible",
      tone: "text-white/60 border-white/15 bg-white/5",
      detail: "Your listing is approved but currently inactive.",
    };
  }
  if (!isVenuePublicShareReady(venue, photos, proofUrls)) {
    return {
      label: "Needs profile details",
      tone: "text-amber-300 border-amber-400/25 bg-amber-400/10",
      detail: "Add the required profile details before your public share link becomes available.",
    };
  }
  if (venue.subscriptionTier === "featured") {
    return {
      label: venue.subscriptionExpiry ? `Featured until ${formatShortDate(venue.subscriptionExpiry)}` : "Featured",
      tone: "text-[#D8B76A] border-[#D8B76A]/35 bg-[#D8B76A]/10",
      detail: "Your venue can appear with featured placement for couples.",
    };
  }
  return {
    label: "Visible to couples",
    tone: "text-emerald-700 border-emerald-400/10 bg-emerald-400/20",
    detail: "Approved couples can view your public venue details.",
  };
};

const getVerificationStatusMeta = (status) => {
  const map = {
    not_submitted: {
      label: "Verification not submitted",
      detail: "Select the safety standards your venue holds and upload proof documents for admin review.",
      tone: "border-white/10 bg-white/5 text-white/55",
      icon: "lucide:shield-question",
    },
    pending_review: {
      label: "Verification pending review",
      detail: "Your updated safety claims and proof documents are waiting for VowLink admin review.",
      tone: "border-amber-400/25 bg-amber-400/10 text-amber-200",
      icon: "lucide:clock-3",
    },
    verified: {
      label: "Verification approved",
      detail: "Verified safety checks can appear in the trust and safety section for couples.",
      tone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
      icon: "lucide:shield-check",
    },
    changes_requested: {
      label: "Changes requested",
      detail: "VowLink needs clearer or additional proof before approving these safety claims.",
      tone: "border-[#D8B76A]/30 bg-[#D8B76A]/10 text-[#F2D894]",
      icon: "lucide:file-warning",
    },
    rejected: {
      label: "Verification rejected",
      detail: "The submitted documents did not validate the selected safety claims. Update your documents and resubmit.",
      tone: "border-red-400/25 bg-red-400/10 text-red-200",
      icon: "lucide:shield-x",
    },
  };

  return map[status] || map.not_submitted;
};

const getPerformanceTips = (venue, photos = [], completionPercent = 0, proofUrls = []) => {
  const tips = [];
  const photoCount = photos.length || venue?.photos?.length || 0;

  if (photoCount < 6) tips.push("Add at least 6 clear photos to improve trust.");
  if (!hasProofDocuments(venue, proofUrls)) tips.push("Upload proof documents so admins can verify your venue faster.");
  if (!venue?.mapLink) tips.push("Add a Google Maps link so couples can judge location quickly.");
  if ((venue?.description || "").trim().length < 140) tips.push("Write a fuller description with ambience, parking, and event flow.");
  if (!venue?.priceRange) tips.push("Add a price range to reduce unqualified inquiries.");
  if (completionPercent === 100 && tips.length === 0) tips.push("Your listing is strong. Keep photos updated when your setup changes.");

  return tips.slice(0, 4);
};

const getInquiryAgeDays = (date) => {
  if (!date) return 0;
  const created = new Date(date).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
};

const getInquiryStatusMeta = (inquiry) => {
  const ageDays = getInquiryAgeDays(inquiry?.createdAt);
  if ((inquiry?.status || "new") === "archived") {
    return {
      label: "Archived",
      tone: "border-white/10 bg-white/5 text-white/45",
      icon: "lucide:archive",
    };
  }
  if (inquiry?.status === "replied") {
    return {
      label: "Replied",
      tone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
      icon: "lucide:check-check",
    };
  }
  if (inquiry?.status === "unavailable") {
    return {
      label: "Unavailable",
      tone: "border-red-400/25 bg-red-400/10 text-red-200",
      icon: "lucide:calendar-x",
    };
  }
  if (ageDays >= 2) {
    return {
      label: `Needs reply (${ageDays}d)`,
      tone: "border-amber-400/30 bg-amber-400/10 text-amber-200",
      icon: "lucide:clock-alert",
    };
  }
  return {
    label: "New",
    tone: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    icon: "lucide:sparkle",
  };
};

const inquiryFilters = [
  { value: "active", label: "Active" },
  { value: "new", label: "Unreplied" },
  { value: "replied", label: "Replied" },
  { value: "unavailable", label: "Unavailable" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const VenueDashboardPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const tabContentRef = useRef(null);
  const isProduction = import.meta.env.PROD;

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("listing"); // listing, photos, billing, security
  const [copyingVenueLink, setCopyingVenueLink] = useState(false);
  const [visualGuideOpen, setVisualGuideOpen] = useState(false);

  // Live performance stats (polled every 30s)
  const [stats, setStats] = useState({ views: null, inquiries: null });
  const [venueInquiries, setVenueInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState("active");
  const [inquiryCounts, setInquiryCounts] = useState({ active: 0, new: 0, replied: 0, unavailable: 0, archived: 0, all: 0, overdue: 0 });
  const [updatingInquiryId, setUpdatingInquiryId] = useState("");

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
      toast.success(`${newUrls.length} proof document(s) uploaded. Save changes to publish them.`);
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
              toast.info("Proof document removed. Save changes to update it.");
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
  const submittingPasswordRef = useRef(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const submittingDeleteRef = useRef(false);
  
  // Billing subscription modal state
  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    tier: "",
    price: 0,
    reference: "",
    submitting: false,
  });
  const checkoutSubmittingRef = useRef(false);
  const devBypassSubmittingRef = useRef(false);

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
    if (submittingPasswordRef.current) return;

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
      submittingPasswordRef.current = true;
      setSubmittingPassword(true);
      await api.put(
        "/venues/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password. Please try again.");
    } finally {
      submittingPasswordRef.current = false;
      setSubmittingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (submittingDeleteRef.current) return;

    if (!deletePassword) {
      toast.warning("Please enter your password to confirm.");
      return;
    }

    const token = localStorage.getItem("venueToken");
    try {
      submittingDeleteRef.current = true;
      setSubmittingDelete(true);
      await api.delete(
        "/venues/auth/delete-account",
        {
          data: { confirmPassword: deletePassword },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success("Venue account deleted.");

      localStorage.removeItem("venueToken");
      localStorage.removeItem("venueRefreshToken");
      localStorage.removeItem("venue");

      navigate("/");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete account. Check the password and try again.");
    } finally {
      submittingDeleteRef.current = false;
      setSubmittingDelete(false);
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

  const fetchProfile = useCallback(async () => {
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
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Your venue session expired. Please log in again.");
        localStorage.removeItem("venueToken");
        localStorage.removeItem("venueRefreshToken");
        localStorage.removeItem("venue");
        navigate("/venue/login");
      } else {
        toast.error("Failed to load profile. Please refresh and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, reset]);

  // ── Fetch live stats (views + inquiries) from server ─────────────────────
  const fetchStats = useCallback(async () => {
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
  }, []);

  const fetchInquiries = useCallback(async () => {
    const token = localStorage.getItem("venueToken");
    if (!token) return;
    setLoadingInquiries(true);
    try {
      const res = await api.get(`/venues/auth/inquiries?status=${encodeURIComponent(inquiryFilter)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVenueInquiries(Array.isArray(res.data?.inquiries) ? res.data.inquiries : []);
      setInquiryCounts((current) => ({ ...current, ...(res.data?.counts || {}) }));
    } catch {
      toast.error("Could not load inquiries. Please refresh.");
    } finally {
      setLoadingInquiries(false);
    }
  }, [inquiryFilter]);

  const updateInquiryStatus = async (inquiryId, status) => {
    const token = localStorage.getItem("venueToken");
    if (!token || updatingInquiryId) return;

    setUpdatingInquiryId(inquiryId);
    try {
      const res = await api.patch(`/venues/auth/inquiries/${inquiryId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(res.data?.message || "Inquiry updated.");
      await fetchInquiries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update inquiry.");
    } finally {
      setUpdatingInquiryId("");
    }
  };

  const handleArchiveInquiry = (inquiryId, coupleName) => {
    toast.dismiss();
    toast.warn(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2 p-1 text-white">
          <p className="font-semibold text-xs leading-relaxed">
            Archive this inquiry from {coupleName || "this couple"}?
          </p>
          <p className="text-[11px] text-white/50">It will move out of the active inbox, but the record stays available under Archived.</p>
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeToast}
              className="rounded px-2.5 py-1 text-[10px] font-semibold text-white bg-white/10 hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                closeToast();
                updateInquiryStatus(inquiryId, "archived");
              }}
              className="rounded px-2.5 py-1 text-[10px] font-semibold text-[#070A13] bg-[#D8B76A] hover:bg-[#F2D894] transition"
            >
              Archive
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (loading || !venue) return undefined;
    if (localStorage.getItem(VENUE_VISUAL_GUIDE_STORAGE_KEY)) return undefined;
    const timer = window.setTimeout(() => setVisualGuideOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, [loading, venue]);

  useEffect(() => {
    if (activeTab === "inquiries") {
      fetchInquiries();
    }
  }, [activeTab, fetchInquiries]);

  // Poll stats every 30 seconds for live updates
  const venueId = venue?._id;
  useEffect(() => {
    // Initial fetch once venue is loaded
    if (venueId) {
      fetchStats();
    }
    const interval = setInterval(() => {
      if (localStorage.getItem("venueToken")) fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, venueId]);

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
      toast.success(res.data.message || "Listing saved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save listing. Please try again.");
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
                localStorage.removeItem("venueRefreshToken");
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
              toast.info("Photo removed. Save changes to publish it.");
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
    if (checkoutSubmittingRef.current) return;

    const token = localStorage.getItem("venueToken");
    
    checkoutSubmittingRef.current = true;
    setCheckoutModal({
      isOpen: true,
      tier,
      price: tier === "listed" ? 20000 : 50000,
      reference: "",
      submitting: true,
    });

    const loaded = await loadPaystackScript();
    setCheckoutModal((prev) => ({ ...prev, submitting: false }));

    if (!loaded) {
      checkoutSubmittingRef.current = false;
      toast.error("Could not open checkout. Check your connection.");
      setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
      return;
    }

    const releaseCheckout = () => {
      checkoutSubmittingRef.current = false;
      setCheckoutModal((prev) => ({ ...prev, submitting: false }));
    };

    const paystackOptions = {
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_live_c3d7e8c28a21ae50bd22b5d448b1a80d0a00ed07",
      email: venue.ownerEmail,
      amount: (tier === "listed" ? 20000 : 50000) * 100, // Price in kobo
      currency: "NGN",
      metadata: {
        paymentType: "venue_subscription",
        tier,
        venueId: venue._id,
      },
      onSuccess: async (transaction) => {
        setCheckoutModal({ isOpen: true, tier, price: tier === "listed" ? 20000 : 50000, reference: transaction.reference, submitting: true });
        toast.info("Payment received. Activating your plan...");
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
          checkoutSubmittingRef.current = false;
          setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
          toast.success(`${tier === "listed" ? "Priority listing" : "Top placement"} activated.`);
          
          const currentLocal = JSON.parse(localStorage.getItem("venue") || "{}");
          localStorage.setItem("venue", JSON.stringify({ ...currentLocal, subscriptionTier: tier }));
          
          setActiveTab("listing");
        } catch (err) {
          toast.error("Payment was received, but the plan was not activated yet. Please contact support.");
          checkoutSubmittingRef.current = false;
          setCheckoutModal({ isOpen: false, tier: "", price: 0, reference: "", submitting: false });
        }
      },
      onCancel: () => {
        checkoutSubmittingRef.current = false;
      toast.info("Payment cancelled.");
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
      releaseCheckout();
      toast.error("Checkout is not ready. Please refresh and try again.");
    }
  };

  const handleDemoApprove = async () => {
    try {
      const res = await api.post(`/venues/approve/${venue._id}`);
      setVenue(res.data.venue);
      toast.success("Venue listing approved. Couples can now see it.");
    } catch (err) {
      toast.error("Could not approve venue listing.");
    }
  };

  const handleCopyVenueLink = async () => {
    if (copyingVenueLink) return;
    if (!venue?._id) {
      toast.info("Venue profile is still loading. Please try again.");
      return;
    }

    const link = buildPublicUrl(`/venues/${venue._id}`);
    setCopyingVenueLink(true);
    try {
      const readiness = await api.get("/venues/auth/public-readiness");
      if (!readiness.data?.isReady) {
        const reasons = Array.isArray(readiness.data?.reasons) ? readiness.data.reasons : [];
        const missing = Array.isArray(readiness.data?.missing) ? readiness.data.missing : [];
        const message = reasons.length
          ? reasons.join(". ")
          : missing.length
            ? `Missing profile details: ${missing.join(", ")}.`
            : "This venue profile is not ready for public sharing yet.";
        toast.info(message);
        return;
      }

      await api.get(`/venues/public/${venue._id}`);
      await navigator.clipboard.writeText(link);
      toast.success("Venue share link copied.");
    } catch (err) {
      const reasons = Array.isArray(err.response?.data?.reasons) ? err.response.data.reasons : [];
      const missing = Array.isArray(err.response?.data?.missing) ? err.response.data.missing : [];
      const message = reasons.length
        ? reasons.join(". ")
        : missing.length
          ? `Missing profile details: ${missing.join(", ")}.`
        : err.response?.data?.message || "This venue link is not public yet. Complete the required profile details first.";
      toast.info(message);
    } finally {
      setCopyingVenueLink(false);
    }
  };

  const handleVenueTabChange = (tab) => {
    setActiveTab(tab);
    window.setTimeout(() => {
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      tabContentRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 0);
  };



  if (loading) {
    return <VenueDashboardSkeleton />;
  }

  const tier = venue?.subscriptionTier || "basic";
  const isBasic = tier === "basic";
  const isListed = tier === "listed";
  const isFeatured = tier === "featured";
  const checklist = buildVenueChecklist(venue, photos, proofUrls);
  const visibilityStatus = getVisibilityStatus(venue, photos, proofUrls);
  const verificationStatus = getVerificationStatusMeta(venue?.verificationStatus);
  const performanceTips = getPerformanceTips(venue, photos, checklist.percent, proofUrls);
  const mainPhoto = photos[0] || venue?.photos?.[0] || "";

  const inputBase =
    "w-full rounded-xl border bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none transition";
  const labelClass = "mb-1.5 block text-[10px] uppercase tracking-wider text-white/50 font-semibold";

  return (
    <div className="venue-dashboard min-h-screen bg-[#070A13] text-white flex flex-col overflow-x-clip">
      <VenueVisualGuide
        open={visualGuideOpen}
        onClose={() => setVisualGuideOpen(false)}
      />

      {/* Header Bar */}
      <header className="venue-dashboard-header fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#0D1220]/95 py-3 px-3 sm:py-4 sm:px-8 flex justify-between items-center animate-fade-in shadow-2xl shadow-black/20 backdrop-blur">
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
          <Link to="/" className="flex items-center gap-2 hover:opacity-90">
            <img src="/vowlink-icon.svg" alt="" className="h-8 w-8 rounded-lg object-contain shadow-[0_0_18px_rgba(216,183,106,0.12)]" />
            <span className="font-serif text-xl tracking-wider font-bold text-[#D8B76A]">
              VowLink <span className="hidden sm:inline font-sans text-xs uppercase tracking-widest text-white/40 font-normal">Venues</span>
            </span>
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
        <div className="flex items-center gap-2 sm:gap-4 sm:pr-28">
          <span className="hidden sm:inline text-xs text-white/55 font-sans">Owner: <span className="text-[#D8B76A] font-semibold">{venue?.ownerEmail}</span></span>
          <button
            type="button"
            onClick={() => setVisualGuideOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#D8B76A]/25 bg-[#D8B76A]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F2D894] transition hover:bg-[#D8B76A]/16 sm:px-4"
          >
            <Icon icon="lucide:route" className="h-3.5 w-3.5" />
            <span className="hidden min-[420px]:inline">Start guide</span>
            <span className="min-[420px]:hidden">Guide</span>
          </button>
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
            <img src="/vowlink-icon.svg" alt="" className="h-8 w-8 rounded-lg object-contain shadow-[0_0_18px_rgba(216,183,106,0.12)]" />
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
            setActiveTab={handleVenueTabChange}
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
      <main className="venue-dashboard-content flex-1 max-w-6xl w-full mx-auto px-4 pb-4 pt-24 sm:px-8 sm:pb-8 sm:pt-28 grid grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Navigation / Quick Stats */}
        <aside className="hidden md:flex flex-col col-span-12 md:col-span-3 space-y-6 sticky top-28 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          <VenueSidebar
            activeTab={activeTab}
            setActiveTab={handleVenueTabChange}
            photosLength={photos.length}
            stats={stats}
            venue={venue}
            isFeatured={isFeatured}
            isListed={isListed}
          />
        </aside>

        {/* Right Column: Tab Content */}
        <div className="col-span-12 min-w-0 md:col-span-9">
          <section className="mb-6 grid gap-4 items-start lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${visibilityStatus.tone}`}>
                    <Icon icon={venue?.isApproved ? "lucide:badge-check" : "lucide:clock-3"} className="h-3.5 w-3.5" />
                    {visibilityStatus.label}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">Venue workspace</p>
                    <h2 className="mt-2 font-serif text-2xl text-white">{venue?.name || "Your venue listing"}</h2>
                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/50">{visibilityStatus.detail}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleVenueTabChange("preview")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/80 transition hover:border-[#D8B76A]/40 hover:text-[#D8B76A]"
                  >
                    <Icon icon="lucide:eye" className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyVenueLink}
                    disabled={copyingVenueLink}
                    className="inline-flex items-center gap-2 rounded-full bg-[#D8B76A] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Icon icon={copyingVenueLink ? "lucide:loader-2" : "lucide:link"} className={`h-3.5 w-3.5 ${copyingVenueLink ? "animate-spin" : ""}`} />
                    {copyingVenueLink ? "Copying..." : "Copy Link"}
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#070A13]/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">Profile completion</p>
                    <p className="mt-1 text-xs text-white/45">{checklist.completed} of {checklist.total} checks complete</p>
                  </div>
                  <span className="font-mono text-2xl text-[#D8B76A]">{checklist.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#D8B76A]" style={{ width: `${checklist.percent}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {checklist.checks.map((item) => (
                    <span
                      key={item.label}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-semibold ${
                        item.complete
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-[#D8B76A]"
                      }`}
                    >
                      <Icon icon={item.complete ? "lucide:check" : "lucide:minus"} className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`mt-4 rounded-2xl border p-4 ${verificationStatus.tone}`}>
                <div className="flex items-start gap-3">
                  <Icon icon={verificationStatus.icon} className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">{verificationStatus.label}</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-80">{verificationStatus.detail}</p>
                    {venue?.verificationSubmittedAt && (
                      <p className="mt-2 text-[10px] opacity-65">
                        Submitted {formatShortDate(venue.verificationSubmittedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">Booking tips</p>
                  <p className="mt-2 text-xs text-white/45">Small updates that help couples trust your venue.</p>
                </div>
                <Icon icon="lucide:trending-up" className="h-5 w-5 text-[#D8B76A]" />
              </div>
              <div className="mt-5 grid gap-3">
                {performanceTips.map((tip) => (
                  <div key={tip} className="flex gap-3 rounded-2xl border border-white/10 bg-white/3 p-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D8B76A]/12 text-[#D8B76A]">
                      <Icon icon="lucide:sparkles" className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs leading-relaxed text-white/55">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div ref={tabContentRef} className="scroll-mt-28">
            {/* Review status banner */}
            {!venue?.isApproved && (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-400/8 p-6 space-y-4 mb-6 animate-fade-in">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:alert-triangle" className="text-2xl text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-sans">Waiting for VowLink review</h3>
                  <p className="text-white/60 text-xs mt-1">
                    Your listing is saved. Complete the checklist while we review it. It will appear to couples after approval.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-4">
                {isProduction ? (
                  <span className="text-[10px] text-white/40 italic">We will make the listing public after it passes review.</span>
                ) : (
                  <>
                    <span className="text-[10px] text-white/40 italic">Demo mode: approve this listing instantly for testing.</span>
                    <button
                      type="button"
                      onClick={handleDemoApprove}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition cursor-pointer"
                    >
                      <Icon icon="lucide:zap" className="w-3.5 h-3.5" /> Approve Listing
                    </button>
                  </>
                )}
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
                verificationStatus={venue?.verificationStatus}
              />
            )}

          {/* TAB 2: PUBLIC PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">Public listing preview</p>
                    <h3 className="mt-2 font-serif text-2xl text-white">View how couples see your venue</h3>
                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/45">
                      This preview uses the details currently saved on your listing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyVenueLink}
                    disabled={copyingVenueLink}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8B76A]/35 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D8B76A] transition hover:bg-[#D8B76A] hover:text-[#070A13] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Icon icon={copyingVenueLink ? "lucide:loader-2" : "lucide:copy"} className={`h-3.5 w-3.5 ${copyingVenueLink ? "animate-spin" : ""}`} />
                    {copyingVenueLink ? "Copying..." : "Copy public link"}
                  </button>
                </div>

                <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#070A13]">
                  <div className="relative aspect-video bg-white/5">
                    {mainPhoto ? (
                      <img src={mainPhoto} alt={venue?.name || "Venue preview"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/35">
                        <Icon icon="lucide:image" className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-[#070A13] via-transparent to-transparent" />
                    <span className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${visibilityStatus.tone}`}>
                      {visibilityStatus.label}
                    </span>
                    {isFeatured && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#D8B76A] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#070A13]">
                        <Icon icon="lucide:sparkles" className="h-3.5 w-3.5" />
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.7fr]">
                    <div>
                      <h4 className="font-serif text-2xl text-white">{venue?.name || "Venue name"}</h4>
                      <p className="mt-2 text-xs uppercase tracking-widest text-[#D8B76A]">
                        {venue?.generalLocation || "Location"}{venue?.city ? `, ${venue.city}` : ""}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-white/55">
                        {venue?.description || "Add a warm venue description so couples understand the ambience, capacity, parking, and what makes your space right for a wedding."}
                      </p>
                    </div>
                    <div className="venue-preview-specs grid gap-3 rounded-2xl border border-white/10 bg-white/3 p-4">
                      {[
                        ["Capacity", venue?.capacity || "Not set"],
                        ["Price range", venue?.priceRange || "Not set"],
                        ["Style", venue?.style || "Not set"],
                        ["WhatsApp", venue?.whatsapp || "Not set"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                          <span className="text-[10px] uppercase tracking-wider text-white/35">{label}</span>
                          <span className="text-right text-xs font-semibold text-white/75">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* TAB 3: GALLERY PHOTOS */}
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

          {/* TAB 4: INQUIRY INBOX */}
          {activeTab === "inquiries" && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">Lead tracker</p>
                    <h3 className="mt-2 font-serif text-2xl text-white">Inquiry inbox</h3>
                    <p className="mt-2 text-xs text-white/45">
                      {inquiryCounts.overdue
                        ? `${inquiryCounts.overdue} ${inquiryCounts.overdue === 1 ? "lead needs" : "leads need"} a reply.`
                        : "Unreplied leads stay visible until you reply or archive them."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchInquiries}
                    disabled={loadingInquiries}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#c2b17b] transition hover:text-[#D8B76A] disabled:opacity-50"
                  >
                    <Icon icon="lucide:refresh-cw" className={`h-3.5 w-3.5 ${loadingInquiries ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {inquiryFilters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setInquiryFilter(filter.value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                        inquiryFilter === filter.value
                          ? "border-[#D8B76A] bg-[#D8B76A] text-[#070A13]"
                          : "border-white/10 bg-white/5 text-white/55 hover:border-[#D8B76A]/35 hover:text-[#D8B76A]"
                      }`}
                    >
                      {filter.label}
                      <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${
                        inquiryFilter === filter.value ? "bg-[#070A13]/15" : "bg-white/10 text-white/60"
                      }`}>
                        {inquiryCounts[filter.value] || 0}
                      </span>
                    </button>
                  ))}
                </div>

                {loadingInquiries ? (
                  <div className="grid gap-3">
                    {[0, 1, 2].map((item) => (
                      <Skeleton key={item} className="h-24 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : venueInquiries.length ? (
                  <div className="grid gap-3">
                    {venueInquiries.map((inquiry) => (
                      <article key={inquiry._id} className={`rounded-2xl border p-4 ${
                        (inquiry.status || "new") === "new" && getInquiryAgeDays(inquiry.createdAt) >= 2
                          ? "border-amber-400/25 bg-amber-400/4"
                          : "border-white/10 bg-[#070A13]/70"
                      }`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-white">{inquiry.coupleName}</h4>
                              {(() => {
                                const statusMeta = getInquiryStatusMeta(inquiry);
                                return (
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusMeta.tone}`}>
                                    <Icon icon={statusMeta.icon} className="h-3 w-3" />
                                    {statusMeta.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-white/40">
                              {inquiry.coupleEmail && <span>{inquiry.coupleEmail}</span>}
                              {inquiry.weddingDate && <span>Wedding: {formatShortDate(inquiry.weddingDate)}</span>}
                              <span>Sent: {formatShortDate(inquiry.createdAt)}</span>
                              {inquiry.repliedAt && <span>Replied: {formatShortDate(inquiry.repliedAt)}</span>}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {inquiry.coupleEmail && (
                              <a
                                href={`mailto:${inquiry.coupleEmail}`}
                                onClick={() => {
                                  if ((inquiry.status || "new") !== "replied") {
                                    updateInquiryStatus(inquiry._id, "replied");
                                  }
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#070A13]"
                              >
                                <Icon icon="lucide:send" className="h-3.5 w-3.5" />
                                Reply
                              </a>
                            )}
                            {(inquiry.status || "new") !== "replied" && (
                              <button
                                type="button"
                                onClick={() => updateInquiryStatus(inquiry._id, "replied")}
                                disabled={updatingInquiryId === inquiry._id}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Icon icon={updatingInquiryId === inquiry._id ? "lucide:loader-2" : "lucide:check-check"} className={`h-3.5 w-3.5 ${updatingInquiryId === inquiry._id ? "animate-spin" : ""}`} />
                                Mark replied
                              </button>
                            )}
                            {(inquiry.status || "new") !== "unavailable" && (
                              <button
                                type="button"
                                onClick={() => updateInquiryStatus(inquiry._id, "unavailable")}
                                disabled={updatingInquiryId === inquiry._id}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-200 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Icon icon="lucide:calendar-x" className="h-3.5 w-3.5" />
                                Unavailable
                              </button>
                            )}
                            {(inquiry.status || "new") === "unavailable" && (
                              <button
                                type="button"
                                onClick={() => updateInquiryStatus(inquiry._id, "new")}
                                disabled={updatingInquiryId === inquiry._id}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-200 transition hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Icon icon="lucide:calendar-check" className="h-3.5 w-3.5" />
                                Available now
                              </button>
                            )}
                            {(inquiry.status || "new") === "archived" && (
                              <button
                                type="button"
                                onClick={() => updateInquiryStatus(inquiry._id, "new")}
                                disabled={updatingInquiryId === inquiry._id}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/65 transition hover:text-[#D8B76A] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Icon icon="lucide:rotate-ccw" className="h-3.5 w-3.5" />
                                Reopen
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleArchiveInquiry(inquiry._id, inquiry.coupleName)}
                              disabled={updatingInquiryId === inquiry._id || (inquiry.status || "new") === "archived"}
                              className="venue-archive-action inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/55 transition hover:border-[#D8B76A]/35 hover:text-[#D8B76A] disabled:cursor-not-allowed disabled:opacity-35"
                              aria-label={`Archive inquiry from ${inquiry.coupleName}`}
                              title="Archive inquiry"
                            >
                              <Icon
                                icon={updatingInquiryId === inquiry._id ? "lucide:loader-2" : "lucide:archive"}
                                className={`h-3.5 w-3.5 ${updatingInquiryId === inquiry._id ? "animate-spin" : ""}`}
                              />
                              Archive
                            </button>
                          </div>
                        </div>
                        <p className="mt-4 rounded-2xl border border-white/5 bg-white/3 p-3 text-sm leading-relaxed text-white/60">
                          {inquiry.message}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-8 text-center">
                    <Icon icon="lucide:mail-open" className="mx-auto h-8 w-8 text-white/30" />
                    <h4 className="mt-4 font-serif text-xl text-white">No inquiries yet</h4>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/45">
                      Once couples send a venue inquiry, it will appear here with their message and reply email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SUBSCRIPTIONS & CHECKOUT */}
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

          {/* TAB 6: SECURITY & DANGER ZONE */}
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

              {/* Account deletion block */}
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-serif text-xl text-red-400">Account deletion</h3>
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
                      if (devBypassSubmittingRef.current) return;

                      const token = localStorage.getItem("venueToken");
                      devBypassSubmittingRef.current = true;
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
                        devBypassSubmittingRef.current = false;
                      } catch (err) {
                        toast.error("Dev bypass failed.");
                        devBypassSubmittingRef.current = false;
                        setCheckoutModal((prev) => ({ ...prev, submitting: false }));
                      }
                    }}
                    disabled={checkoutModal.submitting}
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
