import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import Skeleton from "../../components/common/Skeleton";
import { showConfirmToast } from "../../utils/toastConfirm";
import { Icon } from "@iconify/react";
import { buildPublicUrl } from "../../utils/siteUrl";
import PageMiniTour from "../../components/PageMiniTour";

const WHATSAPP_TOUR_STEPS = [
  {
    target: '[data-tour="whatsapp-header"]',
    title: "WhatsApp sender",
    body: "Prepare personalized invitation messages and manage your sending queue from this page.",
  },
  {
    target: '[data-tour="whatsapp-compose"]',
    title: "Compose message",
    body: "Choose who the message appears to come from and edit the message template before preparing invites.",
  },
  {
    target: '[data-tour="whatsapp-queues"]',
    title: "Guest queues",
    body: "Switch between bride, groom, general, missing numbers, sent, and all guests.",
  },
  {
    target: '[data-tour="whatsapp-controls"]',
    title: "Search and assign",
    body: "Search guests, select multiple entries, assign queues, or delete selected guest records.",
  },
  {
    target: '[data-tour="whatsapp-list"]',
    title: "Send list",
    body: "Review each guest, message preview, WhatsApp status, and actions before sending.",
  },
];

const cleanPhone = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s+\-()]/g, "");
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = "234" + cleaned.substring(1);
  }
  if (cleaned.length < 7 || !/^\d+$/.test(cleaned)) {
    return "";
  }
  return cleaned;
};

const formatMessage = (template, guestName, coupleNames, inviteLink, senderName) => {
  return template
    .replace(/{guestName}/g, guestName || "")
    .replace(/{coupleNames}/g, coupleNames || "")
    .replace(/{inviteLink}/g, inviteLink || "")
    .replace(/{senderName}/g, senderName || "");
};

const AdminBulkWhatsAppPage = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkQueueVal, setBulkQueueVal] = useState("");
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [preparingInvites, setPreparingInvites] = useState(false);
  const [cloudConfig, setCloudConfig] = useState(null);
  const [cloudSending, setCloudSending] = useState(false);

  // Template settings
  const [messageTemplate, setMessageTemplate] = useState(
    "Hello {guestName}, you are specially invited to celebrate the wedding of {coupleNames}. View your invitation and RSVP here: {inviteLink} — Powered by VowLink."
  );
  const [senderLabel, setSenderLabel] = useState("couple"); // couple, partner1, partner2, custom
  const [customSenderName, setCustomSenderName] = useState("");

  const coupleNames = user.partner1Name && user.partner2Name ? `${user.partner1Name} and ${user.partner2Name}` : "us";
  const cloudConfigured = Boolean(cloudConfig?.configured);

  const sentStatuses = new Set(["sent", "delivered", "read"]);
  const isGuestSendable = (guest) => {
    const isMissing = !guest?.phoneNumber || guest?.whatsappStatus === "missing_number";
    return Boolean(guest && !isMissing && !sentStatuses.has(guest.whatsappStatus));
  };

  const getStatusLabel = (guest) => {
    if (!guest.phoneNumber || guest.whatsappStatus === "missing_number") return "Missing Num";
    return (guest.whatsappStatus || "not_sent").replace("_", " ");
  };

  const getStatusClass = (status, isMissing) => {
    if (isMissing) return "bg-red-500/15 text-red-400 border-red-500/25";
    if (status === "read") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    if (status === "delivered") return "bg-teal-500/15 text-teal-300 border-teal-500/25";
    if (status === "sent") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
    if (status === "ready" || status === "queued") return "bg-blue-500/15 text-blue-400 border-blue-500/25";
    if (status === "failed") return "bg-red-500/15 text-red-300 border-red-500/25";
    return "bg-white/5 text-white/40 border-white/5";
  };

  const getSenderName = () => {
    if (senderLabel === "partner1") return user.partner1Name || "Partner 1";
    if (senderLabel === "partner2") return user.partner2Name || "Partner 2";
    if (senderLabel === "couple") return `${user.partner1Name || "Partner 1"} & ${user.partner2Name || "Partner 2"}`;
    return customSenderName;
  };

  const fetchInvitations = async () => {
    try {
      const res = await api.get("/invitations");
      setInvitations(res.data);
    } catch (err) {
      toast.error("Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudConfig = async () => {
    try {
      const res = await api.get("/whatsapp/config-status");
      setCloudConfig(res.data);
    } catch {
      setCloudConfig({ configured: false });
    }
  };

  useEffect(() => {
    if (user.tier === "pro") {
      fetchInvitations();
      fetchCloudConfig();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (user.tier !== "pro") {
    return (
      <div className="p-4 sm:p-8 max-w-xl mx-auto text-white text-center py-20">
        <div className="w-20 h-20 rounded-full bg-[#D8B76A]/10 border border-[#D8B76A]/30 flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_20px_rgba(216,183,106,0.1)]">
          <Icon icon="lucide:lock" className="w-8 h-8 text-[#D8B76A]" />
        </div>
        <h2 className="font-serif text-3xl text-white mb-3">Pro-Only Feature</h2>
        <p className="text-white/60 text-sm mb-8 leading-relaxed">
          The Bulk WhatsApp Invite Sender is a Pro tool. Upgrade to VowLink Pro to assign guests to partner queues, compose customized WhatsApp message templates, and track who has been sent their invite links.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/admin/billing")}
            className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] cursor-pointer"
          >
            Upgrade to Pro
          </button>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="rounded-full border border-white/10 px-8 py-3.5 text-xs text-white/70 hover:text-white hover:border-white/20 transition cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Count helper functions for badge pills
  const getTabCounts = () => {
    let counts = { bride: 0, groom: 0, general: 0, missing: 0, sent: 0, all: invitations.length };
    invitations.forEach((inv) => {
      const isMissing = !inv.phoneNumber || inv.whatsappStatus === "missing_number";
      if (sentStatuses.has(inv.whatsappStatus)) {
        counts.sent++;
      } else {
        if (isMissing) {
          counts.missing++;
        } else {
          if (inv.senderGroup === "bride" || inv.senderGroup === "both") counts.bride++;
          if (inv.senderGroup === "groom" || inv.senderGroup === "both") counts.groom++;
          if (inv.senderGroup === "general") counts.general++;
        }
      }
    });
    return counts;
  };

  const counts = getTabCounts();

  // Filter queues logic
  const filteredGuests = invitations.filter((inv) => {
    const matchesSearch = inv.guestName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isMissing = !inv.phoneNumber || inv.whatsappStatus === "missing_number";

    if (activeTab === "all") return true;
    if (activeTab === "sent") return sentStatuses.has(inv.whatsappStatus);
    if (activeTab === "missing") return isMissing;

    // Partner/general queues show only active, valid, non-sent guests
    if (sentStatuses.has(inv.whatsappStatus) || isMissing) return false;

    if (activeTab === "bride") return inv.senderGroup === "bride" || inv.senderGroup === "both";
    if (activeTab === "groom") return inv.senderGroup === "groom" || inv.senderGroup === "both";
    if (activeTab === "general") return inv.senderGroup === "general";

    return true;
  });
  const selectedGuests = invitations.filter((guest) => selectedIds.includes(guest._id));
  const selectedSendableCount = selectedGuests.filter(isGuestSendable).length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredGuests.map((g) => g._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const updateWhatsAppStatus = async (id, status) => {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      const res = await api.patch(`/invitations/${id}/whatsapp-status`, {
        whatsappStatus: status,
        whatsappSentBy: getSenderName() || "Partner 1"
      });
      setInvitations((prev) =>
        prev.map((inv) => (inv._id === id ? { ...inv, ...res.data.data } : inv))
      );
      toast.success(`Guest updated to ${status.replace("_", " ")}!`);
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteGuest = (guest) => {
    showConfirmToast({
      toastId: `delete-whatsapp-queue-${guest._id}`,
      confirmLabel: "Delete",
      message: `Delete ${guest.guestName || "this guest"} from the WhatsApp queue? This permanently removes their invitation and linked RSVP responses.`,
      onConfirm: async () => {
        try {
          await api.delete(`/invitations/${guest._id}`);
          setInvitations((prev) => prev.filter((inv) => inv._id !== guest._id));
          setSelectedIds((prev) => prev.filter((id) => id !== guest._id));
          toast.success("Guest deleted from queue.");
        } catch {
          toast.error("Failed to delete guest.");
        }
      },
    });
  };

  const handleDeleteSelectedGuests = () => {
    const selectedGuests = invitations.filter((guest) => selectedIds.includes(guest._id));
    if (selectedGuests.length === 0) {
      toast.warning("Please select guests to delete.");
      return;
    }

    showConfirmToast({
      toastId: "delete-selected-whatsapp-queue",
      confirmLabel: "Delete selected",
      message: `Delete ${selectedGuests.length} selected guest${selectedGuests.length === 1 ? "" : "s"} from the WhatsApp queue? This permanently removes their invitations and linked RSVP responses.`,
      onConfirm: async () => {
        try {
          await Promise.all(selectedGuests.map((guest) => api.delete(`/invitations/${guest._id}`)));
          const deletedIds = new Set(selectedGuests.map((guest) => guest._id));
          setInvitations((prev) => prev.filter((inv) => !deletedIds.has(inv._id)));
          setSelectedIds([]);
          toast.success(`Deleted ${selectedGuests.length} guest${selectedGuests.length === 1 ? "" : "s"} from queue.`);
        } catch {
          toast.error("Failed to delete selected guests.");
        }
      },
    });
  };

  const handlePrepareInvites = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one guest first.");
      return;
    }
    
    setPreparingInvites(true);
    // Set status of all selected guests to 'ready'
    let successCount = 0;
    for (const id of selectedIds) {
      const guest = invitations.find(g => g._id === id);
      if (guest && guest.phoneNumber && !sentStatuses.has(guest.whatsappStatus)) {
        try {
          const res = await api.patch(`/invitations/${id}/whatsapp-status`, { whatsappStatus: "ready" });
          setInvitations((prev) =>
            prev.map((inv) => (inv._id === id ? { ...inv, ...res.data.data } : inv))
          );
          successCount++;
        } catch {}
      }
    }
    toast.success(`Prepared ${successCount} WhatsApp invitations successfully!`);
    setSelectedIds([]);
    setPreparingInvites(false);
  };

  const handleOpenWhatsApp = (guest) => {
    const rawPhone = cleanPhone(guest.phoneNumber);
    if (!rawPhone) {
      toast.warning(`Guest "${guest.guestName}" does not have a valid phone number.`);
      return;
    }

    const inviteLink = buildPublicUrl(`/invite/${guest.slug}`);
    const senderName = getSenderName();
    const rawMsg = formatMessage(messageTemplate, guest.guestName, coupleNames, inviteLink, senderName);
    const encodedMsg = encodeURIComponent(rawMsg);
    
    window.open(`https://wa.me/${rawPhone}?text=${encodedMsg}`, "_blank");

    if (guest.whatsappStatus === "not_sent") {
      updateWhatsAppStatus(guest._id, "ready");
    }
  };

  const handleOpenNextUnsent = () => {
    const nextGuest = filteredGuests.find((g) => {
      const isMissing = !g.phoneNumber || g.whatsappStatus === "missing_number";
      return !isMissing && !sentStatuses.has(g.whatsappStatus);
    });

    if (!nextGuest) {
      toast.info("No more unsent guests with phone numbers in the active queue!");
      return;
    }

    handleOpenWhatsApp(nextGuest);
    toast.info(`Opened WhatsApp chat for ${nextGuest.guestName}.`);
  };

  const handleCloudSendGuest = async (guest) => {
    if (!cloudConfigured) {
      toast.warning("WhatsApp Cloud API is not configured yet.");
      return;
    }

    setLoadingIds((prev) => new Set(prev).add(guest._id));
    try {
      const res = await api.post(`/whatsapp/send/${guest._id}`);
      setInvitations((prev) =>
        prev.map((inv) => (inv._id === guest._id ? { ...inv, ...res.data.data } : inv))
      );
      toast.success(`Sent WhatsApp invite to ${guest.guestName}.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send WhatsApp invite.");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(guest._id);
        return next;
      });
    }
  };

  const handleCloudSendSelected = async () => {
    if (!cloudConfigured) {
      toast.warning("WhatsApp Cloud API is not configured yet.");
      return;
    }
    const sendableIds = selectedIds.filter((id) => {
      const guest = invitations.find((inv) => inv._id === id);
      const isMissing = !guest?.phoneNumber || guest?.whatsappStatus === "missing_number";
      return guest && !isMissing && !sentStatuses.has(guest.whatsappStatus);
    });

    if (sendableIds.length === 0) {
      toast.warning("Select guests before sending a broadcast.");
      return;
    }

    setCloudSending(true);
    try {
      const res = await api.post("/whatsapp/send-bulk", { invitationIds: sendableIds });
      const updates = new Map((res.data.results || []).map((item) => [String(item.id), item.data]));
      setInvitations((prev) =>
        prev.map((inv) => (updates.has(String(inv._id)) ? { ...inv, ...updates.get(String(inv._id)) } : inv))
      );
      setSelectedIds([]);
      toast.success(res.data.message || "WhatsApp broadcast complete.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send WhatsApp broadcast.");
    } finally {
      setCloudSending(false);
    }
  };

  const handleBulkQueueAssign = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select guests to assign.");
      return;
    }
    if (!bulkQueueVal) {
      toast.warning("Please select a target queue.");
      return;
    }

    try {
      await api.post("/invitations/bulk-update-sender-group", {
        invitationIds: selectedIds,
        senderGroup: bulkQueueVal
      });
      setInvitations((prev) =>
        prev.map((inv) =>
          selectedIds.includes(inv._id) ? { ...inv, senderGroup: bulkQueueVal } : inv
        )
      );
      toast.success(`Successfully assigned ${selectedIds.length} guests to ${bulkQueueVal} queue.`);
      setSelectedIds([]);
      setBulkQueueVal("");
    } catch {
      toast.error("Failed to update queue assignments.");
    }
  };

  const loadSenderPreset = (label) => {
    setSenderLabel(label);
    if (label === "couple") {
      setMessageTemplate(
        "Hello {guestName}, you are specially invited to celebrate the wedding of {coupleNames}. View your invitation and RSVP here: {inviteLink} — Powered by VowLink."
      );
    } else {
      setMessageTemplate(
        "Hi {guestName}, this is {senderName}. You are specially invited to celebrate the wedding of {coupleNames}. View your invitation and RSVP here: {inviteLink} — Powered by VowLink."
      );
    }
  };

  // Removed early exit for loading to support inline skeletons

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div data-tour="whatsapp-header" className="mb-6 flex flex-wrap justify-between items-end gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Premium Dashboard</p>
          <h2 className="font-serif text-3xl sm:text-4xl">Bulk WhatsApp Invite Sender</h2>
          <p className="text-white/40 text-xs mt-1 max-w-2xl leading-relaxed">
            Send approved WhatsApp invitations through Cloud API, or open a manual chat when you need to review a guest message first.
          </p>
        </div>
        <PageMiniTour title="WhatsApp sender tour" storageKey="vowlink-tour-whatsapp" steps={WHATSAPP_TOUR_STEPS} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Template & Presets Column */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto space-y-6 no-scrollbar">
          <div data-tour="whatsapp-compose" className="rounded-2xl border border-white/10 bg-[#0D1220] p-5 sm:p-6 space-y-4">
            <h3 className="font-serif text-lg text-[#D8B76A] border-b border-white/5 pb-2">1. Compose Message</h3>
            
            {loading ? (
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-28 w-full" />
                </div>
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-10 w-full rounded-full" />
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              </div>
            ) : (
              <>
            
            {/* Sender Preset Selection */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-2">Sender Preset</label>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-semibold">
                <button
                  onClick={() => loadSenderPreset("couple")}
                  className={`py-2 rounded-lg border transition cursor-pointer ${
                    senderLabel === "couple"
                      ? "bg-[#D8B76A]/10 border-[#D8B76A] text-[#D8B76A]"
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  From Couple
                </button>
                <button
                  onClick={() => loadSenderPreset("partner1")}
                  className={`py-2 rounded-lg border transition cursor-pointer ${
                    senderLabel === "partner1"
                      ? "bg-[#D8B76A]/10 border-[#D8B76A] text-[#D8B76A]"
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  From {user.partner1Name || "Partner 1"}
                </button>
                <button
                  onClick={() => loadSenderPreset("partner2")}
                  className={`py-2 rounded-lg border transition cursor-pointer ${
                    senderLabel === "partner2"
                      ? "bg-[#D8B76A]/10 border-[#D8B76A] text-[#D8B76A]"
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  From {user.partner2Name || "Partner 2"}
                </button>
                <button
                  onClick={() => loadSenderPreset("custom")}
                  className={`py-2 rounded-lg border transition cursor-pointer ${
                    senderLabel === "custom"
                      ? "bg-[#D8B76A]/10 border-[#D8B76A] text-[#D8B76A]"
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  Custom Sender
                </button>
              </div>
            </div>

            {/* Custom Sender Name Text Field */}
            {senderLabel === "custom" && (
              <div className="animate-fade-in">
                <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5">Custom Sender Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Adebayo"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-[#D8B76A]/60 outline-none"
                  value={customSenderName}
                  onChange={(e) => setCustomSenderName(e.target.value)}
                />
              </div>
            )}

            {/* Message Template Editor */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5">Message Template</label>
              <textarea
                rows={6}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-white/20 outline-none focus:border-[#D8B76A]/60 font-sans resize-none leading-relaxed"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
              />
              <div className="mt-2 p-3 bg-black/20 rounded-xl border border-white/5 text-[9px] text-white/40 space-y-1">
                <p className="font-semibold text-white/60">Supported placeholders:</p>
                <p><code className="text-[#D8B76A]">{`{guestName}`}</code> — Guest's full name</p>
                <p><code className="text-[#D8B76A]">{`{coupleNames}`}</code> — {coupleNames}</p>
                <p><code className="text-[#D8B76A]">{`{inviteLink}`}</code> — Guest's unique link</p>
                {senderLabel !== "couple" && (
                  <p><code className="text-[#D8B76A]">{`{senderName}`}</code> — "{getSenderName()}"</p>
                )}
              </div>
            </div>

            {/* Actions Stepper Card */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Dispatch actions</h4>
                {selectedIds.length > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/55">
                    {selectedSendableCount} sendable
                  </span>
                )}
              </div>
              
              <button
                onClick={handleOpenNextUnsent}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-white/75 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D8B76A]/40 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icon icon="lucide:message-square" className="w-4 h-4" /> Open next manual chat
              </button>

              <button
                onClick={handlePrepareInvites}
                disabled={selectedIds.length === 0 || preparingInvites}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition focus:outline-none focus:ring-2 focus:ring-[#D8B76A]/40 cursor-pointer flex items-center justify-center gap-2"
              >
                {preparingInvites ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Preparing...
                  </>
                ) : (
                  `Prepare selected messages (${selectedIds.length})`
                )}
              </button>

              <div className={`rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                cloudConfigured
                  ? "border-emerald-400/25 bg-emerald-500/10"
                  : "border-yellow-500/20 bg-yellow-500/10"
              }`}>
                <div className="flex items-start gap-3">
                  <Icon
                    icon={cloudConfigured ? "lucide:badge-check" : "lucide:settings"}
                    className={`mt-0.5 h-4 w-4 shrink-0 ${cloudConfigured ? "text-emerald-300" : "text-yellow-300"}`}
                  />
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      cloudConfigured ? "text-emerald-200" : "text-yellow-200"
                    }`}>
                      {cloudConfigured ? "Cloud API ready" : "Cloud API not configured"}
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/55">
                      {cloudConfigured
                        ? `${cloudConfig?.templateName || "vowlink_invitation"} sends through the approved Meta template.`
                        : "Add the WhatsApp Cloud API env vars on Render, then use one button to send selected invite links officially."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloudSendSelected}
                  disabled={!cloudConfigured || selectedSendableCount === 0 || cloudSending}
                  className={`mt-4 w-full rounded-xl px-4 py-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-300/40 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 flex items-center justify-center gap-2 ${
                    cloudConfigured && selectedSendableCount > 0
                      ? "border border-emerald-300/30 bg-emerald-300 text-[#07130e] hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-[0_14px_30px_rgba(16,185,129,0.18)]"
                      : "border border-white/12 bg-white/10 text-white/55"
                  }`}
                >
                  {cloudSending ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:send" className="h-4.5 w-4.5" />
                      Send via Cloud API ({selectedSendableCount})
                    </>
                  )}
                </button>
                {selectedIds.length > 0 && selectedSendableCount !== selectedIds.length && (
                  <p className="mt-2 text-[10px] leading-relaxed text-white/45">
                    {selectedIds.length - selectedSendableCount} selected guest{selectedIds.length - selectedSendableCount === 1 ? "" : "s"} will be skipped because they are missing a number or already sent.
                  </p>
                )}
              </div>
            </div>
            </>
            )}
          </div>
        </div>

        {/* Right Guest Queues Grid Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tabs Navigation */}
          <div data-tour="whatsapp-queues" className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
            {[
              { id: "bride", label: "Bride's Queue", count: counts.bride },
              { id: "groom", label: "Groom's Queue", count: counts.groom },
              { id: "general", label: "General Queue", count: counts.general },
              { id: "missing", label: "Missing Numbers", count: counts.missing },
              { id: "sent", label: "Sent", count: counts.sent },
              { id: "all", label: "All Guests", count: counts.all },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedIds([]);
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium shrink-0 flex items-center gap-2 transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#D8B76A]/10 border-[#D8B76A] text-[#D8B76A]"
                    : "bg-white/3 border-white/5 text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-[#D8B76A] text-[#070A13]" : "bg-white/10 text-white/60"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filtering, Search & Bulk Assignment controls */}
          <div data-tour="whatsapp-controls" className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-[#0d1220]/70 backdrop-blur-md">
            {/* Search Input */}
            <div className="min-w-50 flex-1">
              <input
                type="text"
                placeholder="Search guests by name..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white focus:border-[#D8B76A]/60 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Bulk Assignment Selector */}
            {selectedIds.length > 0 && (
              <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 animate-fade-in">
                <span className="w-full sm:w-auto text-[10px] uppercase text-white/50">Assign Selected:</span>
                <select
                  value={bulkQueueVal}
                  onChange={(e) => setBulkQueueVal(e.target.value)}
                  className="min-w-0 flex-1 sm:flex-none rounded-lg border bg-[#070A13] border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
                >
                  <option value="">Choose Queue...</option>
                  <option value="general">General Queue</option>
                  <option value="bride">Bride's Queue</option>
                  <option value="groom">Groom's Queue</option>
                  <option value="both">Both Queues</option>
                </select>
                <button
                  onClick={handleBulkQueueAssign}
                  className="shrink-0 px-3 py-1.5 bg-[#D8B76A] hover:bg-[#F2D894] text-[#070A13] text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                >
                  Apply
                </button>
                <button
                  onClick={handleDeleteSelectedGuests}
                  className="shrink-0 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* Guests Table */}
          <div data-tour="whatsapp-list" className="rounded-2xl border border-white/10 bg-[#0d1220] overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-white/40">
                      <th className="px-4 py-3.5 w-10 text-center">
                        <Skeleton className="h-3.5 w-3.5 rounded mx-auto" />
                      </th>
                      <th className="px-4 py-3.5 font-semibold">Guest</th>
                      <th className="px-4 py-3.5 font-semibold">Queue / Phone</th>
                      <th className="px-4 py-3.5 font-semibold hidden md:table-cell">Message Preview</th>
                      <th className="px-4 py-3.5 font-semibold text-center w-24">Status</th>
                      <th className="px-4 py-3.5 font-semibold text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="border-b border-white/5 bg-[#0D1220]">
                        <td className="px-4 py-4 text-center">
                          <Skeleton className="h-3.5 w-3.5 rounded mx-auto" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-12 rounded" />
                            <Skeleton className="h-3.5 w-24" />
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell max-w-xs">
                          <div className="space-y-1.5">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Skeleton className="h-5 w-20 rounded-full mx-auto" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <Skeleton className="h-6 w-10 rounded" />
                            <Skeleton className="h-6 w-10 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="p-12 text-center text-white/30 text-xs">
                No guests in this queue. Assign guests to this group or add them on the bulk guest import page.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-white/40">
                      <th className="px-4 py-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedIds.length === filteredGuests.length && filteredGuests.length > 0}
                          className="rounded border-white/20 text-[#D8B76A] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3.5 font-semibold">Guest</th>
                      <th className="px-4 py-3.5 font-semibold">Queue / Phone</th>
                      <th className="px-4 py-3.5 font-semibold hidden md:table-cell">Message Preview</th>
                      <th className="px-4 py-3.5 font-semibold text-center w-24">Status</th>
                      <th className="px-4 py-3.5 font-semibold text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest) => {
                      const isSelected = selectedIds.includes(guest._id);
                      const cleaned = cleanPhone(guest.phoneNumber);
                      const isMissing = !cleaned;
                      const inviteLink = buildPublicUrl(`/invite/${guest.slug}`);
                      
                      const rawMsg = formatMessage(
                        messageTemplate,
                        guest.guestName,
                        coupleNames,
                        inviteLink,
                        getSenderName()
                      );

                      return (
                        <tr
                          key={guest._id}
                          className={`border-b border-white/5 hover:bg-white/3 transition ${
                            isSelected ? "bg-white/2" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOne(guest._id)}
                              className="rounded border-white/20 text-[#D8B76A] focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* Guest Info */}
                          <td className="px-4 py-4">
                            <div className="font-semibold text-white">{guest.guestName}</div>
                            <div className="text-[10px] text-white/40 mt-0.5">Category: {guest.category}</div>
                          </td>

                          {/* Queue / Phone */}
                          <td className="px-4 py-4 font-mono text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold ${
                                guest.senderGroup === "bride"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : guest.senderGroup === "groom"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : guest.senderGroup === "both"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-white/5 text-white/50"
                              }`}>
                                {guest.senderGroup === "bride"
                                  ? "Bride"
                                  : guest.senderGroup === "groom"
                                  ? "Groom"
                                  : guest.senderGroup === "both"
                                  ? "Both"
                                  : guest.senderGroup || "—"}
                              </span>
                            </div>
                            <div className={`mt-1 font-sans ${isMissing ? "text-red-400" : "text-white/70"}`}>
                              {guest.phoneNumber || "No number input"}
                            </div>
                          </td>

                          {/* Message Preview (desktop only) */}
                          <td className="px-4 py-4 hidden md:table-cell max-w-xs">
                            <p className="line-clamp-2 text-white/40 text-[11px] leading-relaxed italic">
                              "{rawMsg}"
                            </p>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold border ${getStatusClass(guest.whatsappStatus, isMissing)}`}>
                              {getStatusLabel(guest)}
                            </span>
                            {sentStatuses.has(guest.whatsappStatus) && guest.whatsappSentBy && (
                              <div className="text-[9px] text-white/40 mt-1 block">
                                by {guest.whatsappSentBy}
                              </div>
                            )}
                            {guest.whatsappStatus === "failed" && guest.whatsappFailureReason && (
                              <div className="mx-auto mt-1 block max-w-32 line-clamp-2 text-[9px] text-red-300/70">
                                {guest.whatsappFailureReason}
                              </div>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex min-w-28 flex-col justify-center gap-1.5 sm:flex-row sm:flex-wrap">
                              {!isMissing && (
                                <button
                                  onClick={() => handleOpenWhatsApp(guest)}
                                  title="Open manual WhatsApp chat"
                                  className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D8B76A]/35 active:translate-y-px cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Icon icon="lucide:message-square" className="h-3.5 w-3.5" />
                                  Open
                                </button>
                              )}

                              {!isMissing && cloudConfigured && !sentStatuses.has(guest.whatsappStatus) && (
                                <button
                                  onClick={() => handleCloudSendGuest(guest)}
                                  disabled={loadingIds.has(guest._id)}
                                  title="Send approved Cloud API template"
                                  className="w-full sm:w-auto rounded-lg border border-emerald-300/30 bg-emerald-300 px-2.5 py-1.5 text-[10px] font-bold text-[#07130e] transition hover:bg-emerald-200 hover:shadow-[0_8px_20px_rgba(16,185,129,0.16)] focus:outline-none focus:ring-2 focus:ring-emerald-300/40 active:translate-y-px cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                  {loadingIds.has(guest._id) ? (
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <>
                                      <Icon icon="lucide:send" className="h-3 w-3" />
                                      Cloud
                                    </>
                                  )}
                                </button>
                              )}
                              
                              {!sentStatuses.has(guest.whatsappStatus) ? (
                                <button
                                  onClick={() => updateWhatsAppStatus(guest._id, "sent")}
                                  disabled={loadingIds.has(guest._id)}
                                  title="Mark as sent manually"
                                  className="w-full sm:w-auto rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-[10px] font-semibold text-white/50 transition hover:border-white/20 hover:bg-white/5 hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-[#D8B76A]/35 active:translate-y-px cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                  {loadingIds.has(guest._id) ? (
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <>
                                      <Icon icon="lucide:check" className="h-3.5 w-3.5" />
                                      Mark sent
                                    </>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateWhatsAppStatus(guest._id, "not_sent")}
                                  disabled={loadingIds.has(guest._id)}
                                  title="Move guest back to unsent"
                                  className="w-full sm:w-auto rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-2.5 py-1.5 text-[10px] font-semibold text-yellow-300 transition hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-300/35 active:translate-y-px cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                  {loadingIds.has(guest._id) ? (
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <>
                                      <Icon icon="lucide:rotate-ccw" className="h-3.5 w-3.5" />
                                      Undo
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteGuest(guest)}
                                disabled={loadingIds.has(guest._id)}
                                title="Delete guest"
                                className="w-full sm:w-auto rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-1.5 text-[10px] font-semibold text-red-300 transition hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-300/35 active:translate-y-px cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <Icon icon="lucide:trash-2" className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBulkWhatsAppPage;
