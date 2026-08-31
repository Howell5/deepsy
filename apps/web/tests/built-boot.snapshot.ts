// @vitest-environment jsdom
// The built-bundle boot smoke: the assembled-jsdom test that owns the boot
// graph itself. Other files share the same scaffolding (assembled-boot.ts) to
// reach a surface only the built bundles expose; this one asserts that the
// graph assembles at all — staged activation across the immediately tier and
// the inject layers, per-plugin CSS injection, and a rendered journey reaching
// chat content from the keyless FixtureApiClient transport.
//
// Component behavior remains owned by per-package suites (SlotTestRuntime
// benches over src). This smoke additionally pins the resident interaction
// fixture's cross-plugin projection because only the built connection/runtime/
// workspace graph can prove that transport-to-row path end to end.
import { resolve } from 'node:path'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { installAssembledBootEnv, mountAssembledApp } from './assembled-boot.ts'

installAssembledBootEnv()

const buildEnvironmentModulePath = '../../../scripts/client-build-environment.ts'
const buildEnvironmentModule: unknown = await import(buildEnvironmentModulePath)
if (typeof buildEnvironmentModule !== 'object' || buildEnvironmentModule === null) {
  throw new TypeError('client build environment module must be an object')
}
const readClientBuildRecord: unknown = Reflect.get(buildEnvironmentModule, 'readClientBuildRecord')
if (!isBuildRecordReader(readClientBuildRecord)) {
  throw new TypeError('client build environment module must export readClientBuildRecord')
}
const record: unknown = readClientBuildRecord(resolve(import.meta.dirname, '../../..'))
if (typeof record !== 'object' || record === null) throw new TypeError('client build record must be an object')
const clientBuildEnvironment: unknown = Reflect.get(record, 'environment')
if (typeof clientBuildEnvironment !== 'object' || clientBuildEnvironment === null) {
  throw new TypeError('client build record environment must be an object')
}

function isBuildRecordReader(value: unknown): value is (root: string) => unknown {
  return typeof value === 'function'
}

it('boots the built plugin graph and renders a fixture session end to end', async () => {
  mountAssembledApp()

  // The sidebar renders from the boot graph: every inject layer activated.
  const tree = await screen.findByRole('tree', { name: 'Sessions' }, { timeout: 10_000 })
  expect(document.querySelector('svg[viewBox="26 0 156 24"]')).not.toBeNull()
  expect(screen.queryByText('DSH Local Build')).toBeNull()
  // The compact layout dropped group session counts; the fixture workspace
  // group row renders immediately with its sessions beneath it.
  const fixtureGroup = (await within(tree).findAllByText('fixture'))
    .map(el => el.closest<HTMLElement>('[role="treeitem"]'))
    .find(el => el?.getAttribute('aria-expanded') !== null)
  if (fixtureGroup === undefined) throw new Error('fixture Workspace group missing')

  // The first-class application path is part of the shipped graph: Widgets
  // replaces the center without unmounting the Session browser, and selecting
  // a Session below returns to Conversation.
  fireEvent.click(await screen.findByRole('button', { name: 'Widgets' }))
  expect(await screen.findByRole('heading', { name: 'Widgets' })).toBeTruthy()
  const calculatorHeading = await screen.findByRole('heading', { name: 'Calculator' })
  const editableCalculatorCard = calculatorHeading.closest('article')
  if (editableCalculatorCard === null) throw new Error('Calculator Widget card missing')
  fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }))
  const moveCalculator = screen.getByRole('button', { name: 'Move Widget: Calculator' })
  fireEvent.click(within(editableCalculatorCard).getByRole('button', { name: 'small' }))
  expect(within(editableCalculatorCard).getByRole('button', { name: 'medium' })).toBeTruthy()
  fireEvent.keyDown(moveCalculator, { key: 'ArrowRight' })
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
  fireEvent.click(screen.getByRole('button', { name: 'Open expanded view' }))
  const expandedWidget = screen.getByRole('dialog', { name: 'Calculator' })
  const expandedFrame = await within(expandedWidget).findByTitle('Calculator')
  expect(expandedFrame.getAttribute('srcdoc')).toContain("displayMode:'expanded'")
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog', { name: 'Calculator' })).toBeNull()

  // New Widget is the Agent-first path: create a managed starter, adopt it as
  // an ordinary Workspace, and open its blank Session with a live preview.
  fireEvent.click(await screen.findByRole('button', { name: 'New Widget' }))
  expect(await within(tree).findByText('New Widget')).toBeTruthy()
  expect(await screen.findByTitle('New Widget')).toBeTruthy()
  expect(await screen.findByRole('button', { name: 'Hide Widget preview' })).toBeTruthy()

  fireEvent.click(await screen.findByRole('button', { name: 'Widgets' }))

  // Widget authoring reuses the ordinary Workspace and Session surfaces. The
  // action itself starts no model turn; it selects Conversation and keeps the
  // fixed-canvas preview in the generic right details application slot.
  const calculatorCard = (await screen.findByRole('heading', { name: 'Calculator' })).closest('article')
  if (calculatorCard === null) throw new Error('Calculator Widget card missing')
  fireEvent.click(within(calculatorCard).getByRole('button', { name: 'Talk to this Widget' }))
  expect(await within(tree).findByText('Calculator')).toBeTruthy()
  expect(await screen.findByTitle('Calculator')).toBeTruthy()
  expect(await screen.findByRole('button', { name: 'Hide Widget preview' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Widgets' })).toBeNull()

  // Blank Widget sessions use Hero chrome instead of the ordinary Session
  // header. The same persistent utility closes and reopens the preview there.
  fireEvent.click(screen.getByRole('button', { name: 'Hide Widget preview' }))
  await waitFor(() => { expect(screen.queryByTitle('Calculator')).toBeNull() })
  fireEvent.click(await screen.findByRole('button', { name: 'Show Widget preview' }))
  expect(await screen.findByTitle('Calculator')).toBeTruthy()

  // The resident fixture has both a question and an approval; composer routing
  // exposes the question first, and the assembled workspace plugin mirrors that
  // actionable wait instead of the underlying running state.
  const waitingTitle = await within(tree).findByText('Fixture 历史会话')
  const waitingRow = waitingTitle.closest<HTMLElement>('[role="treeitem"]')
  if (waitingRow === null) throw new Error('fixture Session title must belong to a tree row')
  expect(waitingRow.querySelector('[data-state="warning"]')).not.toBeNull()
  expect(waitingRow.querySelector('[data-state="ongoing"]')).toBeNull()
  within(waitingRow).getByText('Waiting for answer')

  // Opening a session reaches chat content through the fixture transport.
  fireEvent.click(waitingTitle)
  await waitFor(() => {
    expect(screen.queryByTitle('Calculator')).toBeNull()
  })
  await waitFor(() => {
    expect(document.querySelector('[data-sample="bash"]')).not.toBeNull()
  }, { timeout: 10_000 })
  // Starting another Session from the ordinary Widget Workspace restores the
  // Workspace-level preview preference without requiring the Widgets page.
  const newWidgetSession = tree.querySelector<HTMLButtonElement>('[aria-label="New session in Calculator"]')
  if (newWidgetSession === null) throw new Error('calculator Workspace new-session action missing')
  fireEvent.click(newWidgetSession)
  expect(await screen.findByRole('button', { name: 'Hide Widget preview' })).toBeTruthy()
  expect(await screen.findByTitle('Calculator')).toBeTruthy()
  fireEvent.click(waitingTitle)

  // The generated bundle roster mounts the question UI before the approval UI.
  // Skip the resident fixture's three questions, then resolve its approval so
  // the ordinary composer bar (which owns ContextMeter) resumes.
  for (let index = 0; index < 3; index += 1) {
    fireEvent.click(await screen.findByRole('button', { name: 'Skip this question' }))
  }
  fireEvent.click(await screen.findByRole('button', { name: 'Allow once' }))

  // The fixture mirrors all three token-meter projections, so the assembled
  // ContextMeter reaches its composition panel instead of only the occupancy
  // fallback path.
  const contextTrigger = await screen.findByRole('button', { name: /of context used/ })
  fireEvent.click(contextTrigger)
  const contextPanel = await screen.findByRole('dialog', { name: 'of context used' })
  within(contextPanel).getByText('System prompt')
  within(contextPanel).getByText('Tools')
  within(contextPanel).getByText('Messages')

  // The write/edit turns render a real diff card through the assembled graph
  // (the keyed FileMutationRow composing ToolRow + DiffBlock), not just the
  // fixture's raw text. The card is collapsed by default, so expand each edit/
  // write row first. The write turn's `hello fixture\n` proves the terminator
  // rule end to end: a trailing newline terminates its line, so the footer reads
  // `+1` (not a phantom `+2`) and one distinct file. The `+ ` prefix is a CSS
  // ::before, so it is absent from textContent — assert on the line body and the
  // footer.
  const mutationRows = [...document.querySelectorAll('[data-variant="write"],[data-variant="edit"]')]
  expect(mutationRows.length).toBeGreaterThan(0)
  for (const row of mutationRows) {
    const toggle = row.querySelector('[data-expandable]')
    if (toggle !== null) act(() => { fireEvent.click(toggle) })
  }
  const diffCards = [...document.querySelectorAll('[data-diff]')]
  expect(diffCards.length).toBeGreaterThan(0)
  const footers = diffCards.map(card => card.textContent ?? '')
  expect(footers.some(text => text.includes('hello fixture') && text.includes('+1 -0 · 1 file'))).toBe(true)

  // The web render intent reaches the assembled boot graph: the fixture's
  // web_search / web_fetch turns render their keyed WebRow cards, proving the
  // registration, wire projection, and card rendering survive the real bundle
  // path (not just the per-package src benches). WebRow composes ToolRow, so the
  // card is collapsed behind the row; the keyed row is pinned by its `data-tool`
  // (ToolRow sets it from the wire tool name).
  const webSearchRow = await waitFor(() => {
    const row = document.querySelector('[data-tool="web_search"]')
    expect(row).not.toBeNull()
    expect(document.querySelector('[data-tool="web_fetch"]')).not.toBeNull()
    return row!
  }, { timeout: 10_000 })
  // Expand the web_search row to prove its WebBlock card renders end to end.
  const webToggle = webSearchRow.querySelector('[data-expandable]')
  if (webToggle !== null) act(() => { fireEvent.click(webToggle) })
  await waitFor(() => {
    expect(webSearchRow.querySelector('[data-web]')).not.toBeNull()
  }, { timeout: 10_000 })

  // Every bundle injected its plugin-owned style tag (the loader's CSS path).
  const styleOwners = [...document.head.querySelectorAll('style[data-plugin]')]
    .map(style => style.getAttribute('data-plugin'))
  for (const plugin of ['@deepseek-ai/dsh-client-ui-layout', '@deepseek-ai/dsh-client-ui-sidebar', '@deepseek-ai/dsh-client-ui-conversation', '@deepseek-ai/dsh-client-ui-tool']) {
    expect(styleOwners).toContain(plugin)
  }
})
