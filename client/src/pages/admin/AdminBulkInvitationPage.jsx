import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";

// Robust CSV parser supporting quotes and escaped quotes
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip the escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

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

  // Re-parse input text whenever text, default message or default greeting changes
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedGuests([]);
      return;
    }

    const lines = inputText.split(/\r?\n/);
    if (lines.length === 0) {
      setParsedGuests([]);
      return;
    }

    // Check if the first line is a header row
    const firstLineParts = parseCSVLine(lines[0]);
    const hasHeader = firstLineParts.some(part => 
      /guest\s*name|category|allowed\s*guests|seats|greeting|message|salutation/i.test(part)
    );
    
    const linesToParse = hasHeader ? lines.slice(1) : lines;

    const guestsList = linesToParse
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const parts = parseCSVLine(trimmed);
        if (parts.length >= 1) {
          const guestName = parts[0].replace(/^"|"$/g, '').trim();
          if (!guestName) return null;
          
          const category = (parts[1] || "").replace(/^"|"$/g, '').trim() || "Guest";
          const allowedGuests = parseInt((parts[2] || "").trim()) || 1;
          const customGreeting = (parts[3] || "").replace(/^"|"$/g, '').trim();
          const customMessage = (parts[4] || "").replace(/^"|"$/g, '').trim();
          
          const greeting = customGreeting || defaultGreeting.replace("{name}", guestName);
          const actualMessage = customMessage || defaultMessage;

          const guestObj = { 
            guestName, 
            category, 
            allowedGuests, 
            greeting,
            customMessage: actualMessage
          };
          
          return guestObj;
        }
        return null;
      })
      .filter(Boolean);

    setParsedGuests(guestsList);
  }, [inputText, defaultGreeting, defaultMessage]);

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
      '"Chidera Okonkwo",Friend,2,"Dear Chidera,","Can\'t wait to dance on our wedding night!"',
      '"Engr. Tunde & Family",Family,5,"Dear Uncle Tunde & Family,","We hope to see the whole family there!"',
      '"Senator Marcus",VIP,1,"Dear Senator Marcus,","We would be highly honored by your presence."',
      '"Adama Traore",Colleague,1,"Dear Adama,","Looking forward to celebrating together!"',
      '"Kemi Nelson",Friend,2,"Dear Kemi,","Join us for the best night of our lives!"',
    ];
    setInputText(samples.join("\n"));
  };

  const downloadTemplate = () => {
    const headers = "Guest Name,Category,Allowed Guests,Personalized Greeting,Personalized Custom Message\n";
    const rows = [
      '"Chidera Okonkwo",Friend,2,"Dear Chidera,","Can\'t wait to dance on our wedding night!"',
      '"Engr. Tunde & Family",Family,5,"Dear Uncle Tunde & Family,","We hope to see the whole family there!"',
      '"Senator Marcus",VIP,1,"Dear Senator Marcus,","We would be highly honored by your presence."',
      '"Adama Traore",Colleague,1,"Dear Adama,","Looking forward to celebrating together!"',
      '"Kemi Nelson",Friend,2,"Dear Kemi,","Join us for the best night of our lives!"'
    ].join("\n");
    
    // Prefix with UTF-8 BOM so Excel auto-detects commas and accents correctly
    const csvContent = "\uFEFF" + headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "vowlink_guest_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel-compatible CSV template downloaded! 📋");
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
      toast.success(`✓ ${file.name} loaded — ${text.trim().split(/\r?\n/).filter(Boolean).length} rows detected.`);
    };
    reader.onerror = () => toast.error("Failed to read the file.");
    reader.readAsText(file);
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto text-white">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Tools</p>
        <h2 className="font-serif text-3xl sm:text-4xl">Bulk Invitation Import</h2>
        <p className="text-white/40 text-sm mt-1">
          Paste a list of names or upload an Excel/CSV spreadsheet to generate guest invitation links instantly.
        </p>
      </div>

      {/* Spreadsheet Instructions Banner */}
      <div className="mb-6 p-5 rounded-2xl border border-white/10 bg-[#0D1220]/60 text-xs text-white/80 space-y-4 leading-relaxed animate-fade-in backdrop-blur-md">
        <h3 className="font-serif text-sm text-[#D8B76A] font-semibold flex items-center gap-1.5">
          <span>📊</span> How to prepare your spreadsheet
        </h3>
        <p className="text-white/60">
          You can format your guest list in Microsoft Excel, Google Sheets, or any spreadsheet tool. Set up your table with the following 5 columns in order:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-black/20 p-4 rounded-xl border border-white/5 font-sans">
          <div>
            <strong className="text-white block text-[11px]">1. Guest Name <span className="text-red-400 font-normal">(Req)</span></strong>
            <span className="text-white/40 text-[9px] block mt-0.5">The name shown on the invite card. (e.g. "Mr. & Mrs. Adebayo")</span>
          </div>
          <div>
            <strong className="text-white block text-[11px]">2. Category <span className="text-white/40 font-normal">(Opt)</span></strong>
            <span className="text-white/40 text-[9px] block mt-0.5">Grouping for sorting. Defaults to "Guest". (e.g. "Family")</span>
          </div>
          <div>
            <strong className="text-white block text-[11px]">3. Seats <span className="text-white/40 font-normal">(Opt)</span></strong>
            <span className="text-white/40 text-[9px] block mt-0.5">Allowed seat count. Defaults to 1. (e.g. "2")</span>
          </div>
          <div>
            <strong className="text-white block text-[11px]">4. Greeting <span className="text-white/40 font-normal">(Opt)</span></strong>
            <span className="text-white/40 text-[9px] block mt-0.5">Custom salutation override. (e.g. "Dear Ade & Kemi,")</span>
          </div>
          <div>
            <strong className="text-white block text-[11px]">5. Custom Msg <span className="text-white/40 font-normal">(Opt)</span></strong>
            <span className="text-white/40 text-[9px] block mt-0.5">Specific invite card note. (Max 70 chars)</span>
          </div>
        </div>
        <p className="text-[10px] text-white/40 font-normal">
          💡 Tip: Click the <strong>Download Template</strong> button below to get a pre-formatted Excel-compatible CSV file. Save your file as <strong>CSV (Comma delimited, .csv)</strong> when editing in Excel. If names or messages contain commas, Excel will automatically wrap them in double quotes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-7 space-y-5 rounded-2xl border border-white/10 bg-[#0D1220] p-5 sm:p-6">
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
                onClick={downloadTemplate}
                className="text-[10px] uppercase font-semibold text-[#3EC58E] hover:underline flex items-center gap-1"
              >
                📥 Download Template
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
            placeholder={`Format: Guest Name, Category, Seats, Greeting, CustomMessage
Example:
"Chidera Okonkwo", Friend, 2, "Dear Chidera,", "Can't wait to dance!"
"Uncle Tunde & Family", Family, 5, "Dear Uncle Tunde & Family,", "We hope to see you all!"`}
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
        <div className="lg:col-span-5 space-y-4">
          <label className="block text-xs uppercase tracking-widest text-[#D8B76A]">Import Preview ({parsedGuests.length})</label>
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/3 max-h-120 overflow-y-auto">
            {parsedGuests.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-xs">
                Enter names in the list or upload a CSV file to view real-time import parsing preview here.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3 font-semibold">Guest Name</th>
                    <th className="px-4 py-3 font-semibold">Cat. / Seats</th>
                    <th className="px-4 py-3 font-semibold">Salutation & Message</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedGuests.map((guest, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3 font-medium text-white max-w-[120px] truncate">
                        {guest.guestName}
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full block w-fit mb-1">{guest.category}</span>
                        <span className="text-[10px] text-[#D8B76A] block">Seats: {guest.allowedGuests}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#D8B76A]/80 font-serif italic text-[11px] leading-tight mb-1">{guest.greeting}</div>
                        <div className="text-white/40 text-[10px] leading-tight line-clamp-2">{guest.customMessage}</div>
                      </td>
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
