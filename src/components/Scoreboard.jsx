import { useState } from 'react'
import BeadWire from './BeadWire.jsx'
import { ROWS, closedCount } from '../game.js'

const GRID = 'grid grid-cols-[minmax(0,1fr)] grid-rows-[2.75rem_repeat(9,minmax(0,1fr))_1.75rem]'

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

export default function Scoreboard({ players, current, winner, onRename }) {
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
          const active = index === current && winner === null
          return (
            <div
              key={index}
              className={`${GRID} felt min-w-[4.5rem] flex-1 rounded-md ${
                active ? 'felt-active' : ''
              }`}
            >
              <div className="flex items-center border-b border-white/5 px-1">
                <PlayerName
                  name={player.name}
                  active={active}
                  onRename={(name) => onRename(index, name)}
                />
              </div>
              {ROWS.map((row, rowIndex) => (
                <BeadWire
                  key={row}
                  label={row}
                  marks={player.marks[rowIndex]}
                  dark={row === 'C'}
                  active={active && player.row === rowIndex}
                />
              ))}
              <div
                className={`flex items-center justify-center text-sm font-semibold tracking-widest ${
                  winner === index ? 'text-brass' : 'text-cream/50'
                }`}
              >
                {closedCount(player)}/{ROWS.length}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
