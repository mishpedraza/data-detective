import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

/** Counts from `from` to `to` once, or jumps straight there with reduced motion. */
export function useCount(to: number, from = 0, duration = 1100, delay = 250) {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? to : from)
  useEffect(() => {
    if (reduce) { setValue(to); return }
    let frame = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      setValue(from + (to - from) * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, from, duration, delay, reduce])
  return value
}

export function useTiming() {
  const reduce = useReducedMotion()
  return (delay = 0, duration = 0.9) => reduce ? { duration: 0 } : { delay, duration, ease }
}
