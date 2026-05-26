/**
 * ColorPicker — name-based wedding colour selector
 * Stores human-readable colour names (e.g. "Champagne Gold"), not hex codes.
 * Props:
 *   value    – string[]   selected colour names
 *   onChange – (string[]) => void
 */

// Curated wedding colour palette — name shown to users, hex only used for the visual swatch
export const WEDDING_COLORS = [
  { name: 'Ivory',           hex: '#FFFFF0' },
  { name: 'Champagne Gold',  hex: '#C9A84C' },
  { name: 'Blush Pink',      hex: '#FFB6C1' },
  { name: 'Dusty Rose',      hex: '#DCAE96' },
  { name: 'Sage Green',      hex: '#8FAF88' },
  { name: 'Lavender',        hex: '#B57EDC' },
  { name: 'Navy Blue',       hex: '#1A2E4A' },
  { name: 'Royal Blue',      hex: '#2B4D9C' },
  { name: 'Burgundy',        hex: '#800020' },
  { name: 'Terracotta',      hex: '#C27B5A' },
  { name: 'Emerald Green',   hex: '#2D6A4F' },
  { name: 'Mint Green',      hex: '#AAD5C0' },
  { name: 'Peach',           hex: '#FFCBA4' },
  { name: 'Coral',           hex: '#FF7F6A' },
  { name: 'Gold',            hex: '#D4AF37' },
  { name: 'Silver',          hex: '#C0C0C0' },
  { name: 'White',           hex: '#FFFFFF' },
  { name: 'Cream',           hex: '#FFFDD0' },
  { name: 'Mauve',           hex: '#C5A0A0' },
  { name: 'Teal',            hex: '#008080' },
  { name: 'Lilac',           hex: '#C8A2C8' },
  { name: 'Nude',            hex: '#E8C9A0' },
  { name: 'Midnight Black',  hex: '#1C1C1C' },
  { name: 'Rose Gold',       hex: '#B76E79' },
]

const ColorPicker = ({ value = [], onChange }) => {
  const toggle = (name) => {
    if (value.includes(name)) {
      onChange(value.filter((n) => n !== name))
    } else {
      if (value.length >= 5) return
      onChange([...value, name])
    }
  }

  return (
    <div className="space-y-4">
      {/* Selected colour pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((name) => {
            const match = WEDDING_COLORS.find((c) => c.name === name)
            const hex = match?.hex || '#999'
            return (
              <div key={name}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-2 pr-3 py-1.5"
              >
                <div className="h-3.5 w-3.5 rounded-full border border-white/20 flex-shrink-0"
                  style={{ background: hex }} />
                <span className="text-xs text-white/80">{name}</span>
                <button type="button" onClick={() => toggle(name)}
                  className="ml-1 text-white/20 hover:text-red-400 transition text-xs leading-none">
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Colour palette grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {WEDDING_COLORS.map(({ name, hex }) => {
          const selected = value.includes(name)
          const disabled = !selected && value.length >= 5
          return (
            <button
              key={name}
              type="button"
              disabled={disabled}
              onClick={() => toggle(name)}
              title={name}
              className={`group relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition border
                ${selected
                  ? 'border-[#D8B76A] bg-[#D8B76A]/10 ring-1 ring-[#D8B76A]/40'
                  : disabled
                    ? 'border-white/5 opacity-30 cursor-not-allowed'
                    : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/8'
                }`}
            >
              {/* Swatch */}
              <div
                className="h-8 w-8 rounded-full border border-white/20 shadow-inner"
                style={{ background: hex }}
              />
              {/* Selected tick */}
              {selected && (
                <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-[#D8B76A] flex items-center justify-center">
                  <span className="text-[8px] text-[#070A13] font-bold leading-none">✓</span>
                </div>
              )}
              {/* Name */}
              <span className="text-[9px] leading-tight text-center text-white/50 group-hover:text-white/70 transition line-clamp-2">
                {name}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-white/25">{value.length}/5 selected</p>
    </div>
  )
}

export default ColorPicker
