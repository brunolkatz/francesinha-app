import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, reducer, ROWS } from './game.js'

const tap = (player, row) => ({ type: 'tap', player, row })
const play = (state, ...actions) => actions.reduce(reducer, state)

test('starts with one player and an empty board', () => {
  const g = createGame()
  assert.equal(g.players.length, 1)
  assert.equal(g.players[0].name, 'Player 1')
  assert.deepEqual(ROWS, ['20', '19', '18', '17', '16', '15', '14', 'C', 'D', 'T'])
  assert.deepEqual(g.players[0].marks, ROWS.map(() => 0))
})

test('a tap is exactly one mark on that wire, any row, any player', () => {
  const g = play(createGame(), { type: 'addPlayer' }, tap(1, 7), tap(0, 3), tap(1, 7))
  assert.equal(g.players[1].marks[7], 2)
  assert.equal(g.players[0].marks[3], 1)
  assert.equal(g.players[0].marks[7], 0)
})

test('tapping a closed wire clears it', () => {
  let g = play(createGame(), tap(0, 0), tap(0, 0), tap(0, 0))
  assert.equal(g.players[0].marks[0], 3)
  g = reducer(g, tap(0, 0))
  assert.equal(g.players[0].marks[0], 0)
})

test('out-of-range taps are ignored', () => {
  const g = createGame()
  assert.equal(reducer(g, tap(3, 0)), g)
  assert.equal(reducer(g, tap(0, ROWS.length)), g)
})

test('max 5 players', () => {
  let g = createGame()
  for (let i = 0; i < 8; i++) g = reducer(g, { type: 'addPlayer' })
  assert.equal(g.players.length, 5)
  assert.equal(g.players[4].name, 'Player 5')
})

const closeBoard = ROWS.flatMap((_, row) => [tap(0, row), tap(0, row), tap(0, row)])

test('closing every wire announces the winner; dismiss and undo clear it', () => {
  const almost = play(createGame(), ...closeBoard.slice(0, -1))
  assert.equal(almost.winner, null)
  const won = reducer(almost, closeBoard.at(-1))
  assert.equal(won.winner, 0)
  assert.equal(reducer(won, { type: 'dismissWin' }).winner, null)
  const undone = reducer(won, { type: 'undo' })
  assert.equal(undone.winner, null)
  assert.equal(undone.players[0].marks[ROWS.length - 1], 2)
})

test('undo reverts taps one at a time and keeps added players', () => {
  let g = play(createGame(), tap(0, 0), tap(0, 1), { type: 'addPlayer' })
  g = reducer(g, { type: 'undo' })
  assert.equal(g.players.length, 2)
  assert.deepEqual(g.players[0].marks.slice(0, 2), [1, 0])
  g = reducer(g, { type: 'undo' })
  assert.equal(g.players[0].marks[0], 0)
  assert.equal(reducer(g, { type: 'undo' }), g)
})

test('supports at least 30 undos', () => {
  let g = createGame()
  for (let i = 0; i < 40; i++) g = reducer(g, tap(0, i % ROWS.length))
  assert.ok(g.history.length >= 30)
})

test('reset keeps names and seats; new game returns to one player', () => {
  const g = play(
    createGame(),
    { type: 'addPlayer' },
    { type: 'rename', index: 1, name: '  Zé  ' },
    tap(0, 0),
  )
  const reset = reducer(g, { type: 'reset' })
  assert.deepEqual(reset.players.map((p) => p.name), ['Player 1', 'Zé'])
  assert.equal(reset.players[0].marks[0], 0)
  assert.equal(reset.history.length, 0)
  const fresh = reducer(g, { type: 'newGame' })
  assert.deepEqual(fresh.players.map((p) => p.name), ['Player 1'])
})

test('blank rename falls back to the default name', () => {
  const g = reducer(createGame(), { type: 'rename', index: 0, name: '   ' })
  assert.equal(g.players[0].name, 'Player 1')
})

test('removing a player keeps the others and never empties the table', () => {
  let g = play(
    createGame(),
    { type: 'addPlayer' },
    { type: 'addPlayer' },
    tap(0, 0),
    tap(1, 1),
    tap(2, 2),
    { type: 'removePlayer', index: 1 },
  )
  assert.deepEqual(g.players.map((p) => p.name), ['Player 1', 'Player 3'])
  assert.equal(g.players[1].marks[2], 1)
  g = play(g, { type: 'removePlayer', index: 0 })
  assert.equal(g.players.length, 1)
  assert.equal(reducer(g, { type: 'removePlayer', index: 0 }), g)
})

test('undo after a removal restores the right players and skips the removed one', () => {
  let g = play(
    createGame(),
    { type: 'addPlayer' },
    { type: 'addPlayer' },
    tap(1, 1),
    tap(2, 2),
    { type: 'removePlayer', index: 1 },
  )
  g = reducer(g, { type: 'undo' })
  assert.equal(g.players.length, 2)
  assert.equal(g.players[1].name, 'Player 3')
  assert.equal(g.players[1].marks[2], 0)
})

test('a new player after a removal gets an unused default name', () => {
  const g = play(
    createGame(),
    { type: 'addPlayer' },
    { type: 'addPlayer' },
    { type: 'removePlayer', index: 1 },
    { type: 'addPlayer' },
  )
  assert.deepEqual(g.players.map((p) => p.name), ['Player 1', 'Player 3', 'Player 2'])
  assert.equal(new Set(g.players.map((p) => p.id)).size, 3)
})
