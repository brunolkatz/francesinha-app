import { useEffect, useState } from 'react'

// Two taps to remove: the × arms a "Remove?" button that disarms itself
// after a few seconds, so a stray tap never removes a player. It must not
// disarm on blur: Safari blurs a button when it is tapped, which would
// unmount it before its own click fires.
export function useArmed() {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])

  return [armed, () => setArmed(true)]
}

export function RemoveCross({ name, onArm }) {
  return (
    <button
      type="button"
      onClick={onArm}
      aria-label={`Remove ${name}`}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-600 text-2xl font-bold leading-none text-cream active:bg-neutral-400 sm:size-11 sm:text-3xl"
    >
      ×
    </button>
  )
}

export function RemoveConfirm({ onRemove, className = '' }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={`h-9 rounded-lg bg-[#a5392c] px-2 text-sm font-bold uppercase tracking-wide text-cream sm:h-11 sm:text-base ${className}`}
    >
      Remove?
    </button>
  )
}
