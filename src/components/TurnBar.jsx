import { DARTS_PER_VISIT, MARKS_TO_CLOSE, ROWS } from '../game.js'

function Chip({ dart, faded }) {
  if (!dart) {
    return (
      <span className="flex h-10 min-w-16 items-center justify-center rounded-full border border-dashed border-cream/20 px-3 text-cream/25">
        –
      </span>
    )
  }
  return (
    <span
      className={`flex h-10 min-w-16 items-center justify-center rounded-full px-3 text-lg font-bold tracking-wider ${
        dart.scored
          ? 'bg-copper text-bar'
          : 'border border-cream/25 bg-black/40 text-cream/70'
      } ${faded ? 'opacity-45' : ''}`}
    >
      {dart.label}
    </span>
  )
}

export default function TurnBar({ state, onMiss, onEndVisit, onUndo }) {
  const { players, current, visitLog, lastVisit, winner, history } = state
  const player = players[current]
  const over = winner !== null

  // Between visits, keep the previous visit readable until the next dart.
  const showLast = !over && visitLog.length === 0 && lastVisit
  const darts = showLast ? lastVisit.darts : visitLog
  const slots = Array.from({ length: DARTS_PER_VISIT }, (_, i) => darts[i])

  const caption = over
    ? `${players[winner].name} closed the francesinha`
    : `Target: ${ROWS[player.row]} · ${MARKS_TO_CLOSE - player.marks[player.row]} left`

  return (
    <div className="pb-safe z-10 flex flex-col gap-2.5 rounded-t-xl bg-bar/95 px-3 pt-2.5 backdrop-blur portrait:sticky portrait:bottom-0 landscape:rounded-xl landscape:bg-black/30">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-2xl font-bold tracking-widest text-brass" aria-live="polite">
          {caption}
        </p>
        <div className="flex items-center gap-2">
          {showLast && (
            <span className="max-w-28 truncate text-sm tracking-wider text-cream/45">
              {players[lastVisit.player].name}
            </span>
          )}
          {slots.map((dart, i) => (
            <Chip key={i} dart={dart} faded={showLast} />
          ))}
        </div>
      </div>
      <div className="flex gap-2.5">
        <button type="button" className="btn btn-primary min-h-14 flex-[2] text-xl" onClick={onMiss} disabled={over}>
          Miss
        </button>
        <button type="button" className="btn min-h-14 flex-[2] text-xl" onClick={onEndVisit} disabled={over}>
          End visit
        </button>
        <button
          type="button"
          className="btn min-h-14 flex-1 text-xl landscape:hidden"
          onClick={onUndo}
          disabled={history.length === 0}
        >
          Undo
        </button>
      </div>
      <p className="text-center text-sm tracking-widest text-cream/45">
        Join on this network:{' '}
        <span className="select-text text-cream/70">http://{window.location.host}</span>
      </p>
    </div>
  )
}
