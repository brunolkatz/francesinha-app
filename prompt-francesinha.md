# Prompt — Francesinha (dardos) no browser

Cole tudo abaixo no Claude. Peça para ele criar o projeto completo, instalar e subir em `0.0.0.0:8888`.

---

Build a local browser game called **Francesinha**, a Brazilian bar darts modality. Stack: Vite + React + Tailwind CSS. No backend. Single page, touch-first, works on iPad Safari and desktop.

Run it so other devices on the LAN can open it:

```bash
npm create vite@latest francesinha -- --template react
cd francesinha
npm install
npm install -D tailwindcss @tailwindcss/vite
npm run dev -- --host 0.0.0.0 --port 8888
```

Configure Vite `server.host: true` and `server.port: 8888` in `vite.config.js` so a restart still binds `0.0.0.0:8888`. Print the LAN URL in the UI (read `window.location.host`).

## What the physical board looks like (match this)

Reference: a wall-mounted wooden abacus scoreboard on OSB.

- Light pine frame, black felt panels, vertical wood dividers.
- Left rail, copper/wood cut-out labels, top to bottom, large and vertical-reading but rendered horizontal in the app: **20, 19, 18, 17, 16, 15, C, D, T**.
- Three player columns. Each row is a wire with **exactly 3 wooden beads**.
- Number rows (20–15): pale beech beads.
- C row: dark walnut beads (center / bull).
- D row: mixed pale beads (double ring).
- T row: mixed pale beads (triple ring).
- Beads rest on the left of the wire when unmarked and slide right as marks are scored (0, 1, 2, or 3). At 3 the row is closed: beads grouped on the right, wire gets a thin brass highlight.
- Do not include 14. The photo has a 14 row; this game does not.

Visual style: warm bar, not a generic dashboard. Pine `#c4a574`, black panel `#121212`, copper labels `#b co 8733` → use `#c4894a`, bead highlight, soft shadow. Labels in a condensed tracking-wide face. Keep it tactile.

## Layout (iPad friendly)

Two orientations, no horizontal scroll, no hover-only controls.

**Landscape (iPad / desktop), two panes:**
- Left ~42%: the wooden scoreboard, full height.
- Right: standard dartboard (correct number order, 20 on top) plus the turn strip.

**Portrait (iPhone / iPad upright):**
- Scoreboard on top, compact but beads still tappable.
- Dartboard below, at least 280px, centered.
- Turn controls sticky at the bottom with safe-area padding.

Header: title “Francesinha”, current player, darts left (3 pips), Undo, New game. Names are editable inline.

Players: 2 or 3. Default 2. Each column: name, mark beads, and a small “fechados” count (n/9).

## Rules (house francesinha, sequential)

This is not 501 and not Cricket scoring. It is a race to close rows in order.

Rows, in order: `20 → 19 → 18 → 17 → 16 → 15 → C → D → T`.

- A visit is 3 darts. Tap a segment to throw. After 3 darts, or after “Encerrar vez”, play passes to the next player.
- Only the **current open row** of that player accepts marks. Hits elsewhere are recorded as misses and do not move beads.
- Marks on 20–15:
  - single = 1, double = 2, triple = 3.
  - Overflow marks are discarded (no points). Closing is the only goal.
- C (center): outer bull = 1 mark, inner bull = 2 marks. Other segments miss.
- D (double): any double ring = 1 mark. Triple, single, and bull miss. Inner bull does not count as a double.
- T (triple): any triple ring = 1 mark. Everything else misses.
- A row closes at 3 marks. The next row opens immediately, including darts still left in the same visit.
- First player to close T wins. Modal: “Fulano fechou a francesinha”, buttons Jogar de novo / Continuar olhando.
- Undo reverts the last dart (marks, current row, darts left, turn). Support at least 30 undos.
- Miss / fora do alvo is an explicit button, counts as a dart.

Show the active row on the board with a copper outline on that player’s wire, and a caption under the board: “Alvo: 18 · falta 2”.

## Dartboard interaction

- SVG dartboard, regulation numbering clockwise from 20: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5.
- Segments: inner single, triple ring, outer single, double ring, outer bull (green, 25), inner bull (red, 50).
- Hit targets at least 44px where possible. On tap, brief flash on the segment and a bead slide (CSS transform, ~200ms).
- Last 3 darts of the visit listed as chips: “T20”, “S5”, “Bull”, “fora”.
- Do not require aiming precision beyond tapping the zone. No physics.

## UX details

- Portuguese (Brazil) UI copy.
- Big type. One-thumb reachable primary actions.
- Color of the active column slightly warmer so the iPad user sees whose turn it is from across the table.
- New game asks player count and names, remembers last names in localStorage.
- Optional sound toggle, default off (short click on mark, lower click on miss). No autoplay.
- Empty, loading, and win states are designed, not browser alerts.

## Code quality

- One Vite React app, functional components, no class components.
- State in a small reducer or `useReducer`: players, marks[row], currentRow index, dartsLeft, visitLog, history.
- Tailwind v4 via the Vite plugin. No CSS framework besides Tailwind. Custom SVG for board and beads is fine.
- Components suggested: `Scoreboard`, `BeadWire`, `Dartboard`, `TurnBar`, `WinModal`, `SetupScreen`.
- No placeholder lorem, no fake disabled buttons, no “TODO”. Ship playable.
- After generating, run the dev server on `0.0.0.0:8888` and tell me the URL to open on the iPad.

Do not add accounts, analytics, or a backend. Do not implement 501 or Cricket points. Marks only, sequential close, first to finish T wins.
