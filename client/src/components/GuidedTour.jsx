import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const GuidedTour = ({ open, title = 'Guided tour', steps = [], storageKey, onClose }) => {
  const [index, setIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)

  const activeStep = steps[index]
  const total = steps.length

  useEffect(() => {
    if (!open) return
    setIndex(0)
  }, [open, storageKey])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || !activeStep?.target) {
      setTargetRect(null)
      return
    }

    activeStep.prepare?.()

    let targetElement = null

    const findRenderedTarget = () => {
      const elements = Array.from(document.querySelectorAll(activeStep.target))
      return elements.find((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        )
      })
    }

    const measureTarget = () => {
      const element = targetElement || findRenderedTarget()
      if (!element) {
        setTargetRect(null)
        return
      }

      const rect = element.getBoundingClientRect()
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    const scrollAndMeasureTarget = () => {
      targetElement = findRenderedTarget()
      if (!targetElement) {
        setTargetRect(null)
        return
      }

      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      window.setTimeout(measureTarget, 360)
    }

    window.setTimeout(scrollAndMeasureTarget, activeStep.prepare ? 120 : 0)
    window.addEventListener('resize', measureTarget)
    window.addEventListener('scroll', measureTarget, true)

    return () => {
      window.removeEventListener('resize', measureTarget)
      window.removeEventListener('scroll', measureTarget, true)
    }
  }, [activeStep, open])

  const cardPosition = useMemo(() => {
    const isMobile = window.innerWidth < 760
    if (isMobile) {
      const targetIsLow = targetRect && targetRect.top + targetRect.height > window.innerHeight * 0.58
      return {
        left: 12,
        right: 12,
        bottom: targetIsLow ? 'auto' : 14,
        top: targetIsLow ? 14 : 'auto',
        transform: 'none',
      }
    }

    if (!targetRect) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

    const cardWidth = Math.min(380, window.innerWidth - 32)
    const left = clamp(targetRect.left + targetRect.width + 18, 16, window.innerWidth - cardWidth - 16)
    const shouldPlaceBelow = targetRect.top < 220
    const top = shouldPlaceBelow
      ? clamp(targetRect.top + targetRect.height + 16, 16, window.innerHeight - 260)
      : clamp(targetRect.top, 16, window.innerHeight - 260)

    return { left, top, transform: 'none' }
  }, [targetRect])

  if (!open || total === 0) return null

  const highlight = targetRect
    ? {
        top: Math.max(targetRect.top - 8, 0),
        left: Math.max(targetRect.left - 8, 0),
        width: Math.min(targetRect.width + 16, window.innerWidth),
        height: Math.min(targetRect.height + 16, window.innerHeight),
      }
    : null

  const finish = () => {
    if (storageKey) localStorage.setItem(storageKey, 'true')
    onClose?.()
  }

  const goNext = () => {
    if (index >= total - 1) {
      finish()
      return
    }
    setIndex((current) => current + 1)
  }

  const goBack = () => setIndex((current) => Math.max(current - 1, 0))

  return (
    <div className="fixed inset-0 z-[80] pointer-events-auto">
      {highlight ? (
        <>
          <div className="absolute left-0 top-0 w-full bg-[#02040A]/72 backdrop-blur-[2px]" style={{ height: highlight.top }} />
          <div
            className="absolute left-0 bg-[#02040A]/72 backdrop-blur-[2px]"
            style={{ top: highlight.top, width: highlight.left, height: highlight.height }}
          />
          <div
            className="absolute bg-[#02040A]/72 backdrop-blur-[2px]"
            style={{
              top: highlight.top,
              left: highlight.left + highlight.width,
              right: 0,
              height: highlight.height,
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-full bg-[#02040A]/72 backdrop-blur-[2px]"
            style={{ top: highlight.top + highlight.height }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#02040A]/72 backdrop-blur-[2px]" />
      )}

      {highlight && (
        <div
          className="absolute rounded-3xl border-2 border-[#D8B76A] shadow-[0_0_34px_rgba(216,183,106,0.35)] transition-all duration-300"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        />
      )}

      <section
        className="pointer-events-auto fixed max-h-[calc(100svh-28px)] w-[calc(100vw-24px)] max-w-[380px] overflow-y-auto rounded-3xl border border-[#D8B76A]/25 bg-[#0D1220] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:w-[calc(100vw-32px)] sm:p-5"
        style={cardPosition}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">{title}</p>
            <h2 className="mt-2 font-serif text-xl leading-tight text-white sm:text-2xl">{activeStep.title}</h2>
          </div>
          <button
            type="button"
            onClick={finish}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label="Close tour"
          >
            <Icon icon="lucide:x" className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-white/62 sm:text-sm">{activeStep.body}</p>

        {activeStep.items?.length > 0 && (
          <ul className="mt-4 space-y-2">
            {activeStep.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-white/60">
                <Icon icon="lucide:check-circle-2" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D8B76A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 sm:mt-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
            {index + 1} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              disabled={index === 0}
              className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/55 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-[#D8B76A] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894]"
            >
              {index >= total - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default GuidedTour
