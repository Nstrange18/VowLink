import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import api from "../utils/api";

const formatDateTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const CheckInPage = () => {
  const { token } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    const loadCheckIn = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invitations/check-in/${token}`);
        setRecord(res.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "This check-in QR code could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    loadCheckIn();
  }, [token]);

  const handleCheckIn = async () => {
    if (!isLoggedIn) {
      toast.info("Please sign in to check in guests.");
      return;
    }

    setCheckingIn(true);
    try {
      const res = await api.post(`/invitations/check-in/${token}`);
      setRecord((prev) => ({
        ...prev,
        checkedIn: true,
        checkedInAt: res.data.invitation?.checkedInAt || new Date().toISOString(),
      }));
      toast.success(res.data.message || "Guest checked in.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to check in this guest.");
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070A13] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-[#0D1220] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">VowLink Check-In</p>
              <h1 className="mt-2 font-serif text-3xl">Guest Entry</h1>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D8B76A]/25 bg-[#D8B76A]/10 text-[#D8B76A]">
              <Icon icon="lucide:qr-code" className="h-6 w-6" />
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-center">
              <Icon icon="lucide:triangle-alert" className="mx-auto h-8 w-8 text-red-300" />
              <p className="mt-3 text-sm text-red-100">{error}</p>
              <Link to="/" className="mt-5 inline-flex rounded-full bg-[#D8B76A] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#070A13]">
                Go Home
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className={`rounded-2xl border p-4 ${record.checkedIn ? "border-emerald-400/25 bg-emerald-400/10" : "border-[#D8B76A]/25 bg-[#D8B76A]/10"}`}>
                <div className="flex items-center gap-3">
                  <Icon icon={record.checkedIn ? "lucide:badge-check" : "lucide:scan-line"} className={`h-6 w-6 ${record.checkedIn ? "text-emerald-200" : "text-[#D8B76A]"}`} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Status</p>
                    <p className="font-semibold">{record.checkedIn ? "Already checked in" : "Ready for check-in"}</p>
                    {record.checkedInAt && <p className="mt-0.5 text-[11px] text-white/55">{formatDateTime(record.checkedInAt)}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#D8B76A]">Guest</p>
                <h2 className="mt-2 font-serif text-3xl">{record.guestName}</h2>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-[#070A13]/70 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/35">Category</p>
                    <p className="mt-1 font-semibold">{record.category || "Guest"}</p>
                  </div>
                  <div className="rounded-xl bg-[#070A13]/70 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/35">Guests Allowed</p>
                    <p className="mt-1 font-semibold">{record.allowedGuests || 1}</p>
                  </div>
                  <div className="rounded-xl bg-[#070A13]/70 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/35">RSVP</p>
                    <p className="mt-1 font-semibold">{record.hasRSVPed ? "Submitted" : "Not submitted"}</p>
                  </div>
                  <div className="rounded-xl bg-[#070A13]/70 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/35">Wedding</p>
                    <p className="mt-1 font-semibold">{record.couple?.partner1Name || "Couple"} & {record.couple?.partner2Name || "Partner"}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckIn}
                disabled={checkingIn || record.checkedIn}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon icon={checkingIn ? "lucide:loader-2" : record.checkedIn ? "lucide:check" : "lucide:badge-check"} className={`h-4 w-4 ${checkingIn ? "animate-spin" : ""}`} />
                {checkingIn ? "Checking In..." : record.checkedIn ? "Checked In" : "Check In Guest"}
              </button>

              {!isLoggedIn && (
                <p className="text-center text-[11px] leading-relaxed text-white/45">
                  Ushers must sign in to mark guests as checked in.{" "}
                  <Link to="/admin/login" className="font-semibold text-[#D8B76A] underline">Sign in</Link>
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default CheckInPage;
