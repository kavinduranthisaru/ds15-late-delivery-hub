/** Frame-pure animation helpers: every value is a function of the time t (seconds). */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u
  const sy = (u: number) => ((ay * u + by) * u + cy) * u
  const dsx = (u: number) => (3 * ax * u + 2 * bx) * u + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let u = x
    for (let i = 0; i < 8; i++) { const d = sx(u) - x; if (Math.abs(d) < 1e-6) break; const dd = dsx(u); if (Math.abs(dd) < 1e-6) break; u -= d / dd }
    return sy(Math.min(1, Math.max(0, u)))
  }
}
export const E_IN = bezier(0.22, 1, 0.36, 1)       // entrances
export const E_MOVE = bezier(0.65, 0, 0.35, 1)     // moves and re-orders
export const E_OUT = bezier(0.55, 0, 1, 0.45)      // exits
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** Progress 0..1 of an animation that starts at `a` and lasts `d` seconds. */
export const prog = (t: number, a: number, d: number, e = E_IN) => e(clamp((t - a) / d))

/** Entrance (fade + rise) starting at `a`, optional exit starting at `out`. */
export function vis(t: number, a: number, out = Infinity, dist = 20, d = 0.8): React.CSSProperties {
  const i = prog(t, a, d), o = prog(t, out, 0.45, E_OUT)
  return { opacity: i * (1 - o), transform: `translateY(${(1 - i) * dist + o * 8}px)` }
}
