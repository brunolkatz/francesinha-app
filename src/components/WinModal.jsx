export default function WinModal({ eyebrow, title, primaryLabel, onPrimary, onDismiss }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-title"
    >
      <div className="wood w-full max-w-md rounded-2xl p-3">
        <div className="felt flex flex-col items-center gap-6 rounded-xl px-6 py-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-copper">
            {eyebrow}
          </p>
          <h2 id="win-title" className="text-4xl font-extrabold leading-tight tracking-wide text-brass">
            {title}
          </h2>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button type="button" className="btn btn-primary min-h-14 flex-1 text-xl" onClick={onPrimary}>
              {primaryLabel}
            </button>
            <button type="button" className="btn min-h-14 flex-1 text-xl" onClick={onDismiss}>
              Keep looking
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
