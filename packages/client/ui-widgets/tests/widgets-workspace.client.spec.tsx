// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WidgetView } from '@deepseek-ai/dsh-api-remotes/client'
import { WidgetId } from '@deepseek-ai/dsh-widgets'
import type {} from '../src/client/index.ts'
import { WidgetsWorkspace } from '../src/client/WidgetsWorkspace.tsx'

const widget: WidgetView = {
  manifest: {
    schemaVersion: 2,
    id: WidgetId('calculator'),
    name: 'Calculator',
    version: '1',
    runtime: 'static',
    entry: 'dist/index.html',
    sizes: ['small', 'medium', 'large'],
    defaultSize: 'small',
    permissions: { network: [] },
    refresh: { mode: 'manual', minimumIntervalSeconds: 30 },
  },
  sourcePath: '/widgets/calculator',
  builtIn: true,
}

function workspace(api: object, active = 'widgets') {
  return <WidgetsWorkspace
    active={active}
    api={api as never}
    layout={{} as never}
    useSessions={() => { throw new Error('not used') }}
    useWorkspaces={() => { throw new Error('not used') }}
    useSessionPendingInteraction={() => { throw new Error('not used') }}
    subscribeChanges={() => () => {}}
    editWidget={async () => {}}
    t={(key: string) => key}
  />
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Widgets workspace canvas', () => {
  it('enters edit mode and persists a keyboard-snapped move', async () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
    const layoutWrite = vi.fn(async () => ({
      ok: true as const, value: undefined,
    }))
    const api = {
      widgets: {
        list: async () => ({ ok: true as const, value: { widgets: [widget] } }),
        layoutRead: async () => ({ ok: true as const, value: { layout: [] } }),
        layoutWrite,
        read: async () => ({ ok: true as const, value: { widget, html: '<main>Calculator</main>' } }),
      },
    }

    render(workspace(api))

    fireEvent.click(await screen.findByRole('button', { name: 'editLayout' }))
    fireEvent.keyDown(screen.getByRole('button', { name: 'moveWidget: Calculator' }), { key: 'ArrowRight' })

    await waitFor(() => {
      expect(layoutWrite).toHaveBeenCalledWith([
        { id: 'calculator', size: 'small', column: 1, row: 0 },
      ])
    })
  })

  it('opens the same Widget in expanded mode and closes it with Escape', async () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
    const read = vi.fn(async () => ({
      ok: true as const, value: { widget, html: '<main>Calculator</main>' },
    }))
    const api = {
      widgets: {
        list: async () => ({ ok: true as const, value: { widgets: [widget] } }),
        layoutRead: async () => ({ ok: true as const, value: { layout: [] } }),
        read,
      },
    }

    const view = render(workspace(api))

    await within(view.container).findByTitle('Calculator')
    fireEvent.click(screen.getByRole('button', { name: 'openExpanded' }))
    const dialog = screen.getByRole('dialog', { name: 'Calculator' })
    const frame = await within(dialog).findByTitle('Calculator')
    expect(frame.getAttribute('srcdoc')).toContain("displayMode:'expanded'")

    fireEvent.click(within(dialog).getByRole('button', { name: 'closeExpanded' }))
    const compactFrame = (await within(view.container).findByTitle('Calculator')) as HTMLIFrameElement
    expect(read).toHaveBeenCalledTimes(3)

    const openEvent = new MessageEvent('message', {
      data: { dshWidget: 1, kind: 'open' },
    })
    Object.defineProperty(openEvent, 'source', { value: compactFrame.contentWindow })
    window.dispatchEvent(openEvent)
    await screen.findByRole('dialog', { name: 'Calculator' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Calculator' })).toBeNull()
    await within(view.container).findByTitle('Calculator')
    expect(read).toHaveBeenCalledTimes(5)

    fireEvent.click(screen.getByRole('button', { name: 'openExpanded' }))
    view.rerender(workspace(api, 'conversation'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Calculator' })).toBeNull()
    })
  })
})
