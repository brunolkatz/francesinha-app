// 501: straight in, double out, between two sides. A side is one player
// (singles) or a pair who take alternate visits and share one score. Each
// visit (up to three darts) is entered as one total.

export const START = 501
export const MAX_VISIT = 180
export const FORMATS = ['singles', 'pairs']
const NAME_MAX = 14

// Totals no three darts can make.
const IMPOSSIBLE_VISITS = new Set([163, 166, 169, 172, 173, 175, 176, 178, 179])
// Totals of 170 or less that cannot end on a double.
const IMPOSSIBLE_CHECKOUTS = new Set([159, 162, 163, 165, 166, 168, 169])
const MAX_CHECKOUT = 170

// names[side][player]. Numbered in throwing order for pairs: 1, 2, 3, 4.
export const defaultName = (side, player) => `Player ${player * 2 + side + 1}`

export function createX01() {
  return {
    format: FORMATS[0],
    names: [0, 1].map((side) => [0, 1].map((player) => defaultName(side, player))),
    // Legs already banked; the leg in progress is counted from its visits.
    legs: [0, 0],
    // Legs completed so far. The throw-first alternates with it.
    leg: 0,
    // Visits of the leg in progress, in order: { side, player, score, bust }.
    visits: [],
    winModalOpen: false,
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

const sideVisits = (state, side) => state.visits.filter((v) => v.side === side)

export const remainingOf = (state, side) =>
  START - sideVisits(state, side).reduce((sum, v) => sum + v.score, 0)

// The side that has checked out this leg, or null while it is still open.
export function winnerOf(state) {
  const side = [0, 1].find((s) => remainingOf(state, s) === 0)
  return side ?? null
}

// Legs won including the one just finished, before it is banked.
export const legsOf = (state, side) =>
  state.legs[side] + (winnerOf(state) === side ? 1 : 0)

export function averageOf(state, side) {
  const visits = sideVisits(state, side)
  if (visits.length === 0) return 0
  return visits.reduce((sum, v) => sum + v.score, 0) / visits.length
}

// Who throws next. Sides alternate every visit; in pairs the two partners
// alternate every time their side comes up. Who starts rotates each leg.
export function throwerOf(state) {
  const n = state.visits.length
  return {
    side: (state.leg + n) % 2,
    player:
      state.format === 'pairs'
        ? (Math.floor(n / 2) + Math.floor(state.leg / 2)) % 2
        : 0,
  }
}

export const playerName = (state, side, player) => state.names[side][player]

export const sideName = (state, side) =>
  state.format === 'pairs' ? state.names[side].join(' & ') : state.names[side][0]

// The leg's visits with the score each one left, oldest first.
export function visitLog(state) {
  const left = [START, START]
  return state.visits.map((v, index) => {
    left[v.side] -= v.score
    return { ...v, number: index + 1, remaining: left[v.side] }
  })
}

// A bust scores nothing, so the remaining score stays where the visit started.
function visit(state, value, bust) {
  if (winnerOf(state) !== null) return state
  const { side, player } = throwerOf(state)
  const remaining = remainingOf(state, side)
  if (!bust && visitError(remaining, value)) return state
  const busted = bust || isBust(remaining, value)
  const score = busted ? 0 : value
  return {
    ...state,
    visits: [...state.visits, { side, player, score, bust: busted }],
    winModalOpen: remaining - score === 0,
  }
}

export function x01Reducer(state, action) {
  switch (action.type) {
    case 'x01/score':
      return visit(state, action.value, false)
    case 'x01/bust':
      return visit(state, 0, true)
    case 'x01/undo':
      if (state.visits.length === 0) return state
      return { ...state, visits: state.visits.slice(0, -1), winModalOpen: false }
    case 'x01/nextLeg': {
      const winner = winnerOf(state)
      if (winner === null) return state
      return {
        ...state,
        legs: state.legs.map((n, side) => n + (side === winner ? 1 : 0)),
        leg: state.leg + 1,
        visits: [],
        winModalOpen: false,
      }
    }
    case 'x01/reset':
      return { ...createX01(), format: state.format, names: state.names }
    case 'x01/dismissWin':
      return { ...state, winModalOpen: false }
    case 'x01/setFormat':
      if (!FORMATS.includes(action.format) || action.format === state.format) return state
      return { ...state, format: action.format }
    case 'x01/rename': {
      const { side, player } = action
      if (state.names[side]?.[player] === undefined) return state
      const name = action.name.trim().slice(0, NAME_MAX) || defaultName(side, player)
      return {
        ...state,
        names: state.names.map((pair, s) =>
          pair.map((old, p) => (s === side && p === player ? name : old)),
        ),
      }
    }
    default:
      return state
  }
}
