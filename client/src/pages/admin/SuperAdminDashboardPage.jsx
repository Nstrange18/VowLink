import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../utils/api";

const getCoupleTierMeta = (tier = "unpaid") => {
  if (tier === "pro") return { label: "Pro", icon: "lucide:crown", className: "border-amber-400/30 bg-amber-400/15 text-amber-200" };
  if (tier === "plus") return { label: "Plus", icon: "lucide:sparkles", className: "border-[#7FA6D9]/30 bg-[#7FA6D9]/15 text-[#B9D4F4]" };
  if (tier === "free") return { label: "Classic", icon: "lucide:badge-check", className: "border-[#D8B76A]/30 bg-[#D8B76A]/15 text-[#F2D894]" };
  return { label: "Trial", icon: "lucide:timer", className: "border-[#7FA6D9]/25 bg-[#7FA6D9]/15 text-[#B9D4F4]" };
};

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [couples, setCouples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [coupleToDelete, setCoupleToDelete] = useState(null);
  const [deletingCouple, setDeletingCouple] = useState(false);

  const setActionBusy = (key, busy) => {
    setActionLoading((prev) => {
      if (busy) return { ...prev, [key]: true };
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/super-admin/couples");
      setCouples(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load admin data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCoupleTier = async (coupleId, tier) => {
    const actionKey = `couple-tier-${coupleId}`;
    if (actionLoading[actionKey]) return;
    setActionBusy(actionKey, true);
    try {
      const res = await api.put(`/super-admin/couples/tier/${coupleId}`, { tier });
      toast.success(res.data.message || "Couple tier updated.");
      setCouples((prev) => prev.map((couple) => (couple._id === coupleId ? { ...couple, tier } : couple)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update couple tier.");
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  const confirmDeleteCouple = async () => {
    if (!coupleToDelete || deletingCouple) return;
    setDeletingCouple(true);
    try {
      await api.delete(`/super-admin/couples/${coupleToDelete}`);
      setCouples((prev) => prev.filter((couple) => couple._id !== coupleToDelete));
      toast.success("Couple account deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete couple account.");
    } finally {
      setDeletingCouple(false);
      setCoupleToDelete(null);
    }
  };

  const stats = {
    total: couples.length,
    trial: couples.filter((c) => (c.tier || "unpaid") === "unpaid").length,
    classic: couples.filter((c) => c.tier === "free").length,
    plus: couples.filter((c) => c.tier === "plus").length,
    pro: couples.filter((c) => c.tier === "pro").length,
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-8 p-4 text-white sm:p-8">
      {coupleToDelete && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deletingCouple && setCoupleToDelete(null)} />
          <div className="relative z-10 w-full max-w-md space-y-5 rounded-3xl border border-red-500/25 bg-[#0D1220] p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <Icon icon="lucide:alert-triangle" className="shrink-0 text-2xl text-red-500" />
              <h2 className="font-serif text-xl text-white">Delete Couple Account?</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              This will permanently delete this couple workspace, invitations, and RSVP records.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCoupleToDelete(null)}
                disabled={deletingCouple}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCouple}
                disabled={deletingCouple}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-400 disabled:opacity-70"
              >
                <Icon icon={deletingCouple ? "lucide:loader-2" : "lucide:trash-2"} className={`h-4 w-4 ${deletingCouple ? "animate-spin" : ""}`} />
                {deletingCouple ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-[#D8B76A]">Operations</span>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl">Super admin</h1>
          <p className="mt-1 text-xs text-white/40">Manage couple plans and monitor launch activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 rounded-full border border-[#D8B76A]/30 bg-[#D8B76A]/10 px-4 py-2.5 text-xs font-semibold tracking-wider text-[#D8B76A] transition hover:bg-[#D8B76A]/20"
          >
            <Icon icon="ph:rings-bold" className="h-4 w-4" /> Couple workspace
          </button>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold tracking-wider transition hover:bg-white/10 disabled:opacity-60"
          >
            <Icon icon="lucide:refresh-cw" className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-5">
        {[
          ["Total", stats.total, "ph:rings-bold", "text-emerald-400"],
          ["Trial", stats.trial, "lucide:timer", "text-[#7FA6D9]"],
          ["Classic", stats.classic, "lucide:badge-check", "text-[#D8B76A]"],
          ["Plus", stats.plus, "lucide:sparkles", "text-[#B9D4F4]"],
          ["Pro", stats.pro, "lucide:crown", "text-amber-300"],
        ].map(([label, value, icon, tone]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-[#0D1220]/60 p-4 backdrop-blur-md sm:p-5">
            <Icon icon={icon} className={`h-6 w-6 ${tone}`} />
            <p className="mt-4 font-mono text-2xl font-bold tracking-tight">{value}</p>
            <h3 className="mt-1 text-[10px] font-medium leading-tight text-white/50 sm:text-xs">{label} accounts</h3>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0D1220]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-serif text-xl text-white">Couple accounts</h2>
          <p className="mt-1 text-xs text-white/40">Review accounts, change plan tiers, or remove test accounts before launch.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-white/50">
                <th className="p-4 font-bold">Couple Names</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Wedding Date</th>
                <th className="p-4 font-bold">Active Tier</th>
                <th className="p-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/30">Loading accounts...</td>
                </tr>
              ) : couples.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/30">No couple workspaces active.</td>
                </tr>
              ) : (
                couples.map((couple) => {
                  const tierBusy = !!actionLoading[`couple-tier-${couple._id}`];
                  const tierMeta = getCoupleTierMeta(couple.tier);

                  return (
                    <tr key={couple._id} className="transition hover:bg-white/2">
                      <td className="p-4 font-serif text-sm font-medium">{couple.partner1Name} & {couple.partner2Name}</td>
                      <td className="p-4 font-mono text-white/70">{couple.email}</td>
                      <td className="p-4 text-white/70">{couple.weddingDate ? new Date(couple.weddingDate).toLocaleDateString() : "Not set"}</td>
                      <td className="p-4">
                        <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tierMeta.className}`}>
                          <Icon icon={tierMeta.icon} className="h-3.5 w-3.5" />
                          {tierMeta.label}
                        </div>
                        <select
                          value={couple.tier || "unpaid"}
                          onChange={(event) => handleUpdateCoupleTier(couple._id, event.target.value)}
                          disabled={tierBusy}
                          className="rounded border border-white/10 bg-[#070A13] px-2 py-1 text-xs font-semibold text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-60"
                        >
                          <option value="unpaid">Trial</option>
                          <option value="free">Classic Plan</option>
                          <option value="plus">Plus Plan</option>
                          <option value="pro">Pro Plan</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setCoupleToDelete(couple._id)}
                          disabled={tierBusy}
                          className="rounded-lg border border-red-500/20 px-2.5 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                        >
                          Delete
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
    </div>
  );
};

export default SuperAdminDashboardPage;
