// 501: straight in, double out. Each visit (up to three darts) is entered
// as one total and subtracted from the player's remaining score.

export const START = 501
export const MAX_VISIT = 180
const HISTORY_LIMIT = 60

// Totals no three darts can make.
const IMPOSSIBLE_VISITS = new Set([163, 166, 169, 172, 173, 175, 176, 178, 179])
// Totals of 170 or less that cannot end on a double.
const IMPOSSIBLE_CHECKOUTS = new Set([159, 162, 163, 165, 166, 168, 169])
const MAX_CHECKOUT = 170

const freshPlayer = (legs = 0) => ({ remaining: START, visits: [], legs })

export function createX01(ids) {
  return {
    byId: Object.fromEntries(ids.map((id) => [id, freshPlayer()])),
    currentId: ids[0],
    // Legs played so far; the throw-first rotates with it.
    leg: 0,
    winnerId: null,
    winModalOpen: false,
    history: [],
  }
}

// Why a visit total cannot be entered, or null if it can.
export function visitError(remaining, value) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_VISIT) {
    return `A visit scores 0 to ${MAX_VISIT}`
  }
  if (IMPOSSIBLE_VISITS.has(value)) {
    return `${value} cannot be scored with three darts`
  }
  if (value === remaining && (value > MAX_CHECKOUT || IMPOSSIBLE_CHECKOUTS.has(value))) {
    return `${value} cannot be finished on a double`
  }
  return null
}

// Going below zero, or leaving exactly 1, is a bust: no double can finish it.
export const isBust = (remaining, value) =>
  remaining - value < 0 || remaining - value === 1

export function average(player) {
  if (player.visits.length === 0) return 0
  const total = player.visits.reduce((sum, v) => sum + v.score, 0)
  return total / player.visits.length
}

const withHistory = (state) => ({
  ...state,
  history: [
    ...state.history,
    { byId: state.byId, currentId: state.currentId, winnerId: state.winnerId },
  ].slice(-HISTORY_LIMIT),
})

const nextId = (ids, id) => ids[(ids.indexOf(id) + 1) % ids.length]

// Records a visit for the current player and passes the turn. A bust
// scores nothing and leaves the remaining score where the visit started.
function visit(state, ids, value, bust) {
  if (state.winnerId !== null) return state
  const player = state.byId[state.currentId]
  if (!player) return state
  if (!bust && visitError(player.remaining, value)) return state

  const busted = bust || isBust(player.remaining, value)
  const score = busted ? 0 : value
  const remaining = player.remaining - score
  const won = remaining === 0
  const next = withHistory(state)
  next.byId = {
    ...state.byId,
    [state.currentId]: {
      ...player,
      remaining,
      visits: [...player.visits, { score, bust: busted }],
      legs: player.legs + (won ? 1 : 0),
    },
  }
  if (won) {
    next.winnerId = state.currentId
    next.winModalOpen = true
  } else {
    next.currentId = nextId(ids, state.currentId)
  }
  return next
}

// Keeps the match in step with the table: seats new players at 501, drops
// removed ones, and hands the turn on if the player throwing just left.
export function reconcile(state, ids, previousIds = ids) {
  const byId = Object.fromEntries(
    ids.map((id) => [id, state.byId[id] ?? freshPlayer()]),
  )
  let { currentId, winnerId } = state
  if (!ids.includes(currentId)) {
    const from = previousIds.indexOf(currentId)
    currentId = previousIds.slice(from + 1).find((id) => ids.includes(id)) ?? ids[0]
  }
  if (!ids.includes(winnerId)) winnerId = null
  return { ...state, byId, currentId, winnerId, winModalOpen: state.winModalOpen && winnerId !== null }
}

export function x01Reducer(state, action, ids) {
  switch (action.type) {
    case 'x01/score':
      return visit(state, ids, action.value, false)
    case 'x01/bust':
      return visit(state, ids, 0, true)
    case 'x01/undo': {
      const previous = state.history.at(-1)
      if (!previous) return state
      return reconcile(
        { ...state, ...previous, winModalOpen: false, history: state.history.slice(0, -1) },
        ids,
      )
    }
    case 'x01/nextLeg': {
      const leg = state.leg + 1
      return {
        ...state,
        byId: Object.fromEntries(
          ids.map((id) => [id, freshPlayer(state.byId[id]?.legs)]),
        ),
        currentId: ids[leg % ids.length],
        leg,
        winnerId: null,
        winModalOpen: false,
        history: [],
      }
    }
    case 'x01/reset':
      return createX01(ids)
    case 'x01/dismissWin':
      return { ...state, winModalOpen: false }
    default:
      return state
  }
}
