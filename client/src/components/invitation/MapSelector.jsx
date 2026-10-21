import { Icon } from "@iconify/react";

const MapSelector = ({ mapSelectAddress, setMapSelectAddress }) => {
  const isObj =
    typeof mapSelectAddress === "object" && mapSelectAddress !== null;
  const displayLabel = isObj
    ? mapSelectAddress.label
    : mapSelectAddress;
  const mapsQuery = isObj ? mapSelectAddress.query : mapSelectAddress;
  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-[#D8B76A]/30 bg-[#0D1220] p-6 shadow-2xl space-y-6 text-center">
        <div>
          <Icon
            icon="mdi:compass-outline"
            className="mx-auto h-8 w-8 text-[#D8B76A]"
          />
          <h3 className="font-serif text-xl text-white mt-2">
            Open in Maps
          </h3>
          <p className="text-white/40 text-xs mt-1 leading-relaxed max-w-xs mx-auto">
            Choose your preferred navigation app to open routes for:
            <br />
            <span className="text-white/80 font-medium block mt-1 wrap-break-word">
              {displayLabel}
            </span>
            {isObj && displayLabel !== mapsQuery && (
              <span className="text-white/45 text-[10px] block mt-0.5 wrap-break-word italic">
                {mapsQuery}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-3">
          {/* Google Maps */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMapSelectAddress(null)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:google-maps" className="h-4 w-4" /> Google
            Maps
          </a>

          {/* Apple Maps */}
          <a
            href={`https://maps.apple.com/?q=${encodeURIComponent(mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMapSelectAddress(null)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:apple" className="h-4 w-4" /> Apple Maps
          </a>

          {/* Waze */}
          <a
            href={`https://waze.com/ul?q=${encodeURIComponent(mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMapSelectAddress(null)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:car" className="h-4 w-4" /> Waze
          </a>
        </div>

        <button
          onClick={() => setMapSelectAddress(null)}
          className="w-full text-xs font-bold uppercase tracking-widest text-[#D8B76A] hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MapSelector;
