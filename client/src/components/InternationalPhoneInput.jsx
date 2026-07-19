import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  getLocalPhonePart,
  getPhoneCountryByIso,
  getPhoneCountryFromNumber,
  normalizeInternationalPhone,
} from "../utils/phoneNumbers";

const InternationalPhoneInput = ({
  id,
  value,
  onChange,
  error,
  defaultCountryIso = DEFAULT_PHONE_COUNTRY.iso,
  placeholder = "8031234567",
}) => {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(() => getPhoneCountryFromNumber(value, defaultCountryIso));
  const [localValue, setLocalValue] = useState(() =>
    getLocalPhonePart(value, getPhoneCountryFromNumber(value, defaultCountryIso))
  );

  useEffect(() => {
    setCountry((currentCountry) =>
      getPhoneCountryFromNumber(value, currentCountry.iso || defaultCountryIso)
    );
  }, [value, defaultCountryIso]);

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    const nextCountry = getPhoneCountryFromNumber(value, country.iso || defaultCountryIso);
    setLocalValue(getLocalPhonePart(value, nextCountry));
  }, [value, country.iso, defaultCountryIso]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return PHONE_COUNTRIES;

    return PHONE_COUNTRIES.filter((item) =>
      item.name.toLowerCase().includes(term) ||
      item.iso.toLowerCase().includes(term) ||
      item.dialCode.includes(term.replace(/^\+/, ""))
    );
  }, [query]);

  const selectCountry = (nextIso) => {
    const nextCountry = getPhoneCountryByIso(nextIso);
    setCountry(nextCountry);
    onChange(normalizeInternationalPhone(localValue, nextCountry));
    setIsOpen(false);
    setQuery("");
  };

  const handleLocalChange = (event) => {
    const nextLocalValue = event.target.value.replace(/[^\d\s()+-]/g, "");
    setLocalValue(nextLocalValue);
    onChange(normalizeInternationalPhone(nextLocalValue, country));
  };

  const borderClass = error
    ? "border-red-400/50 focus-within:border-red-400/70"
    : "border-white/10 focus-within:border-[#D8B76A]/60 focus-within:ring-1 focus-within:ring-[#D8B76A]/30";

  return (
    <div ref={wrapperRef} className="international-phone-input relative">
      <div className={`international-phone-shell flex w-full rounded-xl border bg-white/5 text-sm text-white transition ${borderClass}`}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="international-phone-country flex min-w-32 items-center justify-between gap-2 rounded-l-xl border-r border-white/10 px-3 py-3 text-left text-white/80 transition hover:bg-white/5 focus:outline-none"
          aria-label="Select country code"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="international-phone-iso text-[10px] font-bold uppercase tracking-wider text-white/60">{country.iso}</span>
            <span className="international-phone-code font-semibold">+{country.dialCode}</span>
          </span>
          <Icon icon="lucide:chevron-down" className="international-phone-icon h-4 w-4 shrink-0 text-white/50" />
        </button>

        <input
          ref={inputRef}
          id={id}
          inputMode="tel"
          autoComplete="tel-national"
          value={localValue}
          onChange={handleLocalChange}
          placeholder={placeholder}
          className="international-phone-number min-w-0 flex-1 rounded-r-xl bg-transparent px-4 py-3 text-white placeholder-white/30 outline-none"
        />
      </div>

      {isOpen && (
        <div className="international-phone-menu absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#080C16] shadow-2xl">
          <div className="border-b border-white/10 p-2">
            <div className="international-phone-search flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <Icon icon="lucide:search" className="international-phone-search-icon h-4 w-4 text-white/50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="Search country or code"
                className="international-phone-search-input w-full bg-transparent text-xs text-white outline-none placeholder-white/30"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((item) => (
                <button
                  key={item.iso}
                  type="button"
                  onClick={() => selectCountry(item.iso)}
                  className={`international-phone-option flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs transition hover:bg-white/5 ${
                    item.iso === country.iso ? "international-phone-option-active bg-[#D8B76A]/10 text-[#D8B76A]" : "text-white/80"
                  }`}
                >
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="international-phone-option-code shrink-0 font-mono text-white/60">+{item.dialCode}</span>
                </button>
              ))
            ) : (
              <div className="international-phone-empty px-3 py-6 text-center text-xs text-white/60">No country found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternationalPhoneInput;
