import { useEffect, useReducer, useState } from 'react'
import Scoreboard from './components/Scoreboard.jsx'
import WinModal from './components/WinModal.jsx'
import ResetConfirm from './components/ResetConfirm.jsx'
import { MAX_PLAYERS, createGame, loadNames, reducer, saveNames } from './game.js'
import { playClick } from './sound.js'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createGame(loadNames()))
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [sound, setSound] = useState(false)

  const { players, winner, history } = state
  const full = players.length >= MAX_PLAYERS

  const names = players.map((p) => p.name).join('\n')
  useEffect(() => {
    saveNames(names.split('\n'))
  }, [names])

  const tap = (player, row) => {
    if (sound) playClick(false)
    dispatch({ type: 'tap', player, row })
  }

  return (
    <div className="flex h-dvh min-h-[440px] flex-col">
      <header className="px-safe flex flex-wrap items-center gap-x-4 gap-y-2 pb-1 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <h1 className="text-3xl font-extrabold uppercase tracking-[0.2em] text-copper">
          Francesinha
        </h1>

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
            className="btn"
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

      <main className="px-safe min-h-0 flex-1 pt-2">
        <Scoreboard
          players={players}
          onRename={(index, name) => dispatch({ type: 'rename', index, name })}
          onTap={tap}
          onRemove={(index) => dispatch({ type: 'removePlayer', index })}
        />
      </main>

      <p className="pb-safe px-3 pt-2 text-center text-sm tracking-widest text-cream/45">
        Tap a wire to add a mark · Join on this network:{' '}
        <span className="select-text text-cream/70">{window.location.origin}{window.location.pathname.replace(/\/$/, '')}</span>
      </p>

      {winner !== null && (
        <WinModal
          name={players[winner].name}
          onNewGame={() => dispatch({ type: 'newGame' })}
          onDismiss={() => dispatch({ type: 'dismissWin' })}
        />
      )}
    </div>
  )
}
