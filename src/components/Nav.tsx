import { useLayoutEffect, useRef } from 'react'
import type { Route } from '../lib/route'

export function Nav({ go }: { go: (r: Route) => void }) {
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <header className="nav" ref={ref}>
      <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); go('discover') }}>
        <span className="brand-mark" aria-hidden>
          <svg viewBox="0 0 64 64" width="24" height="24"><rect width="64" height="64" rx="14" fill="#301960" /><path d="M41.5 41.5 52 54" stroke="#ffe45b" strokeWidth="8.5" strokeLinecap="round" /><circle cx="28" cy="27" r="19.9" fill="#d6baff" stroke="#ffe45b" strokeWidth="4.4" /><circle cx="28" cy="27" r="16.6" fill="none" stroke="#361968" strokeWidth="2.2" /><text x="28" y="38" textAnchor="middle" transform="rotate(12 28 27)" fontFamily="var(--serif)" fontStyle="italic" fontWeight="600" fontSize="31" fill="#301960">?</text></svg>
        </span>
        Data Detective
      </a>
    </header>
  )
}
