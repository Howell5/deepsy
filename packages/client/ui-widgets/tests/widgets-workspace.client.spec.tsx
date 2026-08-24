// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { WidgetView } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '../src/client/index.ts'
import { WidgetsWorkspace } from '../src/client/WidgetsWorkspace.tsx'

const widget: WidgetView = {
  manifest: {
    schemaVersion: 2,
    id: 'calculator',
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

describe('Widgets workspace canvas', () => {
  it('enters edit mode and persists a keyboard-snapped move', async () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
    const layoutWrite = vi.fn(async () => ({
      result: { ok: true as const, value: { saved: true as const } },
    }))
    const api = {
      widgets: {
        list: async () => ({ result: { ok: true as const, value: { widgets: [widget] } } }),
        layoutRead: async () => ({ result: { ok: true as const, value: { layout: [] } } }),
        layoutWrite,
        read: async () => ({ result: { ok: true as const, value: { widget, html: '<main>Calculator</main>' } } }),
      },
    }

    render(<WidgetsWorkspace
      active="widgets"
      api={api as never}
      layout={{} as never}
      useSessions={() => { throw new Error('not used') }}
      useWorkspaces={() => { throw new Error('not used') }}
      subscribeChanges={() => () => {}}
      editWidget={async () => {}}
      t={(key: string) => key}
    />)

    fireEvent.click(await screen.findByRole('button', { name: 'editLayout' }))
    fireEvent.keyDown(screen.getByRole('button', { name: 'moveWidget: Calculator' }), { key: 'ArrowRight' })

    await waitFor(() => {
      expect(layoutWrite).toHaveBeenCalledWith({
        layout: [{ id: 'calculator', size: 'small', column: 1, row: 0 }],
      })
    })
  })
})
