// App state: a game of Francesinha and a game of 501, each with its own
// players, that both keep their progress while you switch between them.

import { MAX_PLAYERS, ROWS, createGame, reducer as francesinhaReducer } from './game.js'
import { FORMATS, MAX_VISIT, createX01, remainingOf, x01Reducer } from './x01.js'

export const MODES = ['francesinha', '501']

export function createState() {
  return { mode: MODES[0], fr: createGame(), x01: createX01() }
}

export function reducer(state, action) {
  if (action.type === 'setMode') {
    return MODES.includes(action.mode) ? { ...state, mode: action.mode } : state
  }
  if (action.type.startsWith('x01/')) {
    const x01 = x01Reducer(state.x01, action)
    return x01 === state.x01 ? state : { ...state, x01 }
  }
  const fr = francesinhaReducer(state.fr, action)
  return fr === state.fr ? state : { ...state, fr }
}

const STORAGE_KEY = 'francesinha.state.v2'

const isCount = (n, max = Infinity) => Number.isInteger(n) && n >= 0 && n <= max
const isName = (name) => typeof name === 'string' && name.trim() !== ''
const isSide = (n) => n === 0 || n === 1

function isValidFrancesinha(fr) {
  const players = fr?.players
  if (!Array.isArray(players) || players.length < 1 || players.length > MAX_PLAYERS) {
    return false
  }
  const ids = new Set()
  for (const p of players) {
    if (!Number.isInteger(p?.id) || ids.has(p.id)) return false
    ids.add(p.id)
    if (!isName(p.name)) return false
    if (!Array.isArray(p.marks) || p.marks.length !== ROWS.length) return false
    if (!p.marks.every((m) => isCount(m, 3))) return false
  }
  if (!Number.isInteger(fr.nextId) || players.some((p) => p.id >= fr.nextId)) return false
  if (!Array.isArray(fr.history)) return false
  return fr.winner === null || Boolean(players[fr.winner])
}

function isValidX01(x01) {
  if (!FORMATS.includes(x01?.format)) return false
  const { names, legs, visits } = x01
  if (!Array.isArray(names) || names.length !== 2) return false
  if (!names.every((pair) => Array.isArray(pair) && pair.length === 2 && pair.every(isName))) {
    return false
  }
  if (!Array.isArray(legs) || legs.length !== 2 || !legs.every((n) => isCount(n))) return false
  if (!isCount(x01.leg) || !Array.isArray(visits)) return false
  const visitsOk = visits.every(
    (v) => isSide(v?.side) && isSide(v.player) && isCount(v.score, MAX_VISIT) && typeof v.bust === 'boolean',
  )
  return visitsOk && [0, 1].every((side) => remainingOf(x01, side) >= 0)
}

// Restores the saved games, or starts fresh if nothing usable is stored.
export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (MODES.includes(saved?.mode) && isValidFrancesinha(saved.fr) && isValidX01(saved.x01)) {
      return saved
    }
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
