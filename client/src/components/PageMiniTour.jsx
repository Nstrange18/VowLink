import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import GuidedTour from './GuidedTour'

const PageMiniTour = ({ title = 'Quick tour', storageKey, steps = [], className = '' }) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!storageKey || steps.length === 0) return
    if (localStorage.getItem(storageKey)) return
    const timer = window.setTimeout(() => setOpen(true), 450)
    return () => window.clearTimeout(timer)
  }, [storageKey, steps.length])

  if (steps.length === 0) return null

  return (
    <>
      <GuidedTour
        open={open}
        title={title}
        steps={steps}
        storageKey={storageKey}
        onClose={() => setOpen(false)}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex w-fit items-center justify-center gap-2 rounded-full border border-[#D8B76A]/25 bg-[#D8B76A]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#F2D894] transition hover:bg-[#D8B76A]/15 ${className}`}
      >
        <Icon icon="lucide:map" className="h-3.5 w-3.5" />
        Take Tour
      </button>
    </>
  )
}

export default PageMiniTour
