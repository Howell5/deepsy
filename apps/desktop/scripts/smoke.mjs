/** Boot the packaged macOS backend in Electron without opening a user window. */
import { app, net, utilityProcess } from 'electron'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

if (process.platform !== 'darwin') throw new Error('The packaged desktop smoke currently supports macOS only')
const root = mkdtempSync(join(tmpdir(), 'deepsy-packaged-smoke-'))
const workspace = join(root, 'workspace')
mkdirSync(workspace)
app.setPath('userData', join(root, 'electron'))
const cli = resolve(import.meta.dirname, '../dist/release', process.arch === 'arm64' ? 'mac-arm64' : 'mac',
  'deepsy.app/Contents/Resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js')
let backend
let output = ''
let errors = ''
let checking = false
let passed = false

function finish() {
  clearTimeout(deadline)
  if (!passed) console.error(errors.replace(/token=[^\s]+/g, 'token=[redacted]'))
  rmSync(root, { recursive: true, force: true })
  app.exit(passed ? 0 : 1)
}

const deadline = setTimeout(() => {
  errors += '\nPackaged backend readiness timed out'
  if (backend) backend.kill()
  else finish()
}, 90_000)

app.whenReady().then(() => {
  backend = utilityProcess.fork(cli, ['web', '--port', '0', '--no-open'], {
    cwd: workspace,
    stdio: 'pipe',
    env: { ...process.env, DSH_HOME: join(root, 'home'), DSH_CWD: workspace, DSH_DESKTOP: '1', DSH_TELEMETRY_DISABLED: '1' },
  })
  backend.on('exit', finish)
  backend.stderr.on('data', chunk => { errors = (errors + String(chunk)).slice(-8000) })
  backend.stdout.on('data', async chunk => {
    output = (output + String(chunk)).slice(-8000)
    const ready = /dsh web: (http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+)\s/.exec(output)
    if (checking || !ready) return
    checking = true
    try {
      const response = await net.fetch(ready[1], { credentials: 'include', signal: AbortSignal.timeout(10_000) })
      const html = await response.text()
      if (!response.ok || !html.includes('<html')) throw new Error(`Packaged startup HTTP ${response.status}`)
      console.log('Packaged Electron Utility Process: authenticated Web startup passed')
      passed = true
    } catch (error) {
      errors += String(error)
    } finally {
      backend.kill()
    }
  })
}).catch(error => {
  errors += String(error)
  if (backend) backend.kill()
  else finish()
})
