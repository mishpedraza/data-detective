import type { ReactNode } from 'react'

export function InvestigationStory({ evidence, explanation, exploration, research }: {
  evidence: ReactNode
  explanation: ReactNode
  exploration: ReactNode
  research: ReactNode
}) {
  return (
    <>
      <div className="investigation-story">
        <section aria-label="Evidence">{evidence}</section>
        <section aria-label="Explanation">{explanation}</section>
      </div>
      <section className="investigation-further" aria-labelledby="investigation-further-title">
        <h2 id="investigation-further-title">Explore further</h2>
        <details>
          <summary>Explore the data</summary>
          <div className="investigation-further-content">{exploration}</div>
        </details>
        <details>
          <summary>Research, methods and limitations</summary>
          <div className="investigation-further-content">{research}</div>
        </details>
      </section>
    </>
  )
}
