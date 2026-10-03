import test from 'node:test'
import assert from 'node:assert/strict'
import { createState, reducer } from './store.js'
import {
  averageOf,
  legsOf,
  remainingOf,
  sideName,
  throwerOf,
  visitError,
  visitLog,
  winnerOf,
} from './x01.js'

const score = (value) => ({ type: 'x01/score', value })
const play = (state, ...actions) => actions.reduce(reducer, state)
const pairs = () => reducer(createState(), { type: 'x01/setFormat', format: 'pairs' })
// Side 0 scores 180, 180 and is left on 141 with the throw.
const onCheckout = (state) => play(state, score(180), score(0), score(180), score(0))

test('two sides start on 501 and visits are subtracted in turn', () => {
  const g = play(createState(), score(60), score(100)).x01
  assert.equal(remainingOf(g, 0), 441)
  assert.equal(remainingOf(g, 1), 401)
  assert.deepEqual(throwerOf(g), { side: 0, player: 0 })
})

test('impossible visit totals are rejected', () => {
  assert.ok(visitError(501, 181))
  assert.ok(visitError(501, 179))
  assert.ok(visitError(501, -1))
  assert.ok(visitError(501, 2.5))
  assert.equal(visitError(501, 180), null)
  assert.equal(visitError(501, 0), null)
  const g = createState()
  assert.equal(reducer(g, score(179)), g)
})

test('going below zero or leaving 1 is a bust: score stays, turn passes', () => {
  let g = play(onCheckout(createState()), score(101), score(0))
  assert.equal(remainingOf(g.x01, 0), 40)
  g = reducer(g, score(60))
  assert.equal(remainingOf(g.x01, 0), 40)
  assert.deepEqual(g.x01.visits.at(-1), { side: 0, player: 0, score: 0, bust: true })
  assert.equal(throwerOf(g.x01).side, 1)
  g = play(g, score(0), score(39))
  assert.equal(remainingOf(g.x01, 0), 40)
  assert.equal(g.x01.visits.at(-1).bust, true)
})

test('an explicit bust scores nothing and passes the turn', () => {
  const g = reducer(createState(), { type: 'x01/bust' }).x01
  assert.equal(remainingOf(g, 0), 501)
  assert.equal(throwerOf(g).side, 1)
})

test('checking out wins the leg; totals with no double finish are refused', () => {
  let g = onCheckout(createState())
  assert.equal(remainingOf(g.x01, 0), 141)
  g = reducer(g, score(141))
  assert.equal(winnerOf(g.x01), 0)
  assert.equal(g.x01.winModalOpen, true)
  assert.equal(legsOf(g.x01, 0), 1)
  assert.equal(legsOf(g.x01, 1), 0)
  assert.equal(reducer(g, score(20)), g)

  assert.ok(visitError(169, 169))
  assert.ok(visitError(159, 159))
  assert.equal(visitError(170, 170), null)
  assert.equal(visitError(300, 159), null)
})

test('next leg banks the leg, clears the visits and swaps who throws first', () => {
  let g = createState()
  assert.equal(reducer(g, { type: 'x01/nextLeg' }), g)
  g = play(onCheckout(g), score(141), { type: 'x01/nextLeg' })
  assert.deepEqual(g.x01.legs, [1, 0])
  assert.equal(g.x01.leg, 1)
  assert.equal(remainingOf(g.x01, 0), 501)
  assert.equal(winnerOf(g.x01), null)
  assert.equal(throwerOf(g.x01).side, 1)
  const reset = reducer(g, { type: 'x01/reset' }).x01
  assert.deepEqual(reset.legs, [0, 0])
  assert.equal(throwerOf(reset).side, 0)
})

test('undo removes the last visit, including a winning one', () => {
  let g = play(createState(), score(60), { type: 'x01/undo' })
  assert.equal(remainingOf(g.x01, 0), 501)
  assert.equal(throwerOf(g.x01).side, 0)
  assert.equal(reducer(g, { type: 'x01/undo' }), g)

  g = play(onCheckout(g), score(141), { type: 'x01/undo' })
  assert.equal(winnerOf(g.x01), null)
  assert.equal(g.x01.winModalOpen, false)
  assert.equal(remainingOf(g.x01, 0), 141)
  assert.equal(legsOf(g.x01, 0), 0)
})

test('average counts busts as zero', () => {
  const g = play(createState(), score(60), score(0), score(100), score(0), { type: 'x01/bust' }).x01
  assert.equal(averageOf(g, 0, 0), 160 / 3)
  assert.equal(averageOf(g, 1, 0), 0)
  assert.equal(averageOf(createState().x01, 0, 0), 0)
})

test('a player average runs across legs until the match is reset', () => {
  // Leg 1: side 0 scores 180, 180, 141 (avg 167); side 1 scores 0, 0.
  let g = play(onCheckout(createState()), score(141))
  assert.equal(averageOf(g.x01, 0, 0), 167)
  g = reducer(g, { type: 'x01/nextLeg' })
  assert.equal(averageOf(g.x01, 0, 0), 167)
  // Leg 2 starts with side 1: 60 for them, then 33 for side 0.
  g = play(g, score(60), score(33))
  assert.equal(averageOf(g.x01, 0, 0), (501 + 33) / 4)
  assert.equal(averageOf(g.x01, 1, 0), 60 / 3)
  g = reducer(g, { type: 'x01/undo' })
  assert.equal(averageOf(g.x01, 0, 0), 167)
  g = reducer(g, { type: 'x01/reset' })
  assert.equal(averageOf(g.x01, 0, 0), 0)
})

test('in pairs each partner has their own average', () => {
  const g = play(pairs(), score(100), score(10), score(40), score(20), score(60)).x01
  assert.equal(averageOf(g, 0, 0), 80)
  assert.equal(averageOf(g, 0, 1), 40)
  assert.equal(averageOf(g, 1, 0), 10)
  assert.equal(averageOf(g, 1, 1), 20)
})

test('pairs share a score and the four players throw in rotation', () => {
  let g = pairs()
  const order = []
  for (let i = 0; i < 8; i++) {
    const { side, player } = throwerOf(g.x01)
    order.push(g.x01.names[side][player])
    g = reducer(g, score(20))
  }
  assert.deepEqual(order, [
    'Player 1', 'Player 2', 'Player 3', 'Player 4',
    'Player 1', 'Player 2', 'Player 3', 'Player 4',
  ])
  assert.equal(remainingOf(g.x01, 0), 421)
  assert.equal(remainingOf(g.x01, 1), 421)
  assert.equal(sideName(g.x01, 0), 'Player 1 & Player 3')
  assert.equal(sideName(createState().x01, 0), 'Player 1')
})

test('in pairs the starting player rotates through all four over the legs', () => {
  let g = pairs()
  const starters = []
  for (let leg = 0; leg < 4; leg++) {
    const { side, player } = throwerOf(g.x01)
    starters.push(g.x01.names[side][player])
    // The starting side throws 180, 180, 141 to win the leg.
    g = play(g, score(180), score(0), score(180), score(0), score(141), { type: 'x01/nextLeg' })
  }
  assert.deepEqual(starters, ['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  assert.deepEqual(g.x01.legs, [2, 2])
})

test('the visit log numbers each visit and tracks what it left', () => {
  const log = visitLog(play(createState(), score(60), score(100), { type: 'x01/bust' }).x01)
  assert.deepEqual(
    log.map(({ number, side, score, bust, remaining }) => [number, side, score, bust, remaining]),
    [
      [1, 0, 60, false, 441],
      [2, 1, 100, false, 401],
      [3, 0, 0, true, 441],
    ],
  )
})

test('names can be set per player and fall back to the default', () => {
  let g = play(
    createState(),
    { type: 'x01/rename', side: 1, player: 0, name: '  Zé  ' },
    { type: 'x01/rename', side: 0, player: 1, name: 'Ana' },
  )
  assert.deepEqual(g.x01.names, [['Player 1', 'Ana'], ['Zé', 'Player 4']])
  g = reducer(g, { type: 'x01/rename', side: 1, player: 0, name: '   ' })
  assert.equal(g.x01.names[1][0], 'Player 2')
  assert.equal(reducer(g, { type: 'x01/rename', side: 2, player: 0, name: 'x' }), g)
  const reset = reducer(g, { type: 'x01/reset' })
  assert.equal(reset.x01.names[0][1], 'Ana')
})

test('the two games are independent', () => {
  let g = play(
    createState(),
    { type: 'addPlayer' },
    { type: 'addPlayer' },
    { type: 'tap', player: 0, row: 0 },
    { type: 'setMode', mode: '501' },
    score(100),
  )
  assert.equal(g.mode, '501')
  assert.equal(g.fr.players.length, 3)
  g = play(g, { type: 'reset' }, { type: 'newGame' })
  assert.equal(g.fr.players.length, 1)
  assert.equal(remainingOf(g.x01, 0), 401)
  g = play(g, { type: 'tap', player: 0, row: 0 }, { type: 'x01/reset' })
  assert.equal(remainingOf(g.x01, 0), 501)
  assert.equal(g.fr.players[0].marks[0], 1)
  assert.equal(reducer(g, { type: 'setMode', mode: 'cricket' }), g)
})

test('state survives a JSON round trip', () => {
  const g = play(pairs(), { type: 'tap', player: 0, row: 3 }, { type: 'setMode', mode: '501' }, score(140))
  const restored = JSON.parse(JSON.stringify(g))
  assert.deepEqual(restored, g)
  assert.equal(remainingOf(reducer(restored, score(26)).x01, 1), 475)
})
