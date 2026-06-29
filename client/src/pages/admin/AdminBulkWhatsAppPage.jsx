import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import Skeleton from "../../components/common/Skeleton";
import { showConfirmToast } from "../../utils/toastConfirm";
import { Icon } from "@iconify/react";

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

  // Template settings
  const [messageTemplate, setMessageTemplate] = useState(
    "Hello {guestName}, you are specially invited to celebrate the wedding of {coupleNames}. View your invitation and RSVP here: {inviteLink} — Powered by VowLink."
  );
  const [senderLabel, setSenderLabel] = useState("couple"); // couple, partner1, partner2, custom
  const [customSenderName, setCustomSenderName] = useState("");

  const coupleNames = user.partner1Name && user.partner2Name ? `${user.partner1Name} and ${user.partner2Name}` : "us";

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

  useEffect(() => {
    if (user.tier === "pro") {
      fetchInvitations();
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
          The **Bulk WhatsApp Invite Sender** is a premium pro tool. Upgrade to VowLink Pro to assign guests to partner queues, compose customized WhatsApp message templates, and track who has been sent their invite links.
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
      if (inv.whatsappStatus === "sent") {
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
    if (activeTab === "sent") return inv.whatsappStatus === "sent";
    if (activeTab === "missing") return isMissing;

    // Partner/general queues show only active, valid, non-sent guests
    if (inv.whatsappStatus === "sent" || isMissing) return false;

    if (activeTab === "bride") return inv.senderGroup === "bride" || inv.senderGroup === "both";
    if (activeTab === "groom") return inv.senderGroup === "groom" || inv.senderGroup === "both";
    if (activeTab === "general") return inv.senderGroup === "general";

    return true;
  });

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
      if (guest && guest.phoneNumber && guest.whatsappStatus !== "sent") {
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

    const inviteLink = `${window.location.origin}/invite/${guest.slug}`;
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
      return !isMissing && g.whatsappStatus !== "sent";
    });

    if (!nextGuest) {
      toast.info("No more unsent guests with phone numbers in the active queue!");
      return;
    }

    handleOpenWhatsApp(nextGuest);
    toast.info(`Opened WhatsApp chat for ${nextGuest.guestName}.`);
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
      <div className="mb-6 flex flex-wrap justify-between items-end gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Premium Dashboard</p>
          <h2 className="font-serif text-3xl sm:text-4xl">Bulk WhatsApp Invite Sender</h2>
          <p className="text-white/40 text-xs mt-1 max-w-2xl leading-relaxed">
            VowLink prepares personalized messages and custom invitation links for each guest. Select your queue, verify the messages, and open each contact's WhatsApp chat to dispatch manually.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Template & Presets Column */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto space-y-6 no-scrollbar">
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-5 sm:p-6 space-y-4">
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
            <div className="pt-4 border-t border-white/5 space-y-2.5">
              <h4 className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Dispatch Actions</h4>
              
              <button
                onClick={handleOpenNextUnsent}
                className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(216,183,106,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icon icon="lucide:message-square" className="w-4 h-4 text-[#070A13]" /> Open Next Unsent
              </button>

              <button
                onClick={handlePrepareInvites}
                disabled={selectedIds.length === 0 || preparingInvites}
                className="w-full rounded-full border border-white/15 bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
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
                  `Prepare WhatsApp Invites (${selectedIds.length})`
                )}
              </button>
            </div>
            </>
            )}
          </div>
        </div>

        {/* Right Guest Queues Grid Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
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
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-[#0d1220]/70 backdrop-blur-md">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
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
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-[10px] uppercase text-white/50">Assign Selected:</span>
                <select
                  value={bulkQueueVal}
                  onChange={(e) => setBulkQueueVal(e.target.value)}
                  className="rounded-lg border bg-[#070A13] border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
                >
                  <option value="">Choose Queue...</option>
                  <option value="general">General Queue</option>
                  <option value="bride">Bride's Queue</option>
                  <option value="groom">Groom's Queue</option>
                  <option value="both">Both Queues</option>
                </select>
                <button
                  onClick={handleBulkQueueAssign}
                  className="px-3 py-1.5 bg-[#D8B76A] hover:bg-[#F2D894] text-[#070A13] text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                >
                  Apply
                </button>
                <button
                  onClick={handleDeleteSelectedGuests}
                  className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* Guests Table */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1220] overflow-hidden">
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
                      const inviteLink = `${window.location.origin}/invite/${guest.slug}`;
                      
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
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold border ${
                              guest.whatsappStatus === "sent"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                : guest.whatsappStatus === "ready"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                                : isMissing
                                ? "bg-red-500/15 text-red-400 border-red-500/25"
                                : "bg-white/5 text-white/40 border-white/5"
                            }`}>
                              {isMissing ? "Missing Num" : guest.whatsappStatus.replace("_", " ")}
                            </span>
                            {guest.whatsappStatus === "sent" && guest.whatsappSentBy && (
                              <div className="text-[9px] text-white/40 mt-1 block">
                                by {guest.whatsappSentBy}
                              </div>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col sm:flex-row gap-1.5 justify-center">
                              {!isMissing && (
                                <button
                                  onClick={() => handleOpenWhatsApp(guest)}
                                  className="px-2 py-1 rounded bg-[#3EC58E] hover:bg-[#32B07C] text-[#070A13] font-bold text-[9px] uppercase transition cursor-pointer"
                                >
                                  Open
                                </button>
                              )}
                              
                              {guest.whatsappStatus !== "sent" ? (
                                <button
                                  onClick={() => updateWhatsAppStatus(guest._id, "sent")}
                                  disabled={loadingIds.has(guest._id)}
                                  className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] uppercase transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  {loadingIds.has(guest._id) ? (
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : "Sent"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateWhatsAppStatus(guest._id, "not_sent")}
                                  disabled={loadingIds.has(guest._id)}
                                  className="px-2 py-1 rounded border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-400 font-bold text-[9px] uppercase transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  {loadingIds.has(guest._id) ? (
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : "Undo"}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteGuest(guest)}
                                disabled={loadingIds.has(guest._id)}
                                className="px-2 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-[9px] uppercase transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
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
