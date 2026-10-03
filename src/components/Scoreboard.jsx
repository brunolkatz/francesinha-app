import { useEffect, useState } from 'react'
import BeadWire from './BeadWire.jsx'
import { ROWS, closedCount } from '../game.js'

// The repeat count must match ROWS.length (Tailwind needs a literal class).
const GRID = 'grid grid-cols-[minmax(0,1fr)] grid-rows-[2.75rem_repeat(10,minmax(0,1fr))_3.5rem]'

function PlayerName({ name, active, onRename }) {
  const [draft, setDraft] = useState(null)

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(name)}
        title="Tap to rename"
        className={`w-full truncate px-1 text-center text-sm font-bold uppercase sm:text-base sm:tracking-wide ${
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

// Two taps to remove: the × arms a "Remove?" button that disarms itself
// after a few seconds, so a stray tap never wipes a column. It must not
// disarm on blur: Safari blurs a button when it is tapped, which would
// unmount it before its own click fires.
function ColumnFooter({ player, done, canRemove, onRemove }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])

  if (armed) {
    return (
      <div className="flex items-center px-1">
        <button
          type="button"
          onClick={onRemove}
          className="h-9 w-full rounded-lg bg-[#a5392c] text-sm font-bold uppercase tracking-wide text-cream sm:h-11 sm:text-base"
        >
          Remove?
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <span
        className={`min-w-0 flex-1 text-center text-sm font-semibold tracking-widest ${
          canRemove ? 'pl-1 sm:pl-12' : ''
        } ${
          done ? 'text-brass' : 'text-cream/50'
        }`}
      >
        {closedCount(player)}/{ROWS.length}
      </span>
      {canRemove && (
        <button
          type="button"
          onClick={() => setArmed(true)}
          aria-label={`Remove ${player.name}`}
          className="mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-600 text-2xl font-bold leading-none text-cream active:bg-neutral-400 sm:mr-1.5 sm:size-11 sm:text-3xl"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function Scoreboard({ players, onRename, onTap, onRemove }) {
  return (
    <div className="wood flex h-full w-full gap-1.5 rounded-xl p-2.5">
      <div className={`${GRID} rail w-11 shrink-0 rounded-md sm:w-14`}>
        <div />
        {ROWS.map((row) => (
          <div
            key={row}
            className="rail-label flex items-center justify-center text-xl font-extrabold tracking-widest sm:text-2xl"
          >
            {row}
          </div>
        ))}
        <div />
      </div>

      {/* Columns scroll sideways here, never the page, if 5 cannot fit. */}
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain">
        {players.map((player, index) => {
          const done = closedCount(player) === ROWS.length
          return (
            <div
              key={player.id}
              className={`${GRID} felt min-w-[4.5rem] flex-1 rounded-md ${
                done ? 'felt-active' : ''
              }`}
            >
              <div className="flex items-center border-b border-white/5 px-1">
                <PlayerName
                  name={player.name}
                  active={done}
                  onRename={(name) => onRename(index, name)}
                />
              </div>
              {ROWS.map((row, rowIndex) => (
                <BeadWire
                  key={row}
                  label={row}
                  marks={player.marks[rowIndex]}
                  dark={row === 'C'}
                  onTap={() => onTap(index, rowIndex)}
                />
              ))}
              <ColumnFooter
                player={player}
                done={done}
                canRemove={players.length > 1}
                onRemove={() => onRemove(index)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
