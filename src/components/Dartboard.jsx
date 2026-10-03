import { useState } from 'react'

const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
const WEDGE = 360 / NUMBERS.length

// Radii in viewBox units. Double and triple rings are drawn wider than
// regulation so they stay comfortable touch targets.
const R = {
  innerBull: 17,
  outerBull: 38,
  tripleInner: 78,
  tripleOuter: 110,
  doubleInner: 138,
  doubleOuter: 170,
  numbers: 185,
  edge: 200,
}

const BLACK = '#1a1a1a'
const CREAM = '#ead9b4'
const RED = '#b5372b'
const GREEN = '#1e7a46'

const point = (radius, degrees) => {
  const rad = ((degrees - 90) * Math.PI) / 180
  return [radius * Math.cos(rad), radius * Math.sin(rad)]
}

const f = (n) => n.toFixed(2)

function sector(r1, r2, a1, a2) {
  const [x1, y1] = point(r2, a1)
  const [x2, y2] = point(r2, a2)
  const [x3, y3] = point(r1, a2)
  const [x4, y4] = point(r1, a1)
  return `M${f(x1)} ${f(y1)}A${r2} ${r2} 0 0 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${r1} ${r1} 0 0 0 ${f(x4)} ${f(y4)}Z`
}

const BANDS = [
  { ring: 'S', r1: R.outerBull, r2: R.tripleInner, name: 'single' },
  { ring: 'T', r1: R.tripleInner, r2: R.tripleOuter, name: 'triple' },
  { ring: 'S', r1: R.tripleOuter, r2: R.doubleInner, name: 'single' },
  { ring: 'D', r1: R.doubleInner, r2: R.doubleOuter, name: 'double' },
]

const SEGMENTS = NUMBERS.flatMap((number, i) => {
  const a1 = i * WEDGE - WEDGE / 2
  const a2 = a1 + WEDGE
  const dark = i % 2 === 0
  return BANDS.map((band, b) => ({
    key: `${number}-${b}`,
    hit: { ring: band.ring, number },
    d: sector(band.r1, band.r2, a1, a2),
    fill: band.ring === 'S' ? (dark ? BLACK : CREAM) : dark ? RED : GREEN,
    label: `${band.name} ${number}`,
  }))
})

export default function Dartboard({ onHit, disabled }) {
  const [flash, setFlash] = useState(null)

  const tap = (hit, shape, key) => {
    if (disabled) return
    setFlash({ shape, id: (flash?.id ?? 0) + 1, key })
    onHit(hit)
  }

  return (
    <svg
      viewBox={`${-R.edge} ${-R.edge} ${R.edge * 2} ${R.edge * 2}`}
      className={`absolute inset-0 h-full w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)] ${
        disabled ? 'opacity-60' : ''
      }`}
      role="group"
      aria-label="Dartboard"
    >
      <circle r={R.edge} fill="#0d0d0d" stroke="#3a2414" strokeWidth="3" />

      {SEGMENTS.map((s) => (
        <path
          key={s.key}
          d={s.d}
          fill={s.fill}
          className="segment"
          role="button"
          aria-label={s.label}
          onClick={() => tap(s.hit, { d: s.d }, s.key)}
        />
      ))}

      <circle
        r={R.outerBull}
        fill={GREEN}
        className="segment"
        role="button"
        aria-label="outer bull"
        onClick={() => tap({ ring: 'OB' }, { r: R.outerBull, hole: R.innerBull }, 'ob')}
      />
      <circle
        r={R.innerBull}
        fill={RED}
        className="segment"
        role="button"
        aria-label="inner bull"
        onClick={() => tap({ ring: 'IB' }, { r: R.innerBull }, 'ib')}
      />

      {NUMBERS.map((number, i) => {
        const [x, y] = point(R.numbers, i * WEDGE)
        return (
          <text
            key={number}
            x={x}
            y={y}
            fill={CREAM}
            fontSize="21"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="central"
            pointerEvents="none"
          >
            {number}
          </text>
        )
      })}

      {flash &&
        (flash.shape.d ? (
          <path key={flash.id} d={flash.shape.d} className="segment-flash" />
        ) : flash.shape.hole ? (
          <circle
            key={flash.id}
            r={(flash.shape.r + flash.shape.hole) / 2}
            className="segment-flash"
            style={{
              fill: 'none',
              stroke: '#fff6dc',
              strokeWidth: flash.shape.r - flash.shape.hole,
            }}
          />
        ) : (
          <circle key={flash.id} r={flash.shape.r} className="segment-flash" />
        ))}
    </svg>
  )
}
