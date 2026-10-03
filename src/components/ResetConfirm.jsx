// Small inline confirm anchored under the Reset button.
export default function ResetConfirm({ onConfirm, onCancel }) {
  return (
    <div
      className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-copper/60 bg-walnut p-3 shadow-2xl"
      role="alertdialog"
      aria-labelledby="reset-title"
    >
      <p id="reset-title" className="mb-3 text-center text-xl font-bold tracking-wider">
        Reset the board?
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-danger flex-1" onClick={onConfirm}>
          Reset
        </button>
        <button type="button" className="btn flex-1" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
