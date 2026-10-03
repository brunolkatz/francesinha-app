import { useEffect, useState } from 'react'
import PlayerName from './PlayerName.jsx'
import { RemoveConfirm, RemoveCross, useArmed } from './RemoveButton.jsx'
import { MAX_VISIT, average, isBust, visitError } from '../x01.js'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

function PlayerCard({ player, seat, active, won, canRemove, onRename, onRemove }) {
  const [armed, arm] = useArmed()
  const last = seat.visits.at(-1)

  return (
    <div
      className={`felt flex min-h-0 min-w-[6.5rem] flex-1 items-center gap-2 rounded-md px-2 py-1.5 portrait:flex-col portrait:justify-center landscape:px-4 ${
        active || won ? 'felt-active' : ''
      }`}
      aria-current={active ? 'true' : undefined}
    >
      <div className="flex min-w-0 flex-col gap-0.5 portrait:w-full portrait:items-center landscape:flex-1">
        <PlayerName
          name={player.name}
          active={active || won}
          onRename={onRename}
          className="text-base tracking-wide portrait:text-center sm:text-xl landscape:text-left"
        />
        <p className="w-full truncate px-1 text-sm tracking-wider text-cream/55 portrait:text-center sm:text-base">
          {last ? (last.bust ? 'Bust' : `Last ${last.score}`) : 'No visits'} · Avg{' '}
          {average(seat).toFixed(1)} · Legs {seat.legs}
        </p>
      </div>

      <span
        className={`text-5xl font-extrabold tabular-nums leading-none sm:text-6xl landscape:lg:text-7xl ${
          active || won ? 'text-brass' : 'text-cream/80'
        }`}
        aria-label={`${player.name}: ${seat.remaining} remaining`}
      >
        {seat.remaining}
      </span>

      {canRemove &&
        (armed ? (
          <RemoveConfirm onRemove={onRemove} />
        ) : (
          <RemoveCross name={player.name} onArm={arm} />
        ))}
    </div>
  )
}

export default function X01Board({
  players,
  x01,
  onScore,
  onBust,
  onNextLeg,
  onRename,
  onRemove,
}) {
  const [entry, setEntry] = useState('')
  const [error, setError] = useState(null)

  const over = x01.winnerId !== null
  const current = players.find((p) => p.id === x01.currentId)
  const remaining = x01.byId[x01.currentId].remaining

  const type = (digit) => {
    setError(null)
    const next = `${entry}${digit}`.replace(/^0+(?=\d)/, '')
    if (Number(next) <= MAX_VISIT) setEntry(next)
  }

  const erase = () => {
    setError(null)
    setEntry(entry.slice(0, -1))
  }

  const submit = () => {
    if (over || entry === '') return
    const value = Number(entry)
    const problem = visitError(remaining, value)
    if (problem) {
      setError(problem)
      return
    }
    onScore(value, isBust(remaining, value))
    setEntry('')
  }

  const bust = () => {
    if (over) return
    setError(null)
    setEntry('')
    onBust()
  }

  // Desktop keyboards can type the visit too. Skipped while a name is being edited.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
      if (/^\d$/.test(e.key)) type(e.key)
      else if (e.key === 'Backspace') erase()
      else if (e.key === 'Enter') {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const preview = entry !== '' && !isBust(remaining, Number(entry)) ? remaining - Number(entry) : null

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 landscape:flex-row">
      <div className="wood flex min-h-0 gap-1.5 overflow-auto rounded-xl p-2.5 portrait:h-[30%] portrait:min-h-36 landscape:w-[46%] landscape:flex-col">
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            seat={x01.byId[player.id]}
            active={!over && player.id === x01.currentId}
            won={player.id === x01.winnerId}
            canRemove={players.length > 1}
            onRename={(name) => onRename(index, name)}
            onRemove={() => onRemove(index)}
          />
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-2xl font-bold tracking-widest text-brass" aria-live="polite">
              {over ? `${current.name} checked out` : `${current.name} to throw`}
            </p>
            <p className={`text-base tracking-wider ${error ? 'text-[#e8796b]' : 'text-cream/55'}`} role={error ? 'alert' : undefined}>
              {error ??
                (over
                  ? 'Start the next leg or reset the match'
                  : entry === ''
                    ? 'Enter the visit total · finish on a double'
                    : preview === null
                      ? 'Bust: the score stays where it was'
                      : preview === 0
                        ? 'Checkout'
                        : `Leaves ${preview}`)}
            </p>
          </div>
          <output className="min-w-24 rounded-lg bg-felt px-3 py-1 text-right text-5xl font-extrabold tabular-nums text-cream">
            {entry === '' ? <span className="text-cream/25">0</span> : entry}
          </output>
        </div>

        {over ? (
          <button type="button" className="btn btn-primary min-h-20 flex-1 text-3xl" onClick={onNextLeg}>
            Next leg
          </button>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-4 gap-2">
            {KEYS.map((key) => (
              <button key={key} type="button" className="btn keypad-key" onClick={() => type(key)}>
                {key}
              </button>
            ))}
            <button type="button" className="btn keypad-key" onClick={erase} aria-label="Delete last digit">
              ⌫
            </button>
            <button type="button" className="btn keypad-key" onClick={() => type('0')}>
              0
            </button>
            <button
              type="button"
              className="btn btn-primary keypad-key"
              onClick={submit}
              disabled={entry === ''}
            >
              Enter
            </button>
          </div>
        )}

        {!over && (
          <button type="button" className="btn btn-danger min-h-14 text-xl" onClick={bust}>
            Bust
          </button>
        )}
      </div>
    </div>
  )
}
