import { useEffect, useReducer, useState } from 'react'
import Scoreboard from './components/Scoreboard.jsx'
import X01Board from './components/X01Board.jsx'
import X01Players from './components/X01Players.jsx'
import WinModal from './components/WinModal.jsx'
import ResetConfirm from './components/ResetConfirm.jsx'
import { MAX_PLAYERS } from './game.js'
import { MODES, loadState, reducer, saveState } from './store.js'
import { playClick } from './sound.js'
import { sideName, winnerOf } from './x01.js'

const MODE_LABELS = { francesinha: 'Francesinha', 501: '501' }

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [sound, setSound] = useState(false)
  const [editingPlayers, setEditingPlayers] = useState(false)

  // Every change is saved, so a reload or a closed tab resumes both games.
  useEffect(() => {
    saveState(state)
  }, [state])

  const { mode, fr, x01 } = state
  const { players } = fr
  const is501 = mode === '501'
  const full = players.length >= MAX_PLAYERS
  const canUndo = (is501 ? x01.visits : fr.history).length > 0

  const rename = (index, name) => dispatch({ type: 'rename', index, name })
  const remove = (index) => dispatch({ type: 'removePlayer', index })

  const tap = (player, row) => {
    if (sound) playClick(false)
    dispatch({ type: 'tap', player, row })
  }

  const x01Winner = winnerOf(x01)

  return (
    <div className="flex h-dvh min-h-[440px] flex-col">
      <header className="px-safe flex flex-wrap items-center gap-x-4 gap-y-2 pb-1 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <h1 className="text-3xl font-extrabold uppercase tracking-[0.2em] text-copper">
          Francesinha
        </h1>

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
            onClick={() => dispatch({ type: is501 ? 'x01/undo' : 'undo' })}
            disabled={!canUndo}
          >
            Undo
          </button>
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
      </header>

      <main className="px-safe min-h-0 flex-1 pt-2 portrait:overflow-y-auto">
        {is501 ? (
          <X01Board
            x01={x01}
            onScore={(value, bust) => {
              if (sound) playClick(bust)
              dispatch({ type: 'x01/score', value })
            }}
            onBust={() => {
              if (sound) playClick(true)
              dispatch({ type: 'x01/bust' })
            }}
            onNextLeg={() => dispatch({ type: 'x01/nextLeg' })}
            onRename={(side, player, name) => dispatch({ type: 'x01/rename', side, player, name })}
          />
        ) : (
          <Scoreboard players={players} onRename={rename} onTap={tap} onRemove={remove} />
        )}
      </main>

      <p className="pb-safe px-3 pt-2 text-center text-sm tracking-widest text-cream/45">
        {is501 ? `501 ${x01.format} · straight in, double out` : 'Tap a wire to add a mark'} · Join on this network:{' '}
        <span className="select-text text-cream/70">{window.location.origin}{window.location.pathname.replace(/\/$/, '')}</span>
      </p>

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
