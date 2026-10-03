import { useEffect, useState } from 'react'
import PlayerName from './PlayerName.jsx'
import {
  DARTS_PER_VISIT,
  MAX_VISIT,
  averageOf,
  isBust,
  legsOf,
  playerName,
  remainingOf,
  sideName,
  throwerOf,
  visitError,
  visitLog,
  winnerOf,
} from '../x01.js'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const SIDES = [0, 1]

function SideCard({ x01, side, thrower, winner, onRename }) {
  const active = winner === null && thrower.side === side
  const lit = active || winner === side
  const last = x01.visits.findLast((v) => v.side === side)
  const players = x01.format === 'pairs' ? [0, 1] : [0]

  return (
    <div
      className={`felt flex min-h-0 min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 portrait:flex-col portrait:justify-center landscape:px-4 ${
        lit ? 'felt-active' : ''
      }`}
      aria-current={active ? 'true' : undefined}
    >
      <div className="flex min-w-0 flex-col gap-0.5 portrait:w-full portrait:items-center landscape:flex-1">
        {players.map((player) => (
          <div key={player} className="flex w-full min-w-0 items-baseline gap-2 portrait:justify-center">
            <div className="min-w-0">
              <PlayerName
                name={playerName(x01, side, player)}
                // In a pair, only the partner at the oche lights up.
                active={winner === side || (active && thrower.player === player)}
                onRename={(name) => onRename(side, player, name)}
                className="text-lg tracking-wide portrait:text-center sm:text-2xl landscape:text-left"
              />
            </div>
            <span
              className="shrink-0 text-sm tabular-nums tracking-wider text-cream/55 sm:text-base"
              title="Average per visit since the last reset"
            >
              Avg {averageOf(x01, side, player).toFixed(1)}
            </span>
          </div>
        ))}
        <p className="w-full truncate px-1 text-sm tracking-wider text-cream/55 portrait:text-center sm:text-base">
          {last ? `Last pts. ${last.bust ? 'bust' : last.score}` : 'No visits this leg'}
        </p>
      </div>

      <span
        className={`text-6xl font-extrabold tabular-nums leading-none sm:text-7xl landscape:lg:text-8xl ${
          lit ? 'text-brass' : 'text-cream/80'
        }`}
        aria-label={`${sideName(x01, side)}: ${remainingOf(x01, side)} remaining`}
      >
        {remainingOf(x01, side)}
      </span>
    </div>
  )
}

// "Player 1 → 1 vs 0 ← Player 2", plus which leg is being played.
function LegScore({ x01 }) {
  return (
    <div className="rail flex items-center gap-2 rounded-md px-3 py-2 text-cream" aria-label="Legs score">
      <span className="min-w-0 flex-1 truncate text-right text-lg font-bold tracking-wide sm:text-xl">
        {sideName(x01, 0)}
      </span>
      <span className="text-copper" aria-hidden="true">→</span>
      <span className="text-3xl font-extrabold tabular-nums text-brass sm:text-4xl">{legsOf(x01, 0)}</span>
      <span className="px-1 text-base uppercase tracking-widest text-cream/60">vs</span>
      <span className="text-3xl font-extrabold tabular-nums text-brass sm:text-4xl">{legsOf(x01, 1)}</span>
      <span className="text-copper" aria-hidden="true">←</span>
      <span className="min-w-0 flex-1 truncate text-lg font-bold tracking-wide sm:text-xl">
        {sideName(x01, 1)}
      </span>
    </div>
  )
}

const HISTORY_COLUMNS = 'grid grid-cols-[3rem_minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2'

function VisitHistory({ x01 }) {
  const log = visitLog(x01).reverse()
  return (
    <div className="felt flex h-36 shrink-0 flex-col rounded-xl sm:h-40">
      <p className="flex justify-between border-b border-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-widest text-copper">
        <span>Leg {x01.leg + 1} history</span>
        <span>{log.length * DARTS_PER_VISIT} darts</span>
      </p>
      <p
        className={`${HISTORY_COLUMNS} border-b border-white/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-cream/50`}
        aria-hidden="true"
      >
        <span>Darts</span>
        <span>Player</span>
        <span className="text-right">Scored</span>
        <span className="text-right">To go</span>
      </p>
      {log.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-base tracking-wider text-cream/40">
          No visits yet
        </p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3" aria-label="Visit history, newest first">
          {log.map((v) => (
            <li
              key={v.number}
              className={`${HISTORY_COLUMNS} border-b border-white/5 py-1 text-lg tabular-nums last:border-0`}
            >
              <span className="text-cream/40">{v.darts}</span>
              <span className="truncate font-semibold tracking-wide">{playerName(x01, v.side, v.player)}</span>
              <span className={`text-right font-bold ${v.bust ? 'text-[#e8796b]' : 'text-brass'}`}>
                {v.bust ? 'Bust' : v.score}
              </span>
              <span className="text-right text-cream/80">{v.remaining}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function X01Board({ x01, onScore, onBust, onUndo, onNextLeg, onRename }) {
  const [entry, setEntry] = useState('')
  const [error, setError] = useState(null)

  const winner = winnerOf(x01)
  const over = winner !== null
  const thrower = throwerOf(x01)
  const remaining = remainingOf(x01, thrower.side)

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
    onScore(value)
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
  const hint =
    error ??
    (over
      ? 'Start the next leg or reset the match'
      : entry === ''
        ? 'Enter the visit total · finish on a double'
        : preview === null
          ? 'Bust: the score stays where it was'
          : preview === 0
            ? 'Checkout'
            : `Leaves ${preview}`)

  return (
    <div className="flex min-h-full flex-col gap-3 landscape:h-full landscape:min-h-0 landscape:flex-row">
      <div className="wood flex min-h-0 flex-col gap-1.5 rounded-xl p-2.5 portrait:h-[26dvh] portrait:min-h-64 portrait:shrink-0 landscape:w-[46%]">
        <LegScore x01={x01} />
        <div className="flex min-h-0 flex-1 gap-1.5 landscape:flex-col">
          {SIDES.map((side) => (
            <SideCard
              key={side}
              x01={x01}
              side={side}
              thrower={thrower}
              winner={winner}
              onRename={onRename}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <VisitHistory x01={x01} />

        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-2xl font-bold tracking-widest text-brass" aria-live="polite">
              {over
                ? `${sideName(x01, winner)} checked out`
                : `${playerName(x01, thrower.side, thrower.player)} to throw`}
            </p>
            <p
              className={`text-base tracking-wider ${error ? 'text-[#e8796b]' : 'text-cream/55'}`}
              role={error ? 'alert' : undefined}
            >
              {hint}
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
          <>
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
          </>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            className="btn min-h-14 flex-1 text-xl"
            onClick={() => {
              setError(null)
              setEntry('')
              onUndo()
            }}
            disabled={x01.visits.length === 0}
          >
            Undo
          </button>
          {!over && (
            <button type="button" className="btn btn-danger min-h-14 flex-[2] text-xl" onClick={bust}>
              Bust
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
