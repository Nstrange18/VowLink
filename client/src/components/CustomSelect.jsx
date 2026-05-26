import { useState, useRef, useEffect } from 'react'

/**
 * CustomSelect — a fully styled dropdown that matches the dark admin theme.
 * Replaces native <select> to avoid browser-default white popup backgrounds.
 *
 * Props:
 *   name      – form field name
 *   value     – current selected value
 *   onChange  – called with a synthetic-like event { target: { name, value } }
 *   options   – array of { value, label }
 *   className – extra classes for the trigger button
 */
const CustomSelect = ({ name, value, onChange, options = [], className = '' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value

  const handleSelect = (optValue) => {
    onChange({ target: { name, value: optValue } })
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition"
      >
        <span>{selectedLabel}</span>
        <span className={`text-white/40 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#0D1220] py-1 shadow-xl overflow-hidden">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${value === opt.value
                    ? 'bg-[#D8B76A]/15 text-[#D8B76A]'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CustomSelect
