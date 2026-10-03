import BeadWire from './BeadWire.jsx'
import PlayerName from './PlayerName.jsx'
import { RemoveConfirm, RemoveCross, useArmed } from './RemoveButton.jsx'
import { ROWS, closedCount } from '../game.js'

// The repeat count must match ROWS.length (Tailwind needs a literal class).
const GRID = 'grid grid-cols-[minmax(0,1fr)] grid-rows-[2.75rem_repeat(10,minmax(0,1fr))_3.5rem]'

function ColumnFooter({ player, done, canRemove, onRemove }) {
  const [armed, arm] = useArmed()

  if (armed) {
    return (
      <div className="flex items-center px-1">
        <RemoveConfirm onRemove={onRemove} className="w-full" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center pr-1 sm:pr-1.5">
      <span
        className={`min-w-0 flex-1 text-center text-sm font-semibold tracking-widest ${
          canRemove ? 'pl-1 sm:pl-12' : ''
        } ${done ? 'text-brass' : 'text-cream/50'}`}
      >
        {closedCount(player)}/{ROWS.length}
      </span>
      {canRemove && <RemoveCross name={player.name} onArm={arm} />}
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
                  className="text-center text-sm sm:text-base sm:tracking-wide"
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
