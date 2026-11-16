import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface PickerOption {
  value: string
  label: string
  hint?: string
}

interface Props {
  value: string
  options: PickerOption[]
  onChange: (v: string) => void
  tone?: 'a' | 'b' | 'plain'
  display?: string
  label: string
}

export function InlinePicker({ value, options, onChange, tone = 'plain', display, label }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  const current = options.find((o) => o.value === value)
  return (
    <span className={`picker tone-${tone}`} ref={ref}>
      <button type="button" className="picker-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${current?.label}`} onClick={() => setOpen((o) => !o)}>
        {display ?? current?.label}
        <svg className="caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="picker-menu"
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={o.value === value ? 'selected' : ''}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                >
                  <span>{o.label}</span>
                  {o.hint && <small>{o.hint}</small>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </span>
  )
}
