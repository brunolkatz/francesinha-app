import { useEffect, useReducer, useState } from 'react'
import Scoreboard from './components/Scoreboard.jsx'
import X01Board from './components/X01Board.jsx'
import X01Players from './components/X01Players.jsx'
import WinModal from './components/WinModal.jsx'
import ResetConfirm from './components/ResetConfirm.jsx'
import { MAX_PLAYERS } from './game.js'
import { MODES, loadState, reducer, saveState } from './store.js'
import { sideName, winnerOf } from './x01.js'

const MODE_LABELS = { francesinha: 'Francesinha', 501: '501' }

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [editingPlayers, setEditingPlayers] = useState(false)

  // Every change is saved, so a reload or a closed tab resumes both games.
  useEffect(() => {
    saveState(state)
  }, [state])

  const { mode, fr, x01 } = state
  const { players } = fr
  const is501 = mode === '501'
  const full = players.length >= MAX_PLAYERS

  const rename = (index, name) => dispatch({ type: 'rename', index, name })
  const remove = (index) => dispatch({ type: 'removePlayer', index })

  const tap = (player, row) => dispatch({ type: 'tap', player, row })

  const x01Winner = winnerOf(x01)

  return (
    <div className="flex h-dvh min-h-[440px] flex-col">
      <header className="px-safe flex flex-wrap items-center gap-x-3 gap-y-2 pb-1 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-extrabold uppercase tracking-[0.12em] text-copper lg:text-3xl lg:tracking-[0.2em]">
          Francesinha
        </h1>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {/* In 501 the Undo sits next to Bust, under the keypad. */}
          {!is501 && (
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'undo' })}
              disabled={fr.history.length === 0}
            >
              Undo
            </button>
          )}
          {is501 ? (
            <button type="button" className="btn" onClick={() => setEditingPlayers(true)}>
              Players
            </button>
          ) : (
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
          )}
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
                question={is501 ? 'Reset the 501 match?' : 'Reset the board?'}
                onConfirm={() => {
                  dispatch({ type: is501 ? 'x01/reset' : 'reset' })
                  setConfirmingReset(false)
                }}
                onCancel={() => setConfirmingReset(false)}
              />
            )}
          </div>
        </div>
        {/* The game toggle sits at the far right, with the actions to its left. */}
        <div className="flex rounded-xl border border-copper/55 bg-black/30 p-1" role="group" aria-label="Game">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setConfirmingReset(false)
                dispatch({ type: 'setMode', mode: m })
              }}
              className={`min-h-10 rounded-lg px-4 text-base font-bold uppercase tracking-widest transition-colors ${
                mode === m ? 'bg-copper text-bar' : 'text-cream/70'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </header>

      <main className="px-safe pb-safe min-h-0 flex-1 pt-2 portrait:overflow-y-auto">
        {is501 ? (
          <X01Board
            x01={x01}
            onScore={(value) => dispatch({ type: 'x01/score', value })}
            onBust={() => dispatch({ type: 'x01/bust' })}
            onUndo={() => dispatch({ type: 'x01/undo' })}
            onNextLeg={() => dispatch({ type: 'x01/nextLeg' })}
            onRename={(side, player, name) => dispatch({ type: 'x01/rename', side, player, name })}
          />
        ) : (
          <Scoreboard players={players} onRename={rename} onTap={tap} onRemove={remove} />
        )}
      </main>

      {!is501 && fr.winner !== null && (
        <WinModal
          eyebrow="Board closed"
          title={`${players[fr.winner].name} closed the francesinha`}
          primaryLabel="New game"
          onPrimary={() => dispatch({ type: 'newGame' })}
          onDismiss={() => dispatch({ type: 'dismissWin' })}
        />
      )}
      {is501 && x01Winner !== null && x01.winModalOpen && (
        <WinModal
          eyebrow="Game shot"
          title={`${sideName(x01, x01Winner)} checked out`}
          primaryLabel="Next leg"
          onPrimary={() => dispatch({ type: 'x01/nextLeg' })}
          onDismiss={() => dispatch({ type: 'x01/dismissWin' })}
        />
      )}
      {is501 && editingPlayers && (
        <X01Players
          x01={x01}
          onFormat={(format) => dispatch({ type: 'x01/setFormat', format })}
          onRename={(side, player, name) => dispatch({ type: 'x01/rename', side, player, name })}
          onClose={() => setEditingPlayers(false)}
        />
      )}
    </div>
  )
}
