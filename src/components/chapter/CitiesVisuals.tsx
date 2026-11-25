import { useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { BIKE_CITIES, CITY_WAGES, COOLING, FREEFARE, HEIGHT, PEDESTRIAN, ROADS, TOURISM } from '../../data/cities'
import { useTiming } from './motion'

const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

/** Horizontal bars centred on zero, for increases and decreases. */
function Diverging({ rows, max, unit, label, temperature }: {
  rows: readonly { label: string; value: number; text?: string; strong?: boolean }[]
  max: number; unit: string; label: string; temperature?: boolean
}) {
  const t = useTiming()
  return (
    <ul className={temperature ? 'v-ct-div is-temperature' : 'v-ct-div'} aria-label={label}>
      {rows.map(({ label: name, value, text, strong }, i) => {
        const width = `${(Math.abs(value) / max) * 50}%`
        return (
          <li key={name} className={strong ? 'is-strong' : undefined}>
            <span>{name}</span>
            <span className="v-ct-axis">
              <motion.i
                className={value < 0 ? 'is-down' : 'is-up'}
                initial={{ width: 0 }} animate={{ width }} transition={t(0.2 + i * 0.15, 0.7)}
              />
            </span>
            <strong>{text ?? `${sign(value)}${unit}`}</strong>
          </li>
        )
      })}
    </ul>
  )
}

const ARROW = { up: '↑', down: '↓', none: '–' } as const
const EFFECT = { up: 'More', down: 'Less', none: 'No clear change' } as const

/** Q1: what changed on pedestrianized streets compared with similar streets. */
function PedestrianVisual() {
  const t = useTiming()
  return (
    <div className="v-ct-ped">
      <div className="v-ct-street" aria-hidden="true">
        {['', 'is-closed', '', 'is-closed', '', ''].map((tone, i) => (
          <motion.i key={i} className={tone} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t(0.1 + i * 0.08, 0.4)} />
        ))}
      </div>
      <ul className="v-ct-effects" aria-label="Pedestrianized streets compared with similar streets">
        {PEDESTRIAN.map(({ id, label, effect }) => (
          <li key={id} data-effect={effect}>
            <b aria-hidden="true">{ARROW[effect]}</b>
            <span>{label}</span>
            <small>{EFFECT[effect]}</small>
          </li>
        ))}
      </ul>
      <p className="v-note">Barcelona, 2014–2022, against matched streets that kept their traffic. The study reports directions, not sizes; the street is illustrative.</p>
    </div>
  )
}

/** Q2: trips at the free-fare age threshold. */
function FreeFareVisual() {
  return (
    <div>
      <p className="v-kicker">Change in trips once free fares apply</p>
      <Diverging unit="%" max={12} label="Change in trips at the free-fare age" rows={[
        { label: 'Public transport', value: FREEFARE.transit, strong: true },
        { label: 'Walking', value: FREEFARE.walking },
        { label: 'Car', value: FREEFARE.car, text: 'No significant change' },
      ]} />
      <p className="v-note">Older adults in seven Brazilian metro areas. Relative changes from the 2025 open preprint; transit trips also became {FREEFARE.transitShorter}% shorter.</p>
    </div>
  )
}

/** Q3: carbon per person falls with height, then levels off. Shape is illustrative. */
function HeightVisual() {
  const t = useTiming()
  const towers = [1, 2, 3, 4.5, 6, 8, 10]
  return (
    <div className="v-ct-height">
      <svg viewBox="0 0 320 170" role="img" aria-label={`Illustration: carbon per person falls as buildings get taller, then levels off above ${HEIGHT.plateauLow}–${HEIGHT.plateauHigh} metres.`}>
        <rect className="v-ct-band" x="120" y="10" width="60" height="120" />
        <text className="v-ct-band-label" x="150" y="24" textAnchor="middle">{HEIGHT.plateauLow}–{HEIGHT.plateauHigh} m</text>
        <motion.path
          d="M20 30 C 70 60, 110 100, 150 108 S 260 112, 300 110"
          fill="none" className="v-ct-curve"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.2, 1.1)}
        />
        <line x1="20" y1="130" x2="300" y2="130" className="v-ct-base" />
        <text x="20" y="150" className="v-ct-axis-label">Lower</text>
        <text x="300" y="150" className="v-ct-axis-label" textAnchor="end">Taller</text>
        <text x="20" y="166" className="v-ct-axis-label">Building height →</text>
      </svg>
      <div className="v-ct-towers" aria-hidden="true">
        {towers.map((h, i) => <motion.i key={i} initial={{ height: 0 }} animate={{ height: `${h * 0.42}rem` }} transition={t(0.15 + i * 0.08, 0.5)} />)}
      </div>
      <p className="v-note">Line: carbon per person, including construction, operation, transport and consumer goods. Illustrative shape; only the {HEIGHT.plateauLow}–{HEIGHT.plateauHigh} m range (about {HEIGHT.storeysLow}–{HEIGHT.storeysHigh} storeys) comes from the Hong Kong study.</p>
    </div>
  )
}

/** Q4: regional traffic and travel time six years after a typical widening. */
function RoadsVisual() {
  const flow = ROADS.capacity * ROADS.flowElasticity
  const time = -ROADS.capacity * ROADS.timeElasticity
  return (
    <div>
      <p className="v-kicker">A region gains {ROADS.capacity}% more road capacity. Six years later:</p>
      <Diverging unit="%" max={12} label="Regional change six years after a widening" rows={[
        { label: 'Road capacity', value: ROADS.capacity },
        { label: 'Traffic volume', value: flow },
        { label: 'Travel time', value: time, strong: true },
      ]} />
      <div className="v-ct-facts">
        <p><strong>{ROADS.lanesBefore} → {ROADS.lanesAfter}</strong> lanes on one example road</p>
        <p><strong>{ROADS.peakTime}%</strong> peak travel time there</p>
        <p><strong>{ROADS.years}+ years</strong> the gains lasted, as far as the study runs</p>
      </div>
      <p className="v-note">Implied by the study’s regional elasticities (traffic +0.5, travel time −0.7) for the average 10% capacity gain. Volume, congestion and journey time are separate measures.</p>
    </div>
  )
}

/** Q5: three cities, three different measures. */
function BikeLanesVisual() {
  const [city, setCity] = useState<string>(BIKE_CITIES[0].id)
  const row = BIKE_CITIES.find(({ id }) => id === city) ?? BIKE_CITIES[0]
  return (
    <div className="v-ct-bikes">
      <div className="v-toggle" role="group" aria-label="City">
        {BIKE_CITIES.map(({ id, city: name }) => <button key={id} type="button" aria-pressed={city === id} onClick={() => setCity(id)}>{name}</button>)}
      </div>
      <motion.section key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
        <p className="v-kicker">{row.what}</p>
        <p className="v-ct-big">{row.stat}</p>
        <p>{row.statLabel}</p>
        <p className="v-ct-also">{row.also}</p>
      </motion.section>
      <p className="v-note">Each city measured something different: local speed (Bogotá, Berlin) or traffic and congestion across a network (Paris). Paris’s changes went well beyond bike lanes.</p>
    </div>
  )
}

/** Q6: the city's share of the wage gap between cities. */
function CityWageVisual() {
  const t = useTiming()
  return (
    <div className="v-ct-wage">
      <div className="v-ct-scale" role="img" aria-label={`The city itself explains ${CITY_WAGES.low}% to ${CITY_WAGES.high}% of wage differences between cities, depending on the country.`}>
        <motion.i className="is-low" initial={{ width: 0 }} animate={{ width: `${CITY_WAGES.low}%` }} transition={t(0.2, 0.7)} />
        <motion.i className="is-range" initial={{ width: 0 }} animate={{ width: `${CITY_WAGES.high - CITY_WAGES.low}%` }} transition={t(0.8, 0.5)} />
      </div>
      <div className="v-ct-scale-key"><span>0%</span><span>{CITY_WAGES.low}%</span><span>{CITY_WAGES.high}%</span><span>100%</span></div>
      <ul className="v-hs-key">
        <li><i /> The city itself, at least {CITY_WAGES.low}%</li>
        <li><i className="is-soft" /> Up to {CITY_WAGES.high}%, depending on the country</li>
        <li><i className="is-blank" /> The rest: who lives there</li>
      </ul>
      <p className="v-note">Share of within-country pay differences between cities. {CITY_WAGES.workers} million workers in {CITY_WAGES.countries} countries. Pay, not purchasing power.</p>
    </div>
  )
}

/** Q7: try each intervention on a modelled hot day in London. */
function CoolingVisual() {
  const t = useTiming()
  const [on, setOn] = useState<string>(COOLING[0].id)
  const row = COOLING.find(({ id }) => id === on) ?? COOLING[0]
  const fill = Math.max(0, Math.min(1, (row.change + 1.4) / 1.8))
  return (
    <div className="v-ct-cool">
      <div className="v-toggle" role="group" aria-label="Intervention">
        {COOLING.map(({ id, label }) => <button key={id} type="button" aria-pressed={on === id} onClick={() => setOn(id)}>{label}</button>)}
      </div>
      <div className="v-ct-thermo" aria-live="polite">
        <span className="v-ct-tube" aria-hidden="true"><motion.i animate={{ height: `${fill * 100}%` }} transition={t(0, 0.5)} style={{ '--warm': fill } as CSSProperties} /></span>
        <p><span className="v-ct-big">{row.change === 0 ? '≈0' : sign(row.change)}°C</span>{row.label}</p>
      </div>
      <Diverging temperature unit="°C" max={1.4} label="Modelled change in London's average air temperature" rows={COOLING.map(({ label, change, id }) => ({
        label, value: change, strong: id === on, text: change === 0 ? '≈0°C' : undefined,
      }))} />
      <p className="v-note">Model of Greater London’s average air temperature 2 m above ground on two hot days in 2018. It doesn’t measure shade or how hot it feels.</p>
    </div>
  )
}

/** Q8: three outcomes, three answers. */
function TourismVisual() {
  const rows = [
    { measure: 'Income per person', where: 'Municipalities', result: `${TOURISM.low}–${TOURISM.high}% lower in ${TOURISM.year}`, effect: 'down' },
    { measure: 'Total jobs and wages', where: 'Regions', result: 'Tourism jobs up, manufacturing down, no net gain', effect: 'none' },
    { measure: 'GDP growth', where: 'Provinces', result: 'Higher, fading where tourism is most intense', effect: 'up' },
  ] as const
  return (
    <div className="v-ct-tour">
      <p className="v-ct-big">−{TOURISM.low}–{TOURISM.high}%</p>
      <p>income per person in Spanish towns with median tourism growth</p>
      <ul className="v-ct-effects" aria-label="Tourism and three economic outcomes in Spain">
        {rows.map(({ measure, where, result, effect }) => (
          <li key={measure} data-effect={effect}>
            <b aria-hidden="true">{ARROW[effect]}</b>
            <span>{measure} <small>({where})</small></span>
            <small>{result}</small>
          </li>
        ))}
      </ul>
      <p className="v-note">Three studies of Spain measuring different outcomes at different scales. None says every resident got poorer.</p>
    </div>
  )
}

export function CitiesVisual({ question }: { question: ChapterQuestion }) {
  switch (question.visual) {
    case 'pedestrian': return <PedestrianVisual />
    case 'freefare': return <FreeFareVisual />
    case 'height': return <HeightVisual />
    case 'roads': return <RoadsVisual />
    case 'bikelanes': return <BikeLanesVisual />
    case 'citywage': return <CityWageVisual />
    case 'cooling': return <CoolingVisual />
    case 'tourism': return <TourismVisual />
    default: return null
  }
}
