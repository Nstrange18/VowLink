import { useState } from 'react'

/**
 * ColorPicker
 * Props:
 *   value  – string[]  (hex colours, e.g. ["#FFFFFF", "#D8B76A"])
 *   onChange – (string[]) => void
 */
const ColorPicker = ({ value = [], onChange }) => {
  const [draft, setDraft] = useState('#D8B76A')

  const add = () => {
    if (value.length >= 5) return
    if (!draft || value.includes(draft)) return
    onChange([...value, draft])
  }

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx))

  const update = (idx, hex) => {
    const next = [...value]
    next[idx] = hex
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {/* Existing colours */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((hex, i) => (
            <div key={i} className="group relative flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
              {/* editable swatch */}
              <div className="relative h-6 w-6 cursor-pointer rounded-md overflow-hidden border border-white/20 flex-shrink-0">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => update(i, e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  title="Click to change colour"
                />
                <div className="w-full h-full rounded-md" style={{ background: hex }} />
              </div>
              <span className="text-xs font-mono text-white/60">{hex}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-0.5 text-white/20 hover:text-red-400 transition text-xs leading-none"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new colour */}
      {value.length < 5 && (
        <div className="flex items-center gap-2">
          {/* colour wheel */}
          <div className="relative h-9 w-9 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border border-white/20">
            <input
              type="color"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            />
            <div className="w-full h-full rounded-lg" style={{ background: draft }} />
          </div>
          {/* hex input */}
          <input
            type="text"
            value={draft}
            maxLength={7}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setDraft(v)
            }}
            placeholder="#D8B76A"
            className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-white placeholder-white/20 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition"
          />
          <button
            type="button"
            onClick={add}
            disabled={value.length >= 5}
            className="rounded-xl border border-[#D8B76A]/40 bg-[#D8B76A]/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#D8B76A] hover:bg-[#D8B76A]/20 transition disabled:opacity-40"
          >
            + Add
          </button>
          <span className="text-xs text-white/25">{value.length}/5</span>
        </div>
      )}

      {/* Live preview strip */}
      {value.length > 0 && (
        <div className="flex h-5 w-full overflow-hidden rounded-full border border-white/10">
          {value.map((hex, i) => (
            <div key={i} className="flex-1" style={{ background: hex }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ColorPicker
