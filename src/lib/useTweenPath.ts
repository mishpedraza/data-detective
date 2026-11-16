import { useEffect, useRef, useState } from 'react'
import { interpolatePath } from 'd3-interpolate-path'
import { easeCubicInOut } from 'd3'

export function useTweenPath(d: string, duration = 750) {
  const [current, setCurrent] = useState(d)
  const prev = useRef(d)
  useEffect(() => {
    const from = prev.current
    if (from === d || !from || !d || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      prev.current = d
      setCurrent(d)
      return
    }
    const interp = interpolatePath(from, d)
    if (/Z/i.test(from + d) || interp(0.5).includes('NaN')) {
      prev.current = d
      setCurrent(d)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const s = interp(easeCubicInOut(t))
      prev.current = s
      setCurrent(s)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [d, duration])
  return current
}
