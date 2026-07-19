import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import PageMiniTour from "../../components/PageMiniTour";
import { showConfirmToast } from "../../utils/toastConfirm";

const SEATING_TOUR_STEPS = [
  {
    target: '[data-tour="seating-header"]',
    title: "Seating chart",
    body: "Create tables and assign attending guests so your reception seating is organized before the event.",
  },
  {
    target: '[data-tour="seating-add-table"]',
    title: "Create tables",
    body: "Add each table with a name, shape, and guest capacity. You can adjust the seating by moving guests later.",
  },
  {
    target: '[data-tour="seating-unassigned"]',
    title: "Guests waiting",
    body: "Only attending RSVP guests appear here. Assign them to tables as your seating plan takes shape.",
  },
  {
    target: '[data-tour="seating-layout"]',
    title: "Table layout",
    body: "Review each table, seat count, assigned guests, and remove guests or tables when needed.",
  },
];

const AdminSeatingPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPro = user.tier === "pro";
  const [tables, setTables] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableName, setTableName] = useState("");
  const [tableShape, setTableShape] = useState("circle");
  const [tableCapacity, setTableCapacity] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [tableToDelete, setTableToDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [tablesRes, rsvpsRes] = await Promise.all([
        api.get("/seating"),
        api.get("/rsvps"),
      ]);
      setTables(tablesRes.data);
      setRsvps(rsvpsRes.data.filter((r) => r.attending === "Yes"));
    } catch (err) {
      toast.error("Failed to load seating chart data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPro) {
      toast.info("Seating chart is available on the Pro plan.", { toastId: "seating-pro-lock" });
      navigate("/admin/billing");
      return;
    }
    fetchData();
  }, [isPro, navigate]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error("Please enter a table name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/seating", {
        name: tableName,
        shape: tableShape,
        capacity: Number(tableCapacity),
        assignedGuests: [],
      });
      setTables((prev) => [...prev, res.data.table]);
      setTableName("");
      toast.success("Table created successfully!");
    } catch (err) {
      toast.error("Failed to create table.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = (tableId) => {
    setTableToDelete(tableId);
  };

  const confirmDeleteTable = async () => {
    if (!tableToDelete) return;
    try {
      await api.delete(`/seating/${tableToDelete}`);
      setTables((prev) => prev.filter((t) => t._id !== tableToDelete));
      if (selectedTableId === tableToDelete) setSelectedTableId(null);
      toast.success("Table deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete table.");
    } finally {
      setTableToDelete(null);
    }
  };

  const assignGuest = async (tableId, guestName) => {
    const table = tables.find((t) => t._id === tableId);
    if (!table) return;

    if (table.assignedGuests.length >= table.capacity) {
      toast.warn("This table has reached its capacity.");
      return;
    }

    if (table.assignedGuests.includes(guestName)) {
      toast.warn("Guest is already seated at this table.");
      return;
    }

    const updatedAssigned = [...table.assignedGuests, guestName];

    try {
      // Optimitic UI update
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, assignedGuests: updatedAssigned } : t))
      );

      await api.put(`/seating/${tableId}`, {
        assignedGuests: updatedAssigned,
      });
    } catch (err) {
      toast.error("Failed to assign guest.");
      // Rollback
      fetchData();
    }
  };

  const unassignGuest = async (tableId, guestName) => {
    const table = tables.find((t) => t._id === tableId);
    if (!table) return;

    const updatedAssigned = table.assignedGuests.filter((g) => g !== guestName);

    try {
      // Optimistic UI update
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, assignedGuests: updatedAssigned } : t))
      );

      await api.put(`/seating/${tableId}`, {
        assignedGuests: updatedAssigned,
      });
    } catch (err) {
      toast.error("Failed to unseat guest.");
      // Rollback
      fetchData();
    }
  };

  const requestUnassignGuest = (tableId, guestName, tableName) => {
    showConfirmToast({
      toastId: `unseat-${tableId}-${guestName}`,
      confirmLabel: "Unseat guest",
      message: `Remove ${guestName} from ${tableName}? They will return to the waiting list.`,
      onConfirm: () => unassignGuest(tableId, guestName),
    });
  };

  // Calculate seated status
  const allAssignedGuests = tables.reduce((acc, t) => [...acc, ...t.assignedGuests], []);
  const unassignedGuests = rsvps.filter((r) => !allAssignedGuests.includes(r.guestName));

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-clip px-4 py-6 text-white sm:px-8 sm:py-8">
      {/* Header */}
      <div data-tour="seating-header" className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Arrangement</p>
        <h2 className="font-serif text-3xl sm:text-4xl">Seating Chart & Tables</h2>
        <p className="text-white/40 text-sm mt-1">
          Create wedding tables, specify capacities, and assign attending guests to their seats.
        </p>
        <PageMiniTour title="Seating tour" storageKey="vowlink-tour-seating" steps={SEATING_TOUR_STEPS} className="mt-4" />
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* LEFT PANEL: Add Table Form & Guest List (Col 4) */}
        <div className="col-span-12 min-w-0 space-y-6 lg:col-span-4">
          {/* Add Table form */}
          <div data-tour="seating-add-table" className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1220] p-4 shadow-lg sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A] mb-4 flex items-center gap-1.5">
              <Icon icon="mdi:table-furniture" className="w-4 h-4 text-[#D8B76A]" /> Add New Table
            </h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5 font-bold">Table Name / Number</label>
                <input
                  type="text"
                  placeholder="e.g. Table 1 / Bridal Party"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 transition"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5 font-bold">Shape</label>
                  <select
                    value={tableShape}
                    onChange={(e) => setTableShape(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-3 py-2.5 text-xs text-white/85 outline-none focus:border-[#D8B76A]/60"
                  >
                    <option value="circle">Circle</option>
                    <option value="rectangle">Rectangle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5 font-bold">Capacity</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:shadow-[0_8px_20px_rgba(216,183,106,0.2)] disabled:opacity-50"
              >
                {submitting ? "Adding..." : "+ Create Table"}
              </button>
            </form>
          </div>

          {/* Guest List Sidebar */}
          <div data-tour="seating-unassigned" className="flex min-w-0 max-h-[500px] flex-col rounded-2xl border border-white/10 bg-[#0D1220] p-4 shadow-lg sm:p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A] flex items-center gap-1.5">
                <Icon icon="lucide:users" className="w-4 h-4 text-[#D8B76A]" /> Guests Waiting to sit
              </h3>
              <p className="text-[10px] text-white/40 mt-1">
                Showing {unassignedGuests.length} unassigned of {rsvps.length} attending guests.
              </p>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3 animate-pulse">
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-white/10 rounded w-1/2" />
                      <div className="h-2.5 bg-white/5 rounded w-1/3" />
                    </div>
                    <div className="h-6 w-16 bg-white/5 rounded-lg" />
                  </div>
                ))
              ) : unassignedGuests.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-white/10 rounded-xl text-white/30 text-xs animate-fade-in">
                  {rsvps.length === 0 ? "No attending RSVPs yet." : "All attending guests are seated!"}
                </div>
              ) : (
                unassignedGuests.map((guest) => (
                  <div
                    key={guest._id}
                    className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white">{guest.guestName}</p>
                      <p className="text-[9px] text-white/40 mt-0.5">Party Size: {guest.numberOfGuests || 1} guest(s)</p>
                    </div>

                    {tables.length > 0 ? (
                      <div className="relative shrink-0">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              assignGuest(e.target.value, guest.guestName);
                              e.target.value = "";
                            }
                          }}
                          className="bg-[#D8B76A] text-[#070A13] font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-[#F2D894] transition"
                        >
                          <option value="">Seat At...</option>
                          {tables.map((t) => (
                            <option key={t._id} value={t._id} disabled={t.assignedGuests.length >= t.capacity}>
                              {t.name} ({t.assignedGuests.length}/{t.capacity})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[9px] uppercase text-white/30">Create a table first</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Seating Layout (Col 8) */}
        <div data-tour="seating-layout" className="col-span-12 min-w-0 lg:col-span-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 space-y-6">
                  {/* Table Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/10 rounded w-1/2" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                    <div className="h-6 w-12 bg-white/5 rounded-full" />
                  </div>
                  {/* Table Graphic/Shape representation */}
                  <div className="flex justify-center py-6">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/10 bg-white/5" />
                  </div>
                  {/* Seat Assignment Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                      <div className="h-3 bg-white/5 rounded w-1/6" />
                    </div>
                    <div className="h-2 bg-white/5 rounded-full w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : tables.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center bg-[#0D1220]/20 flex flex-col items-center">
              <Icon icon="mdi:table-furniture" className="w-12 h-12 text-white/20 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">No Tables Created</h4>
              <p className="text-sm text-white/40 max-w-md mx-auto mb-6">
                Create circular or rectangular tables in the left panel to begin planning the layout.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {tables.map((table) => {
                const isFull = table.assignedGuests.length >= table.capacity;
                return (
                  <div
                    key={table._id}
                    className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] shadow-xl space-y-5 flex flex-col justify-between hover:border-white/20 transition-all"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-white/5 pb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{table.name}</h4>
                        <p className="text-[10px] text-white/40 capitalize mt-0.5">
                          {table.shape} Table · Max {table.capacity} seats
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            isFull
                              ? "bg-red-500/15 text-red-400 border border-red-500/10"
                              : "bg-[#D8B76A]/15 text-[#D8B76A] border border-[#D8B76A]/10"
                          }`}
                        >
                          {table.assignedGuests.length} / {table.capacity} Seated
                        </span>
                        <button
                          onClick={() => handleDeleteTable(table._id)}
                          className="text-white/30 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition hover:bg-white/5 flex items-center justify-center"
                          title="Delete Table"
                        >
                          <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Table Shape Visual representation */}
                    <div className="flex justify-center items-center py-6 relative">
                      {table.shape === "circle" ? (
                        /* Circular Table Layout */
                        <div className="relative h-28 w-28 rounded-full bg-linear-to-b from-[#1C253D] to-[#0D1220] border border-[#D8B76A]/20 flex items-center justify-center shadow-lg">
                          <span className="font-serif text-xs text-[#D8B76A] tracking-wider select-none font-bold uppercase">
                            {table.name}
                          </span>
                          
                          {/* Seat Circles placed mathematically around circle */}
                          {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                            const angle = (seatIdx * 360) / table.capacity;
                            const rad = (angle * Math.PI) / 180;
                            // radius distance
                            const r = 68;
                            const x = Math.round(Math.sin(rad) * r);
                            const y = Math.round(-Math.cos(rad) * r);
                            const guestName = table.assignedGuests[seatIdx];

                            return (
                              <div
                                key={seatIdx}
                                className={`absolute h-7 w-7 rounded-full border flex items-center justify-center text-[8px] cursor-pointer font-bold transition-all shadow-md ${
                                  guestName
                                    ? "bg-[#D8B76A] border-transparent text-[#070A13] hover:bg-[#F2D894]"
                                    : "bg-[#070A13] border-white/20 text-white/40 hover:border-[#D8B76A] hover:text-[#D8B76A]"
                                }`}
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                                onClick={() => {
                                  if (guestName) {
                                    toast.info(`${guestName} is seated at ${table.name}. Use the remove button below to unseat them.`);
                                  } else {
                                    toast.info("Select a guest from the left list to seat them.");
                                  }
                                }}
                                title={guestName ? `Seat ${seatIdx + 1}: ${guestName}` : `Seat ${seatIdx + 1}: Empty`}
                              >
                                {guestName ? guestName.substring(0, 2).toUpperCase() : seatIdx + 1}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Rectangular Table Layout */
                        <div className="relative h-20 w-44 rounded-xl bg-linear-to-b from-[#1C253D] to-[#0D1220] border border-[#D8B76A]/20 flex items-center justify-center shadow-lg">
                          <span className="font-serif text-xs text-[#D8B76A] tracking-wider select-none font-bold uppercase">
                            {table.name}
                          </span>

                          {/* Seat circles aligned to top and bottom sides */}
                          {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                            const half = Math.ceil(table.capacity / 2);
                            const isTop = seatIdx < half;
                            const seatIndexInRow = isTop ? seatIdx : seatIdx - half;
                            const rowCount = isTop ? half : table.capacity - half;
                            const segmentWidth = 144 / (rowCount + 1);
                            const leftOffset = (seatIndexInRow + 1) * segmentWidth - 72; // centered
                            const topOffset = isTop ? -34 : 34;
                            const guestName = table.assignedGuests[seatIdx];

                            return (
                              <div
                                key={seatIdx}
                                className={`absolute h-7 w-7 rounded-full border flex items-center justify-center text-[8px] cursor-pointer font-bold transition-all shadow-md ${
                                  guestName
                                    ? "bg-[#D8B76A] border-transparent text-[#070A13] hover:bg-[#F2D894]"
                                    : "bg-[#070A13] border-white/20 text-white/40 hover:border-[#D8B76A] hover:text-[#D8B76A]"
                                }`}
                                style={{ transform: `translate(${leftOffset}px, ${topOffset}px)` }}
                                onClick={() => {
                                  if (guestName) {
                                    toast.info(`${guestName} is seated at ${table.name}. Use the remove button below to unseat them.`);
                                  } else {
                                    toast.info("Select a guest from the left list to seat them.");
                                  }
                                }}
                                title={guestName ? `Seat ${seatIdx + 1}: ${guestName}` : `Seat ${seatIdx + 1}: Empty`}
                              >
                                {guestName ? guestName.substring(0, 2).toUpperCase() : seatIdx + 1}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Assigned Guest List details */}
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[10px] uppercase tracking-wider text-white/50 mb-2 font-bold">Seated Guests</p>
                      {table.assignedGuests.length === 0 ? (
                        <p className="text-xs text-white/30 italic">No guests seated at this table.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {table.assignedGuests.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-white/80 transition"
                              title={`${name} is seated at ${table.name}`}
                            >
                              <span>{name}</span>
                              <button
                                type="button"
                                onClick={() => requestUnassignGuest(table._id, name, table.name)}
                                className="rounded-full p-0.5 text-white/45 transition hover:bg-red-500/15 hover:text-red-400"
                                title={`Remove ${name} from ${table.name}`}
                                aria-label={`Remove ${name} from ${table.name}`}
                              >
                                <Icon icon="lucide:x" className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* ── Table Deletion Confirmation Modal ── */}
      {tableToDelete && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs animate-fade-in" onClick={() => setTableToDelete(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-red-500/20 bg-[#0D1220] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <Icon icon="lucide:trash-2" className="text-xl text-red-500 shrink-0" />
              <h2 className="font-serif text-lg text-white">Delete Table?</h2>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Are you sure you want to delete this table? All assigned guests will be unseated and returned to the waiting list.
            </p>
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTable}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-400 transition cursor-pointer shadow-lg shadow-red-500/25"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSeatingPage;
