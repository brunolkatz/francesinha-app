import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, reducer, marksFor, ROWS, MISS } from './game.js'

const hit = (ring, number) => ({ type: 'throw', hit: { ring, number } })
const play = (state, ...actions) => actions.reduce(reducer, state)

test('starts with one player on 20 with 3 darts', () => {
  const g = createGame()
  assert.equal(g.players.length, 1)
  assert.equal(g.players[0].name, 'Player 1')
  assert.equal(g.players[0].row, 0)
  assert.equal(g.dartsLeft, 3)
})

test('marks per row type', () => {
  assert.equal(marksFor(0, { ring: 'S', number: 20 }), 1)
  assert.equal(marksFor(0, { ring: 'D', number: 20 }), 2)
  assert.equal(marksFor(0, { ring: 'T', number: 20 }), 3)
  assert.equal(marksFor(0, { ring: 'T', number: 19 }), 0)
  const c = ROWS.indexOf('C')
  assert.equal(marksFor(c, { ring: 'OB' }), 1)
  assert.equal(marksFor(c, { ring: 'IB' }), 2)
  assert.equal(marksFor(c, { ring: 'S', number: 20 }), 0)
  const d = ROWS.indexOf('D')
  assert.equal(marksFor(d, { ring: 'D', number: 3 }), 1)
  assert.equal(marksFor(d, { ring: 'IB' }), 0)
  assert.equal(marksFor(d, { ring: 'T', number: 3 }), 0)
  const t = ROWS.indexOf('T')
  assert.equal(marksFor(t, { ring: 'T', number: 7 }), 1)
  assert.equal(marksFor(t, { ring: 'D', number: 7 }), 0)
})

test('only the open row accepts marks; elsewhere is a miss that uses a dart', () => {
  const g = play(createGame(), hit('T', 19))
  assert.deepEqual(g.players[0].marks, [0, 0, 0, 0, 0, 0, 0, 0, 0])
  assert.equal(g.dartsLeft, 2)
  assert.deepEqual(g.visitLog, [{ label: 'T19', scored: false }])
})

test('overflow is discarded and the next row opens within the same visit', () => {
  const g = play(createGame(), hit('D', 20), hit('T', 20), hit('S', 19))
  const p = g.players[0]
  assert.equal(p.marks[0], 3)
  assert.equal(p.marks[1], 1)
  assert.equal(p.row, 1)
})

test('turn passes after 3 darts or End visit; solo player restarts', () => {
  let g = play(createGame(), { type: 'addPlayer' })
  g = play(g, { type: 'throw', hit: MISS }, { type: 'endVisit' })
  assert.equal(g.current, 1)
  assert.equal(g.dartsLeft, 3)
  g = play(g, hit('S', 1), hit('S', 1), hit('S', 1))
  assert.equal(g.current, 0)

  const solo = play(createGame(), hit('S', 1), hit('S', 1), hit('S', 1))
  assert.equal(solo.current, 0)
  assert.equal(solo.dartsLeft, 3)
  assert.deepEqual(solo.visitLog, [])
})

test('max 5 players', () => {
  let g = createGame()
  for (let i = 0; i < 8; i++) g = reducer(g, { type: 'addPlayer' })
  assert.equal(g.players.length, 5)
  assert.equal(g.players[4].name, 'Player 5')
})

const fullRun = [
  ...[20, 19, 18, 17, 16, 15].map((n) => hit('T', n)),
  hit('IB'),
  hit('OB'),
  hit('D', 4),
  hit('D', 9),
  hit('D', 1),
  hit('T', 2),
  hit('T', 5),
  hit('T', 11),
]

test('closing T wins and freezes play; undo reopens it', () => {
  let g = play(createGame(), ...fullRun)
  assert.equal(g.winner, 0)
  assert.equal(g.winModalOpen, true)
  const frozen = play(g, hit('S', 20), { type: 'endVisit' })
  assert.equal(frozen, g)
  g = reducer(g, { type: 'undo' })
  assert.equal(g.winner, null)
  assert.equal(g.players[0].marks[8], 2)
})

test('undo reverts dart, row and turn, and keeps added players', () => {
  let g = play(createGame(), hit('T', 20), hit('S', 5), hit('S', 5))
  assert.equal(g.visitLog.length, 0)
  g = reducer(g, { type: 'addPlayer' })
  g = reducer(g, { type: 'undo' })
  assert.equal(g.players.length, 2)
  assert.equal(g.dartsLeft, 1)
  assert.equal(g.visitLog.length, 2)
  g = play(g, { type: 'undo' }, { type: 'undo' })
  assert.equal(g.players[0].row, 0)
  assert.equal(g.players[0].marks[0], 0)
  assert.equal(g.dartsLeft, 3)
  assert.equal(reducer(g, { type: 'undo' }), g)
})

test('supports at least 30 undos', () => {
  let g = createGame()
  for (let i = 0; i < 40; i++) g = reducer(g, { type: 'throw', hit: MISS })
  assert.ok(g.history.length >= 30)
})

test('reset keeps names and seats; new game returns to one player', () => {
  let g = play(
    createGame(),
    { type: 'addPlayer' },
    { type: 'rename', index: 1, name: '  Zé  ' },
    hit('T', 20),
  )
  const reset = reducer(g, { type: 'reset' })
  assert.deepEqual(reset.players.map((p) => p.name), ['Player 1', 'Zé'])
  assert.equal(reset.players[0].row, 0)
  assert.equal(reset.history.length, 0)
  assert.equal(reset.current, 0)
  const fresh = reducer(g, { type: 'newGame' })
  assert.deepEqual(fresh.players.map((p) => p.name), ['Player 1'])
})

test('blank rename falls back to the default name', () => {
  const g = reducer(createGame(), { type: 'rename', index: 0, name: '   ' })
  assert.equal(g.players[0].name, 'Player 1')
})
