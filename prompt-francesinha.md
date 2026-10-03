# Prompt — Francesinha darts (browser)

Paste everything below the line into Claude. Ask it to create the project, install dependencies, and serve it on `0.0.0.0:8888`.

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

Configure Vite `server.host: true` and `server.port: 8888` in `vite.config.js` so a restart still binds `0.0.0.0:8888`. Show the LAN URL in the UI (read `window.location.host`).

## What the physical board looks like (match this)

Reference: a wall-mounted wooden abacus scoreboard on OSB.

- Light pine frame, black felt panels, vertical wood dividers between players.
- Left rail, copper/wood cut-out labels, top to bottom: **20, 19, 18, 17, 16, 15, C, D, T**.
- Each row is a wire with **exactly 3 wooden beads** per player.
- Number rows (20–15): pale beech beads.
- C row: dark walnut beads (center / bull).
- D row: pale beads (double ring).
- T row: pale beads (triple ring).
- Beads rest on the left of the wire when unmarked and slide right as marks are scored (0, 1, 2, or 3). At 3 the row is closed: beads grouped on the right, wire gets a thin brass highlight.
- Do not include 14. The reference photo has a 14 row; this game does not.
- The photo shows 3 columns. This app supports 1 to 5 columns. Columns are added and removed at runtime. With 1 player the board is a single wide column. With 5, columns shrink but stay readable. Horizontal scroll inside the board only if 5 columns cannot fit; the page itself must not scroll sideways.

Visual style: warm bar, not a generic dashboard. Pine `#c4a574`, black panel `#121212`, copper labels `#c4894a`, bead highlight, soft shadow. Labels in a condensed tracking-wide face. Keep it tactile.

## Layout (iPad friendly)

Two orientations, no page-level horizontal scroll, no hover-only controls.

**Landscape (iPad / desktop), two panes:**
- Left ~46%: the wooden scoreboard, full height.
- Right: standard dartboard (correct number order, 20 on top) plus the turn strip.

**Portrait (iPhone / iPad upright):**
- Scoreboard on top, compact but beads still visible.
- Dartboard below, at least 280px, centered.
- Turn controls sticky at the bottom with safe-area padding.

Header: title “Francesinha”, current player, darts left (3 pips), Undo, Add player, Reset. Names are editable inline (tap the name).

## Players, add, and reset

- The game **starts with exactly 1 player**, named “Player 1”.
- **Add player** appends a new column, up to a hard limit of **5**. Button label: “Add player”. Disabled, with helper text “Maximum 5 players”, when 5 are seated.
- New players join at the next visit boundary. They start at 20 with 0 marks. Default names: “Player 2” … “Player 5”. Names stay editable.
- Do not allow removing a player mid-game except via Reset. Keep the control set small.
- **Reset** wipes the match: marks, current rows, visit, undo history, and winner. It keeps the current player list and names, and returns the turn to player 1 with 3 darts. Confirm with a small inline confirm (“Reset the board?” / Reset / Cancel), not `window.confirm`.
- A separate “New game” on the win modal does the same wipe and also returns to 1 player (“Player 1”) so a fresh table starts clean.
- Persist names and player count in `localStorage`. On first load, ignore storage and start with 1 player. After the user adds players, remember them for the next visit.

Each column shows: editable name, 9 bead wires, and a small closed count (`n/9`).

## Rules (house francesinha, sequential)

This is not 501 and not Cricket scoring. It is a race to close rows in order.

Rows, in order: `20 → 19 → 18 → 17 → 16 → 15 → C → D → T`.

- A visit is 3 darts. Tap a segment to throw. After 3 darts, or after “End visit”, play passes to the next player. With 1 player, the same player starts a new visit.
- Only the **current open row** of that player accepts marks. Hits elsewhere are recorded as misses and do not move beads.
- Marks on 20–15:
  - single = 1, double = 2, triple = 3.
  - Overflow marks are discarded (no points). Closing is the only goal.
- C (center): outer bull = 1 mark, inner bull = 2 marks. Other segments miss.
- D (double): any double ring = 1 mark. Triple, single, and bull miss. Inner bull does not count as a double.
- T (triple): any triple ring = 1 mark. Everything else misses.
- A row closes at 3 marks. The next row opens immediately, including darts still left in the same visit.
- First player to close T wins. Modal: “{name} closed the francesinha”, buttons “New game” (back to 1 player) and “Keep looking”.
- Undo reverts the last dart (marks, current row, darts left, turn). Support at least 30 undos. Undo does not remove an added player.
- “Miss” is an explicit button, counts as a dart.

Show the active row with a copper outline on that player’s wire, and a caption under the board: “Target: 18 · 2 left”.

## Dartboard interaction

- SVG dartboard, regulation numbering clockwise from 20: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5.
- Segments: inner single, triple ring, outer single, double ring, outer bull (green, 25), inner bull (red, 50).
- Hit targets at least 44px where possible. On tap, brief flash on the segment and a bead slide (CSS transform, ~200ms).
- Last 3 darts of the visit listed as chips: “T20”, “S5”, “Bull”, “miss”.
- Do not require aiming precision beyond tapping the zone. No physics.

## UX details

- English UI copy.
- Big type. One-thumb reachable primary actions: Miss, End visit, Undo, Add player, Reset.
- Active column slightly warmer so the turn is obvious from across the table.
- Optional sound toggle, default off (short click on mark, lower click on miss). No autoplay.
- Win and reset confirms are designed in-page, not browser alerts.

## Code quality

- One Vite React app, functional components, no class components.
- State in a `useReducer`: players (1–5), marks per row, currentRow index, dartsLeft, visitLog, history.
- Tailwind v4 via the Vite plugin. No other CSS framework. Custom SVG for the board and beads is fine.
- Components: `Scoreboard`, `BeadWire`, `Dartboard`, `TurnBar`, `WinModal`, `ResetConfirm`.
- No placeholder lorem, no fake disabled buttons, no TODOs. Ship it playable.
- After generating, run the dev server on `0.0.0.0:8888` and print the URL to open on an iPad.

Do not add accounts, analytics, or a backend. Do not implement 501 or Cricket points. Marks only, sequential close, first to finish T wins. Start with 1 player. Never allow more than 5.
