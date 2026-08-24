import { describe, expect, it } from 'vitest'
import type { WidgetLayoutItem, WidgetView } from '@deepseek-ai/dsh-api-remotes/client'
import { arrangeWidgetLayout, placeWidget, widgetCanvasRows } from '../src/client/canvas-layout.ts'

function widget(id: string, sizes: Array<'small' | 'medium' | 'large'>, defaultSize = sizes[0] ?? 'small'): WidgetView {
  return {
    sourcePath: `/widgets/${id}`,
    builtIn: false,
    manifest: { id, sizes, defaultSize },
  } as WidgetView
}

describe('Widget canvas layout', () => {
  it('clamps saved positions without overlap and gives new Widgets a free cell', () => {
    const arranged = arrangeWidgetLayout([
      widget('one', ['medium']),
      widget('two', ['small']),
      widget('three', ['large']),
    ], [
      { id: 'one', size: 'medium', column: 4, row: 0 },
      { id: 'two', size: 'small', column: 1, row: 0 },
    ] as WidgetLayoutItem[], 3)

    expect(arranged).toEqual([
      { id: 'one', size: 'medium', column: 1, row: 0 },
      { id: 'two', size: 'small', column: 0, row: 0 },
      { id: 'three', size: 'large', column: 0, row: 1 },
    ])
    expect(widgetCanvasRows(arranged)).toBe(4)
  })

  it('snaps a move past an occupied target and preserves the other placements', () => {
    const next = placeWidget([
      { id: 'one', size: 'small', column: 0, row: 0 },
      { id: 'two', size: 'small', column: 1, row: 0 },
    ] as WidgetLayoutItem[], 'two', 'medium', 0, 0, 3)

    expect(next).toContainEqual({ id: 'one', size: 'small', column: 0, row: 0 })
    expect(next).toContainEqual({ id: 'two', size: 'medium', column: 1, row: 0 })
  })
})
