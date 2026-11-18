import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Nav } from './components/Nav'
import { Discover } from './pages/Discover'
import { editorialQuestionById, DEFAULT_INVESTIGATION } from './data/editorial'
import { EditorialInvestigation } from './pages/EditorialInvestigation'
import { Investigate } from './pages/Investigate'
import { SurgeryWaits } from './pages/SurgeryWaits'
import { Explore } from './pages/Explore'
import { hrefFor, type Route } from './lib/route'

function parse(): { route: Route; params: URLSearchParams } {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [path, q] = h.split('?')
  const route = (['investigate', 'explore'].includes(path) ? path : 'discover') as Route
  return { route, params: new URLSearchParams(q ?? '') }
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const [{ route, params }, setState] = useState(parse)
  useEffect(() => {
    const on = () => setState(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const navigate = useCallback((href: string) => {
    window.location.hash = href.replace(/^#/, '')
    window.scrollTo({ top: 0, behavior: href.startsWith('#/discover') || reduceMotion ? 'instant' : 'smooth' })
  }, [reduceMotion])
  const investigationId = params.get('r') ?? DEFAULT_INVESTIGATION
  const entry = editorialQuestionById(investigationId)
  return (
    <>
      <Nav route={route} go={(r) => navigate(hrefFor(r))} />
      <AnimatePresence mode="wait">
        <motion.main key={route} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}>
          {route === 'discover' && <Discover navigate={navigate} selected={params.get('q')} />}
          {route === 'investigate' && (
            entry?.status === 'research' ? <EditorialInvestigation key={entry.id} id={entry.id} /> :
              investigationId === 'surgery-waits' ? <SurgeryWaits /> :
                <Investigate key={investigationId} params={params} relationshipId={entry?.relationship ?? investigationId} />
          )}
          {route === 'explore' && <Explore navigate={navigate} />}
        </motion.main>
      </AnimatePresence>
      <footer className="footer">
        <p>
          Data Detective is a prototype. Figures come from official statistics and cited research. Sources are linked in each investigation. No simulated data is used.
        </p>
        <p>
          <a href="https://app.devin.ai/sessions/8f5abb24434b448fbfe89dd972b66385" target="_blank" rel="noreferrer">Request changes</a>
        </p>
      </footer>
    </>
  )
}
