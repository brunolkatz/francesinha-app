import { useEffect, useReducer, useState } from 'react'
import Scoreboard from './components/Scoreboard.jsx'
import Dartboard from './components/Dartboard.jsx'
import TurnBar from './components/TurnBar.jsx'
import WinModal from './components/WinModal.jsx'
import ResetConfirm from './components/ResetConfirm.jsx'
import {
  DARTS_PER_VISIT,
  MAX_PLAYERS,
  MISS,
  createGame,
  loadNames,
  marksFor,
  reducer,
  saveNames,
} from './game.js'
import { playClick } from './sound.js'

function Pips({ left }) {
  return (
    <div className="flex gap-1.5" aria-label={`${left} darts left`}>
      {Array.from({ length: DARTS_PER_VISIT }, (_, i) => (
        <span
          key={i}
          className={`h-4 w-4 rounded-full border border-copper transition-colors ${
            i < left ? 'bg-copper' : 'bg-transparent'
          }`}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createGame(loadNames()))
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [sound, setSound] = useState(false)

  const { players, current, dartsLeft, winner, history } = state
  const player = players[current]
  const over = winner !== null
  const full = players.length >= MAX_PLAYERS

  const names = players.map((p) => p.name).join('\n')
  useEffect(() => {
    saveNames(names.split('\n'))
  }, [names])

  const throwDart = (hit) => {
    if (over) return
    if (sound) playClick(marksFor(player.row, hit) === 0)
    dispatch({ type: 'throw', hit })
  }

  return (
    <div className="flex min-h-dvh flex-col landscape:h-dvh landscape:min-h-[520px]">
      <header className="px-safe flex flex-wrap items-center gap-x-4 gap-y-2 pb-1 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <h1 className="text-3xl font-extrabold uppercase tracking-[0.2em] text-copper">
          Francesinha
        </h1>

        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-2xl font-bold tracking-wider">
            {over ? `${players[winner].name} wins` : player.name}
          </span>
          {!over && <Pips left={dartsLeft} />}
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="btn"
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            Sound {sound ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className="btn portrait:hidden"
            onClick={() => dispatch({ type: 'undo' })}
            disabled={history.length === 0}
          >
            Undo
          </button>
          <div className="flex flex-col items-center">
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'addPlayer' })}
              disabled={full}
              aria-describedby={full ? 'max-players' : undefined}
            >
              Add player
            </button>
            {full && (
              <span id="max-players" className="mt-0.5 text-xs tracking-wider text-cream/60">
                Maximum 5 players
              </span>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              className="btn"
              aria-expanded={confirmingReset}
              onClick={() => setConfirmingReset(!confirmingReset)}
            >
              Reset
            </button>
            {confirmingReset && (
              <ResetConfirm
                onConfirm={() => {
                  dispatch({ type: 'reset' })
                  setConfirmingReset(false)
                }}
                onCancel={() => setConfirmingReset(false)}
              />
            )}
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 pt-2 landscape:flex-row landscape:px-3 landscape:pb-3">
        <section className="portrait:h-[clamp(300px,34dvh,480px)] portrait:px-3 landscape:h-full landscape:w-[46%]">
          <Scoreboard
            players={players}
            current={current}
            winner={winner}
            onRename={(index, name) => dispatch({ type: 'rename', index, name })}
          />
        </section>

        <section className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="relative mx-auto min-h-[280px] w-full flex-1">
            <Dartboard onHit={throwDart} disabled={over} />
          </div>
          <TurnBar
            state={state}
            onMiss={() => throwDart(MISS)}
            onEndVisit={() => dispatch({ type: 'endVisit' })}
            onUndo={() => dispatch({ type: 'undo' })}
          />
        </section>
      </main>

      {over && state.winModalOpen && (
        <WinModal
          name={players[winner].name}
          onNewGame={() => dispatch({ type: 'newGame' })}
          onDismiss={() => dispatch({ type: 'dismissWin' })}
        />
      )}
    </div>
  )
}
