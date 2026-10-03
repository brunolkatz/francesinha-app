let ctx

// Short click on a mark, lower click on a miss. Only ever called from a tap.
export function playClick(low) {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = low ? 170 : 880
    gain.gain.setValueAtTime(0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.09)
  } catch {
    // No audio available: stay silent.
  }
}
