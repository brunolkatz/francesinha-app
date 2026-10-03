// App state: one shared table of players, and one game each of
// Francesinha and 501 that both keep their progress while you switch.

import { MAX_PLAYERS, ROWS, createGame, reducer as francesinhaReducer } from './game.js'
import { createX01, reconcile, x01Reducer } from './x01.js'

export const MODES = ['francesinha', '501']

const idsOf = (game) => game.players.map((p) => p.id)

export function createState() {
  const fr = createGame()
  return { mode: MODES[0], fr, x01: createX01(idsOf(fr)) }
}

export function reducer(state, action) {
  if (action.type === 'setMode') {
    return MODES.includes(action.mode) ? { ...state, mode: action.mode } : state
  }
  if (action.type.startsWith('x01/')) {
    const x01 = x01Reducer(state.x01, action, idsOf(state.fr))
    return x01 === state.x01 ? state : { ...state, x01 }
  }

  const fr = francesinhaReducer(state.fr, action)
  if (fr === state.fr) return state
  // A fresh table reuses player ids, so 501 must start over with it.
  if (action.type === 'newGame') return { ...state, fr, x01: createX01(idsOf(fr)) }
  const ids = idsOf(fr)
  const previousIds = idsOf(state.fr)
  const seatsChanged =
    ids.length !== previousIds.length || ids.some((id, i) => id !== previousIds[i])
  return {
    ...state,
    fr,
    x01: seatsChanged ? reconcile(state.x01, ids, previousIds) : state.x01,
  }
}

const STORAGE_KEY = 'francesinha.state.v1'

const isCount = (n, max) => Number.isInteger(n) && n >= 0 && n <= max

function isValid(state) {
  const { mode, fr, x01 } = state ?? {}
  if (!MODES.includes(mode) || !fr || !x01) return false
  const { players } = fr
  if (!Array.isArray(players) || players.length < 1 || players.length > MAX_PLAYERS) {
    return false
  }
  const ids = new Set()
  for (const p of players) {
    if (!Number.isInteger(p?.id) || ids.has(p.id)) return false
    ids.add(p.id)
    if (typeof p.name !== 'string' || !p.name.trim()) return false
    if (!Array.isArray(p.marks) || p.marks.length !== ROWS.length) return false
    if (!p.marks.every((m) => isCount(m, 3))) return false
  }
  if (!Number.isInteger(fr.nextId) || players.some((p) => p.id >= fr.nextId)) return false
  if (!Array.isArray(fr.history) || !Array.isArray(x01.history)) return false
  if (fr.winner !== null && !players[fr.winner]) return false
  if (!ids.has(x01.currentId) || !Number.isInteger(x01.leg)) return false
  if (x01.winnerId !== null && !ids.has(x01.winnerId)) return false
  return players.every((p) => {
    const seat = x01.byId?.[p.id]
    return (
      seat &&
      isCount(seat.remaining, 501) &&
      Number.isInteger(seat.legs) &&
      Array.isArray(seat.visits)
    )
  })
}

// Restores the saved table, or starts a fresh one if nothing usable is stored.
export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (isValid(saved)) return saved
  } catch {
    // Storage unavailable or corrupt: fall through to a fresh table.
  }
  return createState()
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode or full storage: the game still works without persistence.
  }
}
