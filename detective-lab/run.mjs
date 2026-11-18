import { parseArgs } from 'node:util'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { reviewBrowser } from './browser.mjs'
import { reviewResearch } from './research.mjs'
import { reviewEditorial } from './editorial.mjs'
import { recommendations, renderReport } from './report.mjs'

const repo = fileURLToPath(new URL('../', import.meta.url))
const { values } = parseArgs({ options: {
  url: { type: 'string' }, ai: { type: 'boolean' }, research: { type: 'boolean' },
  'self-test': { type: 'boolean' }, 'allow-untrusted-tls': { type: 'boolean' }, help: { type: 'boolean' },
} })
if (values.help) {
  console.log('npm run detective:review -- [--url https://site] [--research] [--ai] [--self-test] [--allow-untrusted-tls]')
  process.exit(0)
}
if (values['self-test'] && values.url) throw new Error('--self-test requires the local dev server')

const output = path.join(repo, 'detective-lab', 'runs', new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid)
await mkdir(output, { recursive: true })
const executablePath = process.env.DETECTIVE_CHROMIUM_PATH || undefined
let base
let server
let runs = []
let faultTests = []
let browserFailure
try {
  if (values.url) {
    base = new URL(values.url)
    if (base.protocol !== 'https:' || base.username || base.password) throw new Error('--url needs an HTTPS site without credentials')
  } else {
    server = await createServer({
      root: repo, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
      logLevel: 'error',
    })
    await server.listen()
    base = new URL(`http://127.0.0.1:${server.httpServer.address().port}/`)
  }
  runs = await reviewBrowser({ base, output, executablePath, allowUntrustedTls: values['allow-untrusted-tls'] })
  if (values['self-test']) {
    for (const [fault, expected] of [
      ['score', 'The displayed score differs'], ['feedback', 'Missing or incorrect answer feedback'], ['navigation', 'Next action did not work'],
    ]) {
      const mutated = await reviewBrowser({ base, output: path.join(output, 'self-test', fault), executablePath, fault })
      faultTests.push({ fault, detected: mutated.length === 2 && mutated.every(({ checks }) =>
        checks.some(({ status, detail }) => status === 'FAIL' && detail.startsWith(expected))) })
    }
  }
} catch (error) {
  browserFailure = error.message.split('\n').find((line) => line.trim())
} finally {
  await server?.close()
}
const research = await reviewResearch({ external: values.research })
const editorial = await reviewEditorial({ enabled: values.ai, apiKey: process.env.OPENAI_API_KEY,
  model: process.env.DETECTIVE_MODEL || 'gpt-4.1-mini', runs, research, output })
const priority = recommendations({ runs, research, editorial })
const report = { generatedAt: new Date().toISOString(), base: base?.href, mode: values.url ? (values['allow-untrusted-tls'] ? 'read-only URL, browser TLS validation disabled' : 'read-only URL') : 'local',
  runs, faultTests, browserFailure, research, editorial, priority }
await writeFile(path.join(output, 'report.md'), renderReport(report))
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(`Report: ${path.relative(repo, path.join(output, 'report.md'))}`)
console.log(`Research gate: ${research.gate}. Editorial evaluation: ${editorial.status}.`)
for (const [index, item] of priority.entries()) console.log(`${index + 1}. ${item.problem}`)
if (browserFailure || runs.some(({ checks }) => checks.some(({ status }) => status === 'FAIL')) ||
  faultTests.some(({ detected }) => !detected) || research.gate === 'BLOCKED') process.exitCode = 1
