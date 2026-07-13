import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import Skeleton from "../../components/common/Skeleton";
import { Icon } from "@iconify/react";
import QRCode from "qrcode";
import { showConfirmToast } from "../../utils/toastConfirm";
import { buildPublicUrl } from "../../utils/siteUrl";

const AdminInvitationsPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [qrInvitation, setQrInvitation] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [printingQrSheet, setPrintingQrSheet] = useState(false);
  const [resettingCheckInId, setResettingCheckInId] = useState("");
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkInFilter, setCheckInFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [senderGroupFilter, setSenderGroupFilter] = useState("all");

  const fetchInvitations = async () => {
    try {
      const res = await api.get("/invitations");
      setInvitations(res.data);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCopy = (slug) => {
    const link = buildPublicUrl(`/invite/${slug}`);
    navigator.clipboard.writeText(link);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCheckInUrl = (invitation) =>
    buildPublicUrl(`/check-in/${invitation.checkInToken}`);

  const createQrDataUrl = (url, width = 360) =>
    QRCode.toDataURL(url, {
      width,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#070A13",
        light: "#FFFFFF",
      },
    });

  const escapeHtml = (value) =>
    String(value || "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );

  const formatCheckInLog = (invitation) => {
    if (!invitation?.checkedInAt) return "";

    const checkedInAt = new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(invitation.checkedInAt));

    const viaLabel = {
      pin: "usher PIN",
      couple: "couple account",
      admin: "admin",
      unknown: "check-in",
    }[invitation.checkedInVia || "unknown"];

    return `Checked in ${checkedInAt} via ${viaLabel}`;
  };

  const formatCheckInActivity = (entry) => {
    if (!entry?.at) return "";
    const actionLabel = entry.action === "reset" ? "Reset" : "Checked in";
    const viaLabel = {
      pin: "usher PIN",
      couple: "couple account",
      admin: "admin",
      unknown: "check-in",
    }[entry.via || "unknown"];

    return `${actionLabel} ${new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(entry.at))} via ${viaLabel}`;
  };

  useEffect(() => {
    let cancelled = false;

    const renderQr = async () => {
      if (!qrInvitation?.checkInToken) {
        setQrDataUrl("");
        return;
      }

      setQrLoading(true);
      try {
        const dataUrl = await createQrDataUrl(getCheckInUrl(qrInvitation), 360);
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) {
          setQrDataUrl("");
          toast.error("Unable to generate this QR code.");
        }
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    };

    renderQr();

    return () => {
      cancelled = true;
    };
  }, [qrInvitation]);

  const handleDownloadQr = async () => {
    if (!qrInvitation) return;
    if (!canUseCheckIn) {
      toast.info("Guest entry QR codes are available on Plus and Pro plans.");
      navigate("/admin/billing");
      return;
    }
    const checkInUrl = getCheckInUrl(qrInvitation);
    const filename = `check-in-qr-${qrInvitation.slug || qrInvitation.guestName || "guest"}.png`;

    setDownloadingQr(true);
    try {
      const dataUrl = await createQrDataUrl(checkInUrl, 720);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Unable to download this QR code.");
    } finally {
      setDownloadingQr(false);
    }
  };

  const handlePrintQrSheet = async () => {
    if (printingQrSheet) return;
    if (!canUseAdvancedCheckIn) {
      toast.info("Printable QR sheets are a Pro plan feature.");
      navigate("/admin/billing");
      return;
    }
    const printableInvitations = invitations.filter((inv) => inv.checkInToken);

    if (printableInvitations.length === 0) {
      toast.info(
        "No check-in QR codes are ready yet. Please refresh and try again.",
      );
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked. Allow popups to print the QR sheet.");
      return;
    }

    setPrintingQrSheet(true);
    try {
      printWindow.document.write(
        '<html><head><title>VowLink Entry QR Sheet</title></head><body><p style="font-family:sans-serif">Preparing QR sheet...</p></body></html>',
      );

      const cards = await Promise.all(
        printableInvitations.map(async (inv) => {
          const qr = await createQrDataUrl(getCheckInUrl(inv), 220);
          const guestCount = inv.allowedGuests || 1;
          return `
          <article class="qr-card">
            <img src="${qr}" alt="QR for ${escapeHtml(inv.guestName)}" />
            <div>
              <h2>${escapeHtml(inv.guestName || "Guest")}</h2>
              <p>${escapeHtml(inv.category || "Guest")} • ${guestCount} guest${guestCount === 1 ? "" : "s"}</p>
              <p class="slug">/invite/${escapeHtml(inv.slug)}</p>
            </div>
          </article>
        `;
        }),
      );

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>VowLink Entry QR Sheet</title>
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 24px; font-family: Inter, Arial, sans-serif; color: #070A13; background: #fff; }
              header { margin-bottom: 20px; border-bottom: 2px solid #070A13; padding-bottom: 12px; }
              h1 { margin: 0; font-family: Georgia, serif; font-size: 28px; }
              .meta { margin: 6px 0 0; color: #555; font-size: 12px; }
              .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
              .qr-card { display: grid; grid-template-columns: 116px 1fr; gap: 12px; min-height: 138px; border: 1px solid #d8d8d8; border-radius: 12px; padding: 10px; break-inside: avoid; }
              .qr-card img { width: 112px; height: 112px; }
              .qr-card h2 { margin: 10px 0 6px; font-size: 18px; }
              .qr-card p { margin: 0 0 6px; font-size: 12px; color: #333; }
              .slug { font-family: monospace; color: #777; word-break: break-all; }
              @media print {
                body { padding: 12mm; }
                .grid { gap: 10px; }
              }
            </style>
          </head>
          <body>
            <header>
              <h1>VowLink Entry QR Sheet</h1>
              <p class="meta">${escapeHtml(user.partner1Name || "Couple")} & ${escapeHtml(user.partner2Name || "Partner")} • ${printableInvitations.length} guest QR codes</p>
            </header>
            <main class="grid">${cards.join("")}</main>
            <script>
              window.onload = () => {
                window.focus();
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("QR sheet opened for printing.");
    } catch {
      printWindow.close();
      toast.error("Unable to prepare QR sheet.");
    } finally {
      setPrintingQrSheet(false);
    }
  };

  const handleDeleteClick = (id) => {
    const invitation = invitations.find((inv) => inv._id === id);
    showConfirmToast({
      toastId: `delete-invitation-${id}`,
      confirmLabel: "Delete",
      message: `Delete ${invitation?.guestName || "this invitation"}? This permanently removes the invitation and linked RSVP responses.`,
      onConfirm: async () => {
        try {
          await api.delete(`/invitations/${id}`);
          setInvitations((prev) => prev.filter((i) => i._id !== id));
          toast.success("Invitation deleted successfully.");
        } catch {
          toast.error("Failed to delete invitation.");
        }
      },
    });
  };

  const handleResetCheckIn = async (invitation) => {
    if (!invitation?.checkedIn || resettingCheckInId) return;
    if (!canUseAdvancedCheckIn) {
      toast.info("Check-in reset controls are a Pro plan feature.");
      navigate("/admin/billing");
      return;
    }

    showConfirmToast({
      title: "Reset guest check-in?",
      message: `${invitation.guestName} will return to the not checked-in list. Use this only for accidental check-ins.`,
      confirmText: "Reset Check-in",
      cancelText: "Cancel",
      onConfirm: async () => {
        setResettingCheckInId(invitation._id);
        try {
          const res = await api.patch(
            `/invitations/${invitation._id}/check-in/reset`,
          );
          const updated = res.data?.invitation;
          if (updated) {
            setInvitations((current) =>
              current.map((item) =>
                item._id === updated._id ? updated : item,
              ),
            );
          } else {
            fetchInvitations();
          }
          toast.success(res.data?.message || "Guest check-in has been reset.");
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Failed to reset check-in.",
          );
        } finally {
          setResettingCheckInId("");
        }
      },
    });
  };

  const handleEdit = (invitation) => {
    navigate(`/admin/invitations/edit/${invitation._id}`, {
      state: { invitation },
    });
  };

  const tier = user.tier || "free";
  const limit = tier === "free" ? 1 : tier === "plus" ? 100 : 500;
  const canUseCheckIn = tier === "plus" || tier === "pro";
  const canUseAdvancedCheckIn = tier === "pro";
  const count = invitations.length;
  const progressPercent = Math.min((count / limit) * 100, 100);
  const checkedInCount = invitations.filter((inv) => inv.checkedIn).length;
  const notCheckedInCount = Math.max(count - checkedInCount, 0);
  const checkInPercent =
    count > 0 ? Math.round((checkedInCount / count) * 100) : 0;

  // Dynamic unique categories from invitations
  const categories = [
    "all",
    ...new Set(
      invitations.map((inv) => inv.category || "Guest").filter(Boolean),
    ),
  ];

  // Check if wedding RSVP deadline has passed
  const isDeadlinePassed =
    user.rsvpDeadline && new Date() > new Date(user.rsvpDeadline);

  const getRsvpBadgeClass = (inv) => {
    if (inv.hasRSVPed)
      return "bg-emerald-400/15 text-emerald-400 border border-emerald-400/10";
    if (isDeadlinePassed)
      return "bg-rose-500/15 text-rose-400 border border-rose-500/10";
    return "bg-[#D8B76A]/15 text-[#D8B76A] border border-[#D8B76A]/10";
  };

  const getRsvpStatusText = (inv) => {
    if (inv.hasRSVPed) return "RSVPed";
    if (isDeadlinePassed) return "No Response";
    return "Pending";
  };

  // Filter & Search Logic
  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch = inv.guestName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || (inv.category || "Guest") === categoryFilter;
    const matchesSenderGroup =
      senderGroupFilter === "all" ||
      (inv.senderGroup || "general") === senderGroupFilter;
    const matchesCheckIn =
      checkInFilter === "all" ||
      (checkInFilter === "checked_in" && inv.checkedIn) ||
      (checkInFilter === "not_checked_in" && !inv.checkedIn);

    const status = inv.hasRSVPed
      ? "rsvped"
      : isDeadlinePassed
        ? "no_response"
        : "pending";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesSenderGroup &&
      matchesCheckIn
    );
  });

  return (
    <div className="p-4 sm:p-8">
      {qrInvitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1220] p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">
                  Check-In QR
                </p>
                <h3 className="mt-2 font-serif text-2xl">
                  {qrInvitation.guestName}
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  {qrInvitation.category || "Guest"} ·{" "}
                  {qrInvitation.allowedGuests || 1} guest
                  {qrInvitation.allowedGuests === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrInvitation(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:text-white"
                aria-label="Close QR modal"
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-80 items-center justify-center rounded-3xl bg-white p-5">
              {qrLoading ? (
                <div className="flex flex-col items-center gap-3 text-[#070A13]/55">
                  <Icon
                    icon="lucide:loader-2"
                    className="h-8 w-8 animate-spin"
                  />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Generating QR
                  </p>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Check-in QR for ${qrInvitation.guestName}`}
                  className="mx-auto h-72 w-72 max-w-full"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center text-[#070A13]/55">
                  <Icon icon="lucide:triangle-alert" className="h-8 w-8" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    QR unavailable
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Check-in link
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-white/65">
                {getCheckInUrl(qrInvitation)}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getCheckInUrl(qrInvitation));
                  toast.success("Check-in link copied.");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/75 transition hover:bg-white/10"
              >
                <Icon icon="lucide:copy" className="h-3.5 w-3.5" />
                Copy Link
              </button>
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={
                  downloadingQr || qrLoading || !qrInvitation.checkInToken
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Icon
                  icon={downloadingQr ? "lucide:loader-2" : "lucide:download"}
                  className={`h-3.5 w-3.5 ${downloadingQr ? "animate-spin" : ""}`}
                />
                {downloadingQr ? "Saving..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">
            Manage
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">
            Invitations
          </h2>
          {/* Progress meter */}
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 w-32 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#D8B76A] transition-all duration-300"
                style={{
                  width: `${limit === Infinity ? 0 : progressPercent}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              {count} / {limit} invitations
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canUseAdvancedCheckIn ? (
            <Link
              to="/check-in/staff"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/65 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
            >
              <Icon icon="lucide:scan-line" className="h-4 w-4" />
              Staff Mode
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                toast.info("Staff check-in mode is available on the Pro plan.");
                navigate("/admin/billing");
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/35 transition whitespace-nowrap ${
                tier === "free"
                  ? "bg-white/5 border border-dashed border-white/15 text-white/30 cursor-not-allowed"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              <Icon icon="lucide:lock" className="h-4 w-4" />
              Staff Mode
            </button>
          )}
          <button
            type="button"
            onClick={handlePrintQrSheet}
            disabled={printingQrSheet || invitations.length === 0}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition disabled:cursor-not-allowed ${
              tier === "free"
                ? "bg-white/5 border border-dashed border-white/15 text-white/30 cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/15"
            } disabled:opacity-50 whitespace-nowrap ${
              canUseAdvancedCheckIn
                ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                : "border border-dashed border-white/15 bg-white/5 text-white/35"
            }`}
          >
            <Icon
              icon={
                printingQrSheet
                  ? "lucide:loader-2"
                  : canUseAdvancedCheckIn
                    ? "lucide:printer"
                    : "lucide:lock"
              }
              className={`h-4 w-4 ${printingQrSheet ? "animate-spin" : ""}`}
            />
            {printingQrSheet ? "Preparing..." : "Print QR Sheet"}
          </button>
          <Link
            to="/admin/invitations/bulk"
            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition duration-300 whitespace-nowrap ${
              tier === "free"
                ? "bg-white/5 border border-dashed border-white/15 text-white/30 cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
            onClick={(e) => {
              if (tier === "free") {
                e.preventDefault();
                toast.info(
                  "Bulk creation is a Plus and Pro plan feature! Upgrade to unlock.",
                );
                navigate("/admin/billing");
              }
            }}
          >
            + Bulk Import
          </Link>
          <Link
            to={count >= limit ? "#" : "/admin/invitations/new"}
            id="new-invitation-btn"
            onClick={(e) => {
              if (count >= limit) {
                e.preventDefault();
                toast.warning(
                  `You have reached the limit of ${limit} invitation${limit === 1 ? "" : "s"} for the ${tier.toUpperCase()} plan. Please upgrade your plan to create more!`,
                  { toastId: "limit-reached-new" },
                );
                navigate("/admin/billing");
              }
            }}
            className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] whitespace-nowrap"
          >
            + New Invitation
          </Link>
        </div>
      </div>

      <div
        className={`mb-6 rounded-3xl border p-5 ${
          canUseCheckIn
            ? "border-emerald-400/15 bg-emerald-400/10"
            : "border-dashed border-white/15 bg-white/5"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                canUseCheckIn
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-[#D8B76A]/25 bg-[#D8B76A]/10 text-[#D8B76A]"
              }`}
            >
              <Icon
                icon={canUseCheckIn ? "lucide:badge-check" : "lucide:lock"}
                className="h-5 w-5"
              />
            </span>
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.25em] ${
                  canUseCheckIn ? "text-emerald-300" : "text-[#D8B76A]"
                }`}
              >
                {canUseCheckIn ? "Check-in Progress" : "Check-in Locked"}
              </p>
              <h3 className="mt-1 font-serif text-2xl text-white">
                {canUseCheckIn
                  ? `${checkedInCount} / ${count} checked in`
                  : "Upgrade to unlock guest entry check-in"}
              </h3>
              <p className="mt-1 text-xs text-white/45">
                {canUseCheckIn
                  ? `${notCheckedInCount} guests still pending entrance check-in.`
                  : "Guest QR codes and event PIN check-in are available from the Plus plan. Staff mode and QR sheets are available on Pro."}
              </p>
            </div>
          </div>
          <div className="min-w-36 text-left sm:text-right">
            {canUseCheckIn ? (
              <>
                <p className="font-mono text-3xl text-emerald-300">
                  {checkInPercent}%
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">
                  complete
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/admin/billing")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#070A13] transition hover:bg-[#F2D894]"
              >
                <Icon icon="lucide:arrow-up-right" className="h-3.5 w-3.5" />
                View Plans
              </button>
            )}
          </div>
        </div>
        {canUseCheckIn && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${checkInPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Settings customization note */}
      <div className="mb-6 rounded-2xl border border-white/5 bg-white/3 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Icon icon="lucide:palette" className="text-lg text-[#D8B76A]" />
          <p className="text-xs text-white/60">
            Want to customize card templates, colors, fonts, music, or couple
            photos? Customize everything on the{" "}
            <Link
              to="/admin/settings?tab=design"
              className="text-[#D8B76A] font-semibold underline hover:text-[#D8B76A]/80 transition"
            >
              Settings page
            </Link>
            .
          </p>
        </div>
        <Link
          to="/admin/settings?tab=design"
          className="rounded-full bg-[#D8B76A]/10 border border-[#D8B76A]/30 px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] hover:bg-[#D8B76A]/20 transition shrink-0 text-center"
        >
          Go to Settings
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#0D1220] p-4 shadow-lg backdrop-blur-md sm:grid-cols-2 xl:grid-cols-5">
        {/* Search Input */}
        <div className="relative">
          <Icon
            icon="lucide:search"
            className="absolute left-3.5 top-3.5 text-white/30 w-3.5 h-3.5"
          />
          <input
            type="text"
            placeholder="Search guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-8 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-white/40 hover:text-white text-base"
            >
              <Icon icon="lucide:x" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none focus:border-[#D8B76A]/60 transition"
          >
            <option value="all">Status: All RSVPs</option>
            <option value="pending">Status: Pending</option>
            <option value="rsvped">Status: RSVPed</option>
            <option value="no_response">
              Status: No Response (Deadline Passed)
            </option>
          </select>
        </div>

        {/* Check-in Filter */}
        <div>
          <select
            value={checkInFilter}
            onChange={(e) => setCheckInFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none focus:border-[#D8B76A]/60 transition"
          >
            <option value="all">Check-in: All</option>
            <option value="checked_in">Check-in: Checked In</option>
            <option value="not_checked_in">Check-in: Not Checked In</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none focus:border-[#D8B76A]/60 transition capitalize"
          >
            <option value="all">Category: All Categories</option>
            {categories
              .filter((cat) => cat !== "all")
              .map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
          </select>
        </div>

        {/* Send Invite By Filter */}
        <div>
          <select
            value={senderGroupFilter}
            onChange={(e) => setSenderGroupFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none focus:border-[#D8B76A]/60 transition"
          >
            <option value="all">Send Invite By: All</option>
            <option value="bride">Send Invite By: Bride</option>
            <option value="groom">Send Invite By: Groom</option>
            <option value="both">Send Invite By: Both</option>
            <option value="general">Send Invite By: General</option>
          </select>
        </div>
      </div>

      {loading ? (
        <>
          {/* Skeleton Desktop Table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 bg-[#0D1220]/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-white/40">
                  <th className="px-5 py-4">Guest</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Guests</th>
                  <th className="px-5 py-4">RSVP</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-white/5 bg-[#0D1220]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3.5 w-10 rounded-full" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-8" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Skeleton Mobile Cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-[#0D1220] p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-40" />
                <div className="flex gap-3 pt-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : invitations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-white/40 text-sm">No invitations yet.</p>
          <Link
            to="/admin/invitations/new"
            className="mt-3 inline-block text-[#D8B76A] text-sm hover:underline"
          >
            <span className="inline-flex items-center gap-1">
              Create your first invitation{" "}
              <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-xs text-white/40 px-1">
            <span>
              Showing {filteredInvitations.length} of {count} guests
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 bg-[#0D1220]/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-white/40">
                  <th className="px-5 py-4">Guest</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Guests</th>
                  <th className="px-5 py-4">RSVP</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-12 text-center text-white/30 text-xs"
                    >
                      No invitations match the active filters or search query.
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv, i) => (
                    <tr
                      key={inv._id}
                      className={`border-b border-white/5 transition hover:bg-white/3 ${i % 2 === 0 ? "bg-[#0D1220]" : "bg-transparent"}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {inv.guestName}
                          </p>
                          {inv.senderGroup && inv.senderGroup !== "general" && (
                            <span
                              className={`text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                                inv.senderGroup === "bride"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : inv.senderGroup === "groom"
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {inv.senderGroup === "bride"
                                ? "Bride"
                                : inv.senderGroup === "groom"
                                  ? "Groom"
                                  : "Both"}
                            </span>
                          )}
                          {inv.checkedIn && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-300">
                              <Icon
                                icon="lucide:badge-check"
                                className="h-3 w-3"
                              />
                              Checked In
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          /invite/{inv.slug}
                        </p>
                        {inv.checkedIn && inv.checkedInAt && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-300/75">
                            <Icon icon="lucide:clock-3" className="h-3 w-3" />
                            {formatCheckInLog(inv)}
                          </p>
                        )}
                        {canUseAdvancedCheckIn &&
                          Array.isArray(inv.checkInHistory) &&
                          inv.checkInHistory.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {inv.checkInHistory
                                .slice(-2)
                                .reverse()
                                .map((entry, index) => (
                                  <p
                                    key={`${entry.at || index}-${entry.action}`}
                                    className="text-[10px] text-white/35"
                                  >
                                    {formatCheckInActivity(entry)}
                                  </p>
                                ))}
                            </div>
                          )}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {inv.category || "Guest"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {inv.allowedGuests}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex min-w-23 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getRsvpBadgeClass(inv)}`}
                        >
                          {getRsvpStatusText(inv)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCopy(inv.slug)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#7FA6D9]/20 bg-[#7FA6D9]/10 text-[#7FA6D9] transition hover:border-[#7FA6D9]/50 hover:bg-[#7FA6D9]/15 hover:text-white"
                            title={
                              copied === inv.slug
                                ? "Copied"
                                : "Copy invite link"
                            }
                            aria-label={
                              copied === inv.slug
                                ? "Copied"
                                : "Copy invite link"
                            }
                          >
                            {copied === inv.slug ? (
                              <Icon icon="lucide:check" className="h-4 w-4" />
                            ) : (
                              <Icon icon="lucide:copy" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (!canUseCheckIn) {
                                toast.info(
                                  "Guest entry QR codes are available on Plus and Pro plans.",
                                );
                                navigate("/admin/billing");
                                return;
                              }
                              setQrInvitation(inv);
                            }}
                            disabled={canUseCheckIn && !inv.checkInToken}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                              canUseCheckIn
                                ? "border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] hover:border-[#D8B76A]/50 hover:bg-[#D8B76A]/15"
                                : "border-white/10 bg-white/5 text-white/35 hover:border-[#D8B76A]/40 hover:text-[#D8B76A]"
                            }`}
                            title={
                              canUseCheckIn
                                ? inv.checkInToken
                                  ? "View check-in QR"
                                  : "Preparing QR token"
                                : "Upgrade to Plus for guest QR"
                            }
                            aria-label={
                              canUseCheckIn
                                ? inv.checkInToken
                                  ? "View check-in QR"
                                  : "Preparing QR token"
                                : "Upgrade to Plus for guest QR"
                            }
                          >
                            <Icon
                              icon={
                                canUseCheckIn ? "lucide:qr-code" : "lucide:lock"
                              }
                              className="h-4 w-4"
                            />
                          </button>
                          {canUseAdvancedCheckIn && inv.checkedIn && (
                            <button
                              onClick={() => handleResetCheckIn(inv)}
                              disabled={resettingCheckInId === inv._id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-200 transition hover:border-amber-300/50 hover:bg-amber-300/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                              title="Reset guest check-in"
                              aria-label="Reset guest check-in"
                            >
                              <Icon
                                icon={
                                  resettingCheckInId === inv._id
                                    ? "lucide:loader-2"
                                    : "lucide:rotate-ccw"
                                }
                                className={`h-4 w-4 ${resettingCheckInId === inv._id ? "animate-spin" : ""}`}
                              />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const url = buildPublicUrl(`/invite/${inv.slug}`);
                              const msgBody =
                                user.customShareMessage &&
                                user.customShareMessage.trim()
                                  ? user.customShareMessage.trim()
                                  : `We are so excited to celebrate our wedding with you. Please view your personal invitation and RSVP here:`;
                              const msg = encodeURIComponent(
                                `Hello ${inv.guestName}! ${msgBody}\n${url}`,
                              );
                              const targetUrl = inv.phoneNumber
                                ? `https://wa.me/${inv.phoneNumber.trim().replace(/\+/g, "")}?text=${msg}`
                                : `https://wa.me/?text=${msg}`;
                              window.open(targetUrl, "_blank");
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#25D366]/20 bg-[#25D366]/10 text-[#25D366] transition hover:border-[#25D366]/50 hover:bg-[#25D366]/15 hover:text-white"
                            title={
                              inv.phoneNumber
                                ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})`
                                : "Share via WhatsApp"
                            }
                            aria-label={
                              inv.phoneNumber
                                ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})`
                                : "Share via WhatsApp"
                            }
                          >
                            <Icon icon="ri:whatsapp-line" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(inv)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                            title="Edit invitation"
                            aria-label="Edit invitation"
                          >
                            <Icon icon="lucide:pencil" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(inv._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/15 bg-red-400/10 text-red-400/80 transition hover:border-red-400/40 hover:bg-red-400/15 hover:text-red-300"
                            title="Delete invitation"
                            aria-label="Delete invitation"
                          >
                            <Icon icon="lucide:trash-2" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filteredInvitations.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-xs bg-[#0D1220] rounded-2xl border border-white/10">
                No invitations match the active filters or search query.
              </div>
            ) : (
              filteredInvitations.map((inv) => (
                <div
                  key={inv._id}
                  className="rounded-2xl border border-white/10 bg-[#0D1220] p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white">
                          {inv.guestName}
                        </p>
                        {inv.senderGroup && inv.senderGroup !== "general" && (
                          <span
                            className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${
                              inv.senderGroup === "bride"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : inv.senderGroup === "groom"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {inv.senderGroup === "bride"
                              ? "Bride"
                              : inv.senderGroup === "groom"
                                ? "Groom"
                                : "Both"}
                          </span>
                        )}
                        {inv.checkedIn && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-300">
                            <Icon
                              icon="lucide:badge-check"
                              className="h-3 w-3"
                            />
                            Checked In
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        {inv.category || "Guest"} · {inv.allowedGuests} guest
                        {inv.allowedGuests !== 1 ? "s" : ""}
                      </p>
                      {inv.checkedIn && inv.checkedInAt && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-300/75">
                          <Icon icon="lucide:clock-3" className="h-3 w-3" />
                          {formatCheckInLog(inv)}
                        </p>
                      )}
                      {canUseAdvancedCheckIn &&
                        Array.isArray(inv.checkInHistory) &&
                        inv.checkInHistory.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {inv.checkInHistory
                              .slice(-2)
                              .reverse()
                              .map((entry, index) => (
                                <p
                                  key={`${entry.at || index}-${entry.action}`}
                                  className="text-[10px] text-white/35"
                                >
                                  {formatCheckInActivity(entry)}
                                </p>
                              ))}
                          </div>
                        )}
                    </div>
                    <span
                      className={`inline-flex min-w-22 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getRsvpBadgeClass(inv)}`}
                    >
                      {getRsvpStatusText(inv)}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mb-3">
                    /invite/{inv.slug}
                  </p>
                  <div className="flex items-center gap-2 border-t border-white/5 pt-3 flex-wrap">
                    <button
                      onClick={() => handleCopy(inv.slug)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#7FA6D9]/20 bg-[#7FA6D9]/10 text-[#7FA6D9] transition hover:text-white"
                      title={
                        copied === inv.slug ? "Copied" : "Copy invite link"
                      }
                      aria-label={
                        copied === inv.slug ? "Copied" : "Copy invite link"
                      }
                    >
                      {copied === inv.slug ? (
                        <Icon icon="lucide:check" className="h-4 w-4" />
                      ) : (
                        <Icon icon="lucide:copy" className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (!canUseCheckIn) {
                          toast.info(
                            "Guest entry QR codes are available on Plus and Pro plans.",
                          );
                          navigate("/admin/billing");
                          return;
                        }
                        setQrInvitation(inv);
                      }}
                      disabled={canUseCheckIn && !inv.checkInToken}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                        canUseCheckIn
                          ? "border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A]"
                          : "border-white/10 bg-white/5 text-white/35 hover:border-[#D8B76A]/40 hover:text-[#D8B76A]"
                      }`}
                      title={
                        canUseCheckIn
                          ? inv.checkInToken
                            ? "View check-in QR"
                            : "Preparing QR token"
                          : "Upgrade to Plus for guest QR"
                      }
                      aria-label={
                        canUseCheckIn
                          ? inv.checkInToken
                            ? "View check-in QR"
                            : "Preparing QR token"
                          : "Upgrade to Plus for guest QR"
                      }
                    >
                      <Icon
                        icon={canUseCheckIn ? "lucide:qr-code" : "lucide:lock"}
                        className="h-4 w-4"
                      />
                    </button>
                    {canUseAdvancedCheckIn && inv.checkedIn && (
                      <button
                        onClick={() => handleResetCheckIn(inv)}
                        disabled={resettingCheckInId === inv._id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-200 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                        title="Reset guest check-in"
                        aria-label="Reset guest check-in"
                      >
                        <Icon
                          icon={
                            resettingCheckInId === inv._id
                              ? "lucide:loader-2"
                              : "lucide:rotate-ccw"
                          }
                          className={`h-4 w-4 ${resettingCheckInId === inv._id ? "animate-spin" : ""}`}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const url = buildPublicUrl(`/invite/${inv.slug}`);
                        const msgBody =
                          user.customShareMessage &&
                          user.customShareMessage.trim()
                            ? user.customShareMessage.trim()
                            : `We are so excited to celebrate our wedding with you. Please view your personal invitation and RSVP here:`;
                        const msg = encodeURIComponent(
                          `Hello ${inv.guestName}! ${msgBody}\n${url}`,
                        );
                        const targetUrl = inv.phoneNumber
                          ? `https://wa.me/${inv.phoneNumber.trim().replace(/\+/g, "")}?text=${msg}`
                          : `https://wa.me/?text=${msg}`;
                        window.open(targetUrl, "_blank");
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#25D366]/20 bg-[#25D366]/10 text-[#25D366] transition hover:text-white"
                      title={
                        inv.phoneNumber
                          ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})`
                          : "Share via WhatsApp"
                      }
                      aria-label={
                        inv.phoneNumber
                          ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})`
                          : "Share via WhatsApp"
                      }
                    >
                      <Icon icon="ri:whatsapp-line" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(inv)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:text-white"
                      title="Edit invitation"
                      aria-label="Edit invitation"
                    >
                      <Icon icon="lucide:pencil" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(inv._id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/15 bg-red-400/10 text-red-400/80 transition hover:text-red-300"
                      title="Delete invitation"
                      aria-label="Delete invitation"
                    >
                      <Icon icon="lucide:trash-2" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminInvitationsPage;
