// Pure game logic for Francesinha: sequential close, marks only.

export const ROWS = ['20', '19', '18', '17', '16', '15', 'C', 'D', 'T']
export const MAX_PLAYERS = 5
export const DARTS_PER_VISIT = 3
export const MARKS_TO_CLOSE = 3
const HISTORY_LIMIT = 60
const NAME_MAX = 14

export const MISS = { ring: 'MISS' }

export const defaultName = (index) => `Player ${index + 1}`

const freshPlayer = (name) => ({
  name,
  marks: ROWS.map(() => 0),
  row: 0,
})

export function createGame(names = [defaultName(0)]) {
  return {
    players: names.map(freshPlayer),
    current: 0,
    dartsLeft: DARTS_PER_VISIT,
    visitLog: [],
    lastVisit: null,
    winner: null,
    winModalOpen: false,
    history: [],
  }
}

// A hit is { ring: 'S' | 'D' | 'T' | 'OB' | 'IB' | 'MISS', number? }.
// Returns how many marks that hit is worth on the given row index.
export function marksFor(rowIndex, hit) {
  const row = ROWS[rowIndex]
  if (!row) return 0
  switch (row) {
    case 'C':
      return hit.ring === 'OB' ? 1 : hit.ring === 'IB' ? 2 : 0
    case 'D':
      return hit.ring === 'D' ? 1 : 0
    case 'T':
      return hit.ring === 'T' ? 1 : 0
    default:
      if (hit.number !== Number(row)) return 0
      return { S: 1, D: 2, T: 3 }[hit.ring] ?? 0
  }
}

export function hitLabel(hit) {
  switch (hit.ring) {
    case 'MISS':
      return 'miss'
    case 'OB':
      return 'Bull'
    case 'IB':
      return 'Bullseye'
    default:
      return `${hit.ring}${hit.number}`
  }
}

export const closedCount = (player) =>
  player.marks.filter((m) => m >= MARKS_TO_CLOSE).length

const snapshot = (state) => ({
  players: state.players.map(({ marks, row }) => ({ marks, row })),
  current: state.current,
  dartsLeft: state.dartsLeft,
  visitLog: state.visitLog,
  lastVisit: state.lastVisit,
  winner: state.winner,
})

const withHistory = (state) => ({
  ...state,
  history: [...state.history, snapshot(state)].slice(-HISTORY_LIMIT),
})

const passTurn = (state) => ({
  ...state,
  lastVisit: { player: state.current, darts: state.visitLog },
  current: (state.current + 1) % state.players.length,
  dartsLeft: DARTS_PER_VISIT,
  visitLog: [],
})

function throwDart(state, hit) {
  if (state.winner !== null) return state
  const player = state.players[state.current]
  const gain = marksFor(player.row, hit)
  const next = withHistory(state)

  if (gain > 0) {
    const marks = player.marks.slice()
    // Overflow marks are discarded: they never carry to the next row.
    marks[player.row] = Math.min(MARKS_TO_CLOSE, marks[player.row] + gain)
    const row = marks[player.row] === MARKS_TO_CLOSE ? player.row + 1 : player.row
    next.players = state.players.map((p, i) =>
      i === state.current ? { ...p, marks, row } : p,
    )
    if (row === ROWS.length) {
      next.winner = state.current
      next.winModalOpen = true
    }
  }

  next.visitLog = [...state.visitLog, { label: hitLabel(hit), scored: gain > 0 }]
  next.dartsLeft = state.dartsLeft - 1
  if (next.winner !== null) return next
  return next.dartsLeft === 0 ? passTurn(next) : next
}

function undo(state) {
  const previous = state.history.at(-1)
  if (!previous) return state
  return {
    ...state,
    ...previous,
    // Players added since the snapshot stay seated, untouched.
    players: state.players.map((p, i) =>
      previous.players[i] ? { ...p, ...previous.players[i] } : p,
    ),
    winModalOpen: false,
    history: state.history.slice(0, -1),
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'throw':
      return throwDart(state, action.hit)
    case 'endVisit':
      if (state.winner !== null) return state
      return passTurn(withHistory(state))
    case 'undo':
      return undo(state)
    case 'addPlayer':
      if (state.players.length >= MAX_PLAYERS) return state
      // Appended at the end, so the newcomer's first turn comes after the
      // visit in progress finishes.
      return {
        ...state,
        players: [...state.players, freshPlayer(defaultName(state.players.length))],
      }
    case 'rename': {
      const name =
        action.name.trim().slice(0, NAME_MAX) || defaultName(action.index)
      return {
        ...state,
        players: state.players.map((p, i) =>
          i === action.index ? { ...p, name } : p,
        ),
      }
    }
    case 'reset':
      return createGame(state.players.map((p) => p.name))
    case 'newGame':
      return createGame()
    case 'dismissWin':
      return { ...state, winModalOpen: false }
    default:
      return state
  }
}

const STORAGE_KEY = 'francesinha.players'

export function loadNames() {
  try {
    const names = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (
      Array.isArray(names) &&
      names.length >= 1 &&
      names.length <= MAX_PLAYERS &&
      names.every((n) => typeof n === 'string' && n.trim())
    ) {
      return names.map((n) => n.trim().slice(0, NAME_MAX))
    }
  } catch {
    // Storage unavailable or corrupt: fall through to a fresh table.
  }
  return undefined
}

export function saveNames(names) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
  } catch {
    // Private mode or full storage: the game still works without persistence.
  }
}
