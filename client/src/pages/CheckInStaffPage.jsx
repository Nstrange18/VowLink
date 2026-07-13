import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import api from "../utils/api";

const getAccessKey = (eventId) => `vowlink_checkin_access_${eventId}`;

const extractCheckInToken = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/\/check-in\/([^/?#]+)/);
  return match?.[1] || trimmed;
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const CheckInStaffPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEventId = searchParams.get("event") || "";
  const [eventId, setEventId] = useState(initialEventId);
  const [accessToken, setAccessToken] = useState(() => (initialEventId ? sessionStorage.getItem(getAccessKey(initialEventId)) || "" : ""));
  const [unlockLink, setUnlockLink] = useState("");
  const [pin, setPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("not_checked_in");
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStarting, setScannerStarting] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const [scanChecking, setScanChecking] = useState(false);
  const videoRef = useRef(null);
  const scanStreamRef = useRef(null);
  const scanFrameRef = useRef(null);
  const scannerActiveRef = useRef(false);
  const lastScanRef = useRef({ token: "", at: 0 });

  const isUnlocked = Boolean(eventId && accessToken);

  const searchGuests = useCallback(async () => {
    if (!eventId || !accessToken) return;
    setLoading(true);
    try {
      const res = await api.post("/invitations/check-in/staff/search", {
        eventId,
        accessToken,
        query,
        status,
      });
      setGuests(res.data?.invitations || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to search guests.");
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, eventId, query, status]);

  useEffect(() => {
    if (isUnlocked) searchGuests();
  }, [isUnlocked, searchGuests]);

  const stopScanner = useCallback(() => {
    scannerActiveRef.current = false;
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach((track) => track.stop());
      scanStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerOpen(false);
    setScannerStarting(false);
  }, []);

  useEffect(() => () => stopScanner(), [stopScanner]);

  const handleUnlock = async () => {
    const token = extractCheckInToken(unlockLink);
    const normalizedPin = pin.trim();

    if (!token) {
      toast.info("Paste a guest check-in link or token first.");
      return;
    }
    if (!/^\d{4,8}$/.test(normalizedPin)) {
      toast.info("Enter the 4 to 8 digit event PIN.");
      return;
    }

    setUnlocking(true);
    try {
      const preview = await api.get(`/invitations/check-in/${token}`);
      const nextEventId = preview.data?.eventId;
      if (!nextEventId) throw new Error("Missing event ID");

      const accessRes = await api.post(`/invitations/check-in/${token}/access`, { pin: normalizedPin });
      const nextAccessToken = accessRes.data?.accessToken;
      if (!nextAccessToken) throw new Error("Missing access token");

      sessionStorage.setItem(getAccessKey(nextEventId), nextAccessToken);
      setEventId(nextEventId);
      setAccessToken(nextAccessToken);
      setSearchParams({ event: nextEventId });
      setUnlockLink("");
      setPin("");
      toast.success("Staff check-in mode unlocked for this wedding.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to unlock staff mode.");
    } finally {
      setUnlocking(false);
    }
  };

  const handleCheckIn = async (guest) => {
    if (!accessToken) return;
    setCheckingId(guest._id);
    try {
      const res = await api.post(`/invitations/check-in/staff/${guest._id}`, { accessToken });
      const updated = res.data?.invitation || { ...guest, checkedIn: true, checkedInAt: new Date().toISOString(), checkedInVia: "pin" };
      setGuests((current) => current.map((item) => (item._id === guest._id ? updated : item)));
      toast.success(res.data?.message || "Guest checked in.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to check in guest.");
    } finally {
      setCheckingId("");
    }
  };

  const handleScannedToken = useCallback(async (token) => {
    if (!token || !accessToken || scanChecking) return;

    const now = Date.now();
    if (lastScanRef.current.token === token && now - lastScanRef.current.at < 2500) return;
    lastScanRef.current = { token, at: now };

    setScanChecking(true);
    setScannerMessage("Checking guest...");
    try {
      const res = await api.post(`/invitations/check-in/${token}`, { accessToken });
      const updated = res.data?.invitation;
      if (updated?._id) {
        setGuests((current) => {
          const exists = current.some((item) => item._id === updated._id);
          if (!exists) return current;
          return current.map((item) => (item._id === updated._id ? updated : item));
        });
      }
      toast.success(res.data?.message || "Guest checked in.");
      setScannerMessage(updated?.guestName ? `${updated.guestName} checked in.` : "Guest checked in. Scan the next QR.");
      searchGuests();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to check in this QR code.";
      toast.error(message);
      setScannerMessage(message);
    } finally {
      setScanChecking(false);
    }
  }, [accessToken, scanChecking, searchGuests]);

  const startScanner = async () => {
    if (!accessToken) return;

    if (!window.BarcodeDetector) {
      setScannerOpen(true);
      setScannerMessage("This browser does not support in-app QR scanning. Use the phone camera once, or paste the check-in link/token.");
      toast.info("In-app scanning is not supported on this browser.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerOpen(true);
      setScannerMessage("Camera access is not available in this browser.");
      toast.info("Camera access is not available in this browser.");
      return;
    }

    setScannerOpen(true);
    setScannerStarting(true);
    setScannerMessage("Starting camera...");

    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      scanStreamRef.current = stream;
      scannerActiveRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScannerStarting(false);
      setScannerMessage("Point the camera at the next guest QR code.");

      const scanLoop = async () => {
        if (!scannerActiveRef.current) return;
        const video = videoRef.current;

        if (video?.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            const rawValue = codes?.[0]?.rawValue;
            const token = extractCheckInToken(rawValue);
            if (token) {
              await handleScannedToken(token);
            }
          } catch {
            setScannerMessage("Scanning paused. Keep the QR code steady in the frame.");
          }
        }

        scanFrameRef.current = requestAnimationFrame(scanLoop);
      };

      scanFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      stopScanner();
      const message = err?.name === "NotAllowedError"
        ? "Camera permission was denied. Allow camera access to scan QR codes inside VowLink."
        : "Unable to start the camera scanner.";
      toast.error(message);
    }
  };

  const summary = useMemo(() => {
    const checked = guests.filter((guest) => guest.checkedIn).length;
    return { checked, total: guests.length };
  }, [guests]);

  return (
    <main className="min-h-screen bg-[#070A13] px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#D8B76A]">VowLink Staff Mode</p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Entrance Check-in</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              Search guests by name, phone, invite slug, or category after unlocking this device with the event PIN.
            </p>
          </div>
          <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/65 transition hover:bg-white/10 hover:text-white">
            <Icon icon="lucide:home" className="h-4 w-4" />
            Home
          </Link>
        </div>

        {!isUnlocked ? (
          <section className="rounded-3xl border border-[#D8B76A]/20 bg-[#0D1220] p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D8B76A]/25 bg-[#D8B76A]/10 text-[#D8B76A]">
                <Icon icon="lucide:key-round" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl">Unlock Staff Check-in</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Paste any guest check-in QR link for this wedding, then enter the event PIN from the couple.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <input
                value={unlockLink}
                onChange={(event) => setUnlockLink(event.target.value)}
                placeholder="Paste /check-in/... link or token"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D8B76A]/60"
              />
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="PIN"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-white outline-none transition placeholder:text-xs placeholder:tracking-wider placeholder:text-white/25 focus:border-[#D8B76A]/60"
              />
            </div>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={unlocking}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Icon icon={unlocking ? "lucide:loader-2" : "lucide:unlock"} className={`h-4 w-4 ${unlocking ? "animate-spin" : ""}`} />
              {unlocking ? "Unlocking..." : "Unlock Staff Mode"}
            </button>
          </section>
        ) : (
          <>
            <section className="mb-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">Access Active</p>
                  <h2 className="mt-1 font-serif text-2xl">{summary.checked} / {summary.total} shown guests checked in</h2>
                  <p className="mt-1 text-xs text-white/45">This device can check in guests for this wedding until the temporary session expires.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={scannerOpen ? stopScanner : startScanner}
                    disabled={scannerStarting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Icon icon={scannerStarting ? "lucide:loader-2" : scannerOpen ? "lucide:x" : "lucide:scan-qr-code"} className={`h-3.5 w-3.5 ${scannerStarting ? "animate-spin" : ""}`} />
                    {scannerStarting ? "Starting..." : scannerOpen ? "Close Scanner" : "Scan Next QR"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopScanner();
                      sessionStorage.removeItem(getAccessKey(eventId));
                      setAccessToken("");
                      setGuests([]);
                      toast.info("Staff mode locked on this device.");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/70 transition hover:bg-white/10"
                  >
                    <Icon icon="lucide:lock" className="h-3.5 w-3.5" />
                    Lock Device
                  </button>
                </div>
              </div>
            </section>

            {scannerOpen && (
              <section className="mb-5 rounded-3xl border border-[#D8B76A]/20 bg-[#0D1220] p-4 shadow-2xl sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">QR Scanner</p>
                    <p className="mt-1 text-xs text-white/45">{scannerMessage}</p>
                  </div>
                  {scanChecking && <Icon icon="lucide:loader-2" className="h-5 w-5 animate-spin text-[#D8B76A]" />}
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="aspect-3/4 w-full object-cover sm:aspect-video"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 rounded-3xl border-2 border-[#D8B76A] shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                  The scanner only works for this unlocked wedding. If camera scanning is unavailable, paste a guest check-in link/token in the search unlock flow or use manual guest search.
                </p>
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-[#0D1220] p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px]">
                <div className="relative">
                  <Icon icon="lucide:search" className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") searchGuests();
                    }}
                    placeholder="Search guest, phone, category..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D8B76A]/60"
                  />
                </div>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#0D1220] px-4 py-3 text-sm text-white/80 outline-none transition focus:border-[#D8B76A]/60"
                >
                  <option value="not_checked_in">Not checked in</option>
                  <option value="checked_in">Checked in</option>
                  <option value="all">All guests</option>
                </select>
                <button
                  type="button"
                  onClick={searchGuests}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D8B76A] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894] disabled:opacity-60"
                >
                  <Icon icon={loading ? "lucide:loader-2" : "lucide:search"} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Search
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-xs uppercase tracking-widest text-white/35">Loading guests...</div>
                ) : guests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">No guests match this search.</div>
                ) : (
                  guests.map((guest) => (
                    <article key={guest._id} className="rounded-2xl border border-white/10 bg-[#070A13]/70 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-2xl">{guest.guestName}</h3>
                            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${guest.checkedIn ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-[#D8B76A]/25 bg-[#D8B76A]/10 text-[#D8B76A]"}`}>
                              {guest.checkedIn ? "Checked In" : "Pending"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-white/45">
                            {guest.category || "Guest"} · {guest.allowedGuests || 1} guest{guest.allowedGuests === 1 ? "" : "s"} · /invite/{guest.slug}
                          </p>
                          {guest.checkedInAt && (
                            <p className="mt-1 text-[11px] text-emerald-300/75">Checked in {formatDateTime(guest.checkedInAt)} via {guest.checkedInVia || "check-in"}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCheckIn(guest)}
                          disabled={checkingId === guest._id || guest.checkedIn}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          <Icon icon={checkingId === guest._id ? "lucide:loader-2" : guest.checkedIn ? "lucide:check" : "lucide:badge-check"} className={`h-4 w-4 ${checkingId === guest._id ? "animate-spin" : ""}`} />
                          {checkingId === guest._id ? "Checking..." : guest.checkedIn ? "Done" : "Check In"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default CheckInStaffPage;
