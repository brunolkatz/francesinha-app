import { useState } from 'react'
import { FORMATS } from '../x01.js'

const FORMAT_LABELS = { singles: 'Singles · 1 vs 1', pairs: 'Pairs · 2 vs 2' }

// Choose singles or pairs and type in who is playing.
export default function X01Players({ x01, onFormat, onRename, onClose }) {
  const [drafts, setDrafts] = useState(x01.names)
  const pairs = x01.format === 'pairs'

  const edit = (side, player, value) =>
    setDrafts(drafts.map((pair, s) => pair.map((old, p) => (s === side && p === player ? value : old))))

  const done = () => {
    drafts.forEach((pair, side) =>
      pair.forEach((name, player) => {
        if (name !== x01.names[side][player]) onRename(side, player, name)
      }),
    )
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="players-title"
    >
      <form
        className="wood w-full max-w-xl rounded-2xl p-3"
        onSubmit={(e) => {
          e.preventDefault()
          done()
        }}
      >
        <div className="felt flex max-h-[85dvh] flex-col gap-4 overflow-y-auto rounded-xl px-5 py-5">
          <h2 id="players-title" className="text-center text-3xl font-extrabold tracking-wide text-brass">
            501 players
          </h2>

          <div className="flex rounded-xl border border-copper/55 bg-black/30 p-1" role="group" aria-label="Format">
            {FORMATS.map((format) => (
              <button
                key={format}
                type="button"
                aria-pressed={x01.format === format}
                onClick={() => onFormat(format)}
                className={`min-h-12 flex-1 rounded-lg px-3 text-lg font-bold uppercase tracking-wider transition-colors ${
                  x01.format === format ? 'bg-copper text-bar' : 'text-cream/70'
                }`}
              >
                {FORMAT_LABELS[format]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {drafts.map((pair, side) => (
              <fieldset key={side} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3">
                <legend className="px-1 text-sm font-semibold uppercase tracking-[0.25em] text-copper">
                  {pairs ? `Team ${side + 1}` : `Player ${side + 1}`}
                </legend>
                {(pairs ? [0, 1] : [0]).map((player) => (
                  <input
                    key={player}
                    value={pair[player]}
                    maxLength={14}
                    aria-label={pairs ? `Team ${side + 1}, player ${player + 1} name` : `Player ${side + 1} name`}
                    enterKeyHint="done"
                    autoComplete="off"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => edit(side, player, e.target.value)}
                    className="min-h-12 w-full min-w-0 rounded-lg bg-cream px-3 text-xl font-bold tracking-wide text-bar outline-copper focus:outline-2"
                  />
                ))}
              </fieldset>
            ))}
          </div>

          {pairs && (
            <p className="text-center text-base tracking-wider text-cream/55">
              Partners share one score and take alternate visits.
            </p>
          )}

          <button type="submit" className="btn btn-primary min-h-14 text-xl">
            Done
          </button>
        </div>
      </form>
    </div>
  )
}
