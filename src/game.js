// Francesinha scoreboard state: a manual abacus. Every wire is tapped by
// hand, one mark at a time, so any house variant can be played on it.

export const ROWS = ['20', '19', '18', '17', '16', '15', '14', 'C', 'D', 'T']
export const MAX_PLAYERS = 5
export const MARKS_TO_CLOSE = 3
const HISTORY_LIMIT = 60
const NAME_MAX = 14

export const defaultName = (index) => `Player ${index + 1}`

// Ids are stable for the life of a table, so undo history still lines up
// after a player is removed from the middle.
const freshPlayer = (name, id) => ({
  id,
  name,
  marks: ROWS.map(() => 0),
})

export function createGame(names = [defaultName(0)]) {
  return {
    players: names.map(freshPlayer),
    nextId: names.length,
    // Index of the player whose win modal is showing, or null.
    winner: null,
    history: [],
  }
}

// First "Player N" nobody at the table is using, so a seat freed by a
// removal does not produce two players with the same default name.
function unusedName(players) {
  const taken = new Set(players.map((p) => p.name))
  let index = 0
  while (taken.has(defaultName(index))) index++
  return defaultName(index)
}

export const closedCount = (player) =>
  player.marks.filter((m) => m >= MARKS_TO_CLOSE).length

const boardClosed = (player) => closedCount(player) === ROWS.length

// One tap is always exactly one mark. Tapping a closed wire clears it, so
// a wrong tap can also be fixed without Undo.
function tap(state, playerIndex, rowIndex) {
  const player = state.players[playerIndex]
  if (!player || rowIndex < 0 || rowIndex >= ROWS.length) return state
  const marks = player.marks.slice()
  marks[rowIndex] = (marks[rowIndex] + 1) % (MARKS_TO_CLOSE + 1)
  const updated = { ...player, marks }
  return {
    ...state,
    players: state.players.map((p, i) => (i === playerIndex ? updated : p)),
    winner: boardClosed(updated) ? playerIndex : null,
    history: [
      ...state.history,
      state.players.map((p) => ({ id: p.id, marks: p.marks })),
    ].slice(-HISTORY_LIMIT),
  }
}

function undo(state) {
  const previous = state.history.at(-1)
  if (!previous) return state
  return {
    ...state,
    // Players added since the snapshot stay seated, untouched, and
    // removed players stay removed.
    players: state.players.map((p) => {
      const saved = previous.find((entry) => entry.id === p.id)
      return saved ? { ...p, marks: saved.marks } : p
    }),
    winner: null,
    history: state.history.slice(0, -1),
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'tap':
      return tap(state, action.player, action.row)
    case 'undo':
      return undo(state)
    case 'addPlayer':
      if (state.players.length >= MAX_PLAYERS) return state
      return {
        ...state,
        players: [...state.players, freshPlayer(unusedName(state.players), state.nextId)],
        nextId: state.nextId + 1,
      }
    case 'removePlayer':
      // The table never goes below one player.
      if (state.players.length <= 1 || !state.players[action.index]) return state
      return {
        ...state,
        players: state.players.filter((_, i) => i !== action.index),
        winner: null,
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
      return { ...state, winner: null }
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
