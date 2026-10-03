import test from 'node:test'
import assert from 'node:assert/strict'
import { createState, reducer } from './store.js'
import { average, visitError } from './x01.js'

const score = (value) => ({ type: 'x01/score', value })
const play = (state, ...actions) => actions.reduce(reducer, state)
const seat = (state, index) => state.x01.byId[state.fr.players[index].id]
const two = () => play(createState(), { type: 'addPlayer' })

test('everyone starts on 501 and visits are subtracted in turn', () => {
  const g = play(two(), score(60), score(100))
  assert.equal(seat(g, 0).remaining, 441)
  assert.equal(seat(g, 1).remaining, 401)
  assert.equal(g.x01.currentId, g.fr.players[0].id)
})

test('impossible visit totals are rejected', () => {
  assert.ok(visitError(501, 181))
  assert.ok(visitError(501, 179))
  assert.ok(visitError(501, -1))
  assert.ok(visitError(501, 2.5))
  assert.equal(visitError(501, 180), null)
  assert.equal(visitError(501, 0), null)
  const g = two()
  assert.equal(reducer(g, score(179)), g)
})

test('going below zero or leaving 1 is a bust: score stays, turn passes', () => {
  // 501 - 180 - 180 - 101 = 40 for player 1; player 2 throws 0 in between.
  let g = play(two(), score(180), score(0), score(180), score(0), score(101), score(0))
  assert.equal(seat(g, 0).remaining, 40)
  g = reducer(g, score(60))
  assert.equal(seat(g, 0).remaining, 40)
  assert.deepEqual(seat(g, 0).visits.at(-1), { score: 0, bust: true })
  assert.equal(g.x01.currentId, g.fr.players[1].id)
  g = play(g, score(0), score(39))
  assert.equal(seat(g, 0).remaining, 40)
  assert.equal(seat(g, 0).visits.at(-1).bust, true)
})

test('an explicit bust records nothing and passes the turn', () => {
  const g = play(two(), { type: 'x01/bust' })
  assert.equal(seat(g, 0).remaining, 501)
  assert.equal(g.x01.currentId, g.fr.players[1].id)
})

test('checking out wins the leg; totals with no double finish are refused', () => {
  let g = play(two(), score(180), score(0), score(180), score(0))
  assert.equal(seat(g, 0).remaining, 141)
  g = reducer(g, score(141))
  assert.equal(g.x01.winnerId, g.fr.players[0].id)
  assert.equal(g.x01.winModalOpen, true)
  assert.equal(seat(g, 0).legs, 1)
  assert.equal(reducer(g, score(20)), g)

  assert.ok(visitError(169, 169))
  assert.ok(visitError(159, 159))
  assert.equal(visitError(170, 170), null)
  assert.equal(visitError(300, 159), null)
})

test('next leg keeps legs won, resets scores and rotates the throw', () => {
  let g = play(two(), score(180), score(0), score(180), score(0), score(141))
  g = reducer(g, { type: 'x01/nextLeg' })
  assert.equal(seat(g, 0).remaining, 501)
  assert.equal(seat(g, 0).legs, 1)
  assert.equal(g.x01.winnerId, null)
  assert.equal(g.x01.currentId, g.fr.players[1].id)
  const reset = reducer(g, { type: 'x01/reset' })
  assert.equal(seat(reset, 0).legs, 0)
  assert.equal(reset.x01.currentId, reset.fr.players[0].id)
})

test('undo reverts the last visit, including a win', () => {
  let g = play(two(), score(60))
  g = reducer(g, { type: 'x01/undo' })
  assert.equal(seat(g, 0).remaining, 501)
  assert.equal(g.x01.currentId, g.fr.players[0].id)
  assert.equal(reducer(g, { type: 'x01/undo' }), g)

  g = play(g, score(180), score(0), score(180), score(0), score(141), { type: 'x01/undo' })
  assert.equal(g.x01.winnerId, null)
  assert.equal(seat(g, 0).remaining, 141)
  assert.equal(seat(g, 0).legs, 0)
})

test('three-dart average counts busts as zero', () => {
  assert.equal(average({ visits: [] }), 0)
  assert.equal(
    average({ visits: [{ score: 60 }, { score: 100 }, { score: 0, bust: true }] }),
    160 / 3,
  )
})

test('players are shared: adding seats at 501, removing passes the turn on', () => {
  let g = play(two(), { type: 'addPlayer' }, score(60), score(45))
  assert.equal(g.x01.currentId, g.fr.players[2].id)
  const third = g.fr.players[2].id
  g = reducer(g, { type: 'removePlayer', index: 2 })
  assert.equal(g.x01.byId[third], undefined)
  assert.equal(g.x01.currentId, g.fr.players[0].id)
  g = reducer(g, { type: 'addPlayer' })
  assert.equal(seat(g, 2).remaining, 501)
  assert.equal(seat(g, 0).remaining, 441)
})

test('undo after a removal does not bring the removed seat back', () => {
  let g = play(two(), score(60), score(45), { type: 'removePlayer', index: 1 })
  g = reducer(g, { type: 'x01/undo' })
  assert.deepEqual(Object.keys(g.x01.byId), [String(g.fr.players[0].id)])
  assert.equal(g.x01.currentId, g.fr.players[0].id)
})

test('each game keeps its own progress when switching modes', () => {
  let g = play(two(), { type: 'tap', player: 0, row: 0 }, { type: 'setMode', mode: '501' }, score(100))
  assert.equal(g.mode, '501')
  assert.equal(g.fr.players[0].marks[0], 1)
  g = play(g, { type: 'reset' })
  assert.equal(g.fr.players[0].marks[0], 0)
  assert.equal(seat(g, 0).remaining, 401)
  g = play(g, { type: 'setMode', mode: 'francesinha' }, { type: 'x01/reset' })
  assert.equal(seat(g, 0).remaining, 501)
  assert.equal(reducer(g, { type: 'setMode', mode: 'cricket' }), g)
})

test('a new table restarts 501 with a single player', () => {
  const g = play(two(), score(100), { type: 'newGame' })
  assert.equal(g.fr.players.length, 1)
  assert.equal(seat(g, 0).remaining, 501)
  assert.equal(Object.keys(g.x01.byId).length, 1)
})

test('state survives a JSON round trip', () => {
  const g = play(two(), { type: 'tap', player: 1, row: 3 }, { type: 'setMode', mode: '501' }, score(140))
  const restored = JSON.parse(JSON.stringify(g))
  assert.deepEqual(restored, g)
  const next = reducer(restored, score(26))
  assert.equal(seat(next, 1).remaining, 475)
})
