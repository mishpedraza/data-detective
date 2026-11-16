import type { Route } from '../lib/route'

export function Nav({ route, go }: { route: Route; go: (r: Route) => void }) {
  const items: { id: Route; label: string }[] = [
    { id: 'discover', label: 'Discover' },
    { id: 'investigate', label: 'Investigate' },
    { id: 'explore', label: 'Explore' },
  ]
  return (
    <header className="nav">
      <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); go('discover') }}>
        <span className="brand-mark" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M15 15l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M6.5 11.5l2.2-2.4 2 1.6 2.6-3.2" fill="none" stroke="var(--b)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        Data Detective
      </a>
      <nav aria-label="Main">
        {items.map((it) => (
          <a key={it.id} href={`#/${it.id}`} className={route === it.id ? 'active' : ''} aria-current={route === it.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go(it.id) }}>
            {it.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
