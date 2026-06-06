import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";

const AdminBulkInvitationPage = () => {
  const navigate = useNavigate();
  const csvInputRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [defaultGreeting, setDefaultGreeting] = useState("Dear {name},");
  const [defaultMessage, setDefaultMessage] = useState(
    "As we prepare to begin this beautiful new chapter of our lives, it would mean so much to have you there to celebrate with us."
  );
  const [parsedGuests, setParsedGuests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));

  useEffect(() => {
    if (user.tier === "free") {
      toast.info("Bulk creation is a Plus and Pro plan feature! Redirecting...");
      navigate("/admin/billing");
    }
  }, [user, navigate]);

  // Re-parse input text whenever text or default greeting changes
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedGuests([]);
      return;
    }

    const lines = inputText.split("\n");
    const guestsList = lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Try comma parsing first
        const parts = trimmed.split(",");
        if (parts.length >= 2) {
          const guestName = parts[0].trim();
          const category = parts[1].trim() || "Guest";
          const allowedGuests = parseInt(parts[2]?.trim()) || 1;
          const greeting = defaultGreeting.replace("{name}", guestName);

          return { guestName, category, allowedGuests, greeting };
        } else {
          // Fallback to name only
          const guestName = trimmed;
          const greeting = defaultGreeting.replace("{name}", guestName);
          return { guestName, category: "Guest", allowedGuests: 1, greeting };
        }
      })
      .filter(Boolean);

    setParsedGuests(guestsList);
  }, [inputText, defaultGreeting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedGuests.length === 0) {
      toast.warning("Please enter at least one guest name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/invitations/bulk", {
        guests: parsedGuests,
        defaultGreeting,
        defaultCustomMessage: defaultMessage,
      });

      toast.success(res.data.message || `Successfully imported ${res.data.count} guests!`);
      navigate("/admin/invitations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk import failed. Please verify details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSampleData = () => {
    const samples = [
      "Chidera Okonkwo, Friend, 2",
      "Engr. Tunde & Family, Family, 5",
      "Senator Marcus, VIP, 1",
      "Adama Traore, Colleague, 1",
      "Kemi Nelson, Friend, 2",
    ];
    setInputText(samples.join("\n"));
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Please upload a .csv or .txt file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setInputText(text.trim());
      toast.success(`✓ ${file.name} loaded — ${text.trim().split("\n").filter(Boolean).length} rows detected.`);
    };
    reader.onerror = () => toast.error("Failed to read the file.");
    reader.readAsText(file);
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto text-white">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Tools</p>
        <h2 className="font-serif text-3xl sm:text-4xl">Bulk Invitation Import</h2>
        <p className="text-white/40 text-sm mt-1">
          Paste a list of names or CSV formatted details to generate up to 100 links instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Inputs Panel */}
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0D1220] p-5 sm:p-6">
          <div className="flex justify-between items-center">
            <label className="block text-xs uppercase tracking-widest text-[#D8B76A]">Guest List Input</label>
            <div className="flex items-center gap-3">
              {/* Hidden CSV file input */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="text-[10px] uppercase font-semibold text-[#7FA6D9] hover:underline flex items-center gap-1"
              >
                📂 Upload CSV
              </button>
              <button
                type="button"
                onClick={loadSampleData}
                className="text-[10px] uppercase font-semibold text-[#D8B76A] hover:underline"
              >
                ⚡ Load Sample
              </button>
            </div>
          </div>

          <textarea
            rows={10}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-white/20 outline-none focus:border-[#D8B76A]/60 font-mono resize-y"
            placeholder="Format: Guest Name, Category, AllowedGuests&#10;Example:&#10;Precious Friends, Friend, 2&#10;Uncle Dave, Family, 4&#10;Engr. John, VIP, 1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="space-y-4 pt-2 border-t border-white/5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Default Greeting template</label>
              <input
                required
                type="text"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#D8B76A]/60 outline-none"
                value={defaultGreeting}
                onChange={(e) => setDefaultGreeting(e.target.value)}
              />
              <p className="mt-1 text-[10px] text-white/30 font-mono">Note: {'{name}'} is replaced with guest name.</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Default custom message</label>
              <textarea
                required
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#D8B76A]/60 outline-none resize-none"
                value={defaultMessage}
                onChange={(e) => setDefaultMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={isSubmitting || parsedGuests.length === 0}
              className="flex-1 rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSubmitting ? "Importing Guests..." : `Import ${parsedGuests.length} Guests`}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/invitations")}
              className="rounded-full border border-white/10 px-6 py-3 text-xs text-white/60 hover:text-white hover:border-white/20 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="space-y-4">
          <label className="block text-xs uppercase tracking-widest text-[#D8B76A]">Import Preview ({parsedGuests.length})</label>
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/3 max-h-120 overflow-y-auto">
            {parsedGuests.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-xs">
                Enter names in the list to view real-time import parsing preview here.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3 font-semibold">Guest Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Guests</th>
                    <th className="px-4 py-3 font-semibold">Salutation</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedGuests.map((guest, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3 font-medium text-white">{guest.guestName}</td>
                      <td className="px-4 py-3 text-white/50">{guest.category}</td>
                      <td className="px-4 py-3 text-white/50">{guest.allowedGuests}</td>
                      <td className="px-4 py-3 text-[#D8B76A]/80 font-serif italic">{guest.greeting}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminBulkInvitationPage;
