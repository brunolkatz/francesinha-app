import { MARKS_TO_CLOSE } from '../game.js'

const BEADS = [0, 1, 2]

// One wire with 3 beads. Unmarked beads rest on the left; each tap slides
// the rightmost resting bead across to the right.
export default function BeadWire({ marks, dark, label, onTap }) {
  const closed = marks >= MARKS_TO_CLOSE
  return (
    <button
      type="button"
      onClick={onTap}
      className="wire mx-2 my-[3px]"
      aria-label={`${label}: ${marks} of ${MARKS_TO_CLOSE}. Tap to ${closed ? 'clear' : 'add a mark'}`}
    >
      <span className={`wire-line ${closed ? 'wire-closed' : ''}`} />
      {BEADS.map((i) => (
        <span
          key={i}
          className={`bead ${dark ? 'bead-dark' : ''} ${
            i >= BEADS.length - marks ? 'bead-marked' : ''
          }`}
          style={{ left: `calc(${i} * var(--bead))` }}
        />
      ))}
    </button>
  )
}
