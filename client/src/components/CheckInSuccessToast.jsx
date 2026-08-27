import { Icon } from "@iconify/react";

const CheckInSuccessToast = ({ guest, message = "Guest checked in successfully." }) => {
  const partySize = Number(guest?.partySize || guest?.allowedGuests || 1);
  const tableName = guest?.tableName || "No table assigned";
  const category = guest?.category || "Guest";

  return (
    <div className="min-w-0 pr-2">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
          <Icon icon="lucide:badge-check" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{message}</p>
          <p className="mt-1 truncate text-xs text-white/75">{guest?.guestName || "Guest"}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="font-bold uppercase tracking-wider text-[#D8B76A]">Table</p>
          <p className="mt-0.5 font-semibold text-white">{tableName}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="font-bold uppercase tracking-wider text-[#D8B76A]">Guests</p>
          <p className="mt-0.5 font-semibold text-white">
            {partySize} guest{partySize === 1 ? "" : "s"}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="font-bold uppercase tracking-wider text-[#D8B76A]">Category</p>
          <p className="mt-0.5 font-semibold text-white">{category}</p>
        </div>
      </div>
    </div>
  );
};

export default CheckInSuccessToast;
