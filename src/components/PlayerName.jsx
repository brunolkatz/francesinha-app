import { useState } from 'react'

// Tap the name to rename it in place.
export default function PlayerName({ name, active, onRename, className = '' }) {
  const [draft, setDraft] = useState(null)

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(name)}
        title="Tap to rename"
        className={`w-full truncate px-1 font-bold uppercase ${className} ${
          active ? 'text-brass' : 'text-cream/75'
        }`}
      >
        {name}
      </button>
    )
  }

  const commit = () => {
    onRename(draft)
    setDraft(null)
  }

  return (
    <input
      autoFocus
      value={draft}
      maxLength={14}
      aria-label="Player name"
      enterKeyHint="done"
      onFocus={(e) => e.target.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') setDraft(null)
      }}
      // 16px minimum keeps iOS Safari from zooming the page on focus.
      className="w-full min-w-0 rounded bg-cream px-1 text-center text-base font-bold tracking-wide text-bar outline-2 outline-copper"
    />
  )
}
