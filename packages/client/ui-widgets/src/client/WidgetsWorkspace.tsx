import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type DragEvent, type KeyboardEvent,
} from 'react'
import type {
  IApiClient, WidgetLayoutItem, WidgetView,
} from '@deepseek-ai/dsh-api-remotes/client'
import type { ILayout } from '@deepseek-ai/dsh-client-ui-layout/client'
import { IconFolderOpenOutline16, IconPlusOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { WidgetFrame, type WidgetChangeSubscriber } from './WidgetFrame.tsx'
import {
  arrangeWidgetLayout, placeWidget, widgetCanvasRows, widgetSpan,
} from './canvas-layout.ts'
import css from './WidgetsWorkspace.module.css'

interface WidgetsInjected {
  api: IApiClient
  layout: ILayout
  subscribeChanges: WidgetChangeSubscriber
  editWidget: (widget: WidgetView) => Promise<void>
}

type WidgetsWorkspaceProps =
  & PropsRuntime<'application'>
  & PropsLocale<'widgets'>
  & WidgetsInjected

const GRID_GAP = 14
const MIN_CELL_SIZE = 170

/** Root Widgets canvas application. */
export function WidgetsWorkspace({
  active,
  api,
  subscribeChanges,
  editWidget,
  t,
}: WidgetsWorkspaceProps) {
  const canvas = useRef<HTMLElement>(null)
  const [widgets, setWidgets] = useState<WidgetView[]>([])
  const [layout, setLayout] = useState<WidgetLayoutItem[]>([])
  const [draftLayout, setDraftLayout] = useState<WidgetLayoutItem[]>()
  const [columns, setColumns] = useState(6)
  const [cellSize, setCellSize] = useState(180)
  const [editingLayout, setEditingLayout] = useState(false)
  const [dragging, setDragging] = useState<string>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const [listed, stored] = await Promise.all([
        api.widgets.list({}),
        api.widgets.layoutRead({}),
      ])
      if (!listed.result.ok) throw new Error(listed.result.error.message)
      if (!stored.result.ok) throw new Error(stored.result.error.message)
      setWidgets(listed.result.value.widgets)
      setLayout(stored.result.value.layout)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    const element = canvas.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const width = element.clientWidth
      const nextColumns = Math.max(2, Math.floor((width + GRID_GAP) / (MIN_CELL_SIZE + GRID_GAP)))
      setColumns(nextColumns)
      setCellSize(Math.max(1, (width - GRID_GAP * (nextColumns - 1)) / nextColumns))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => { observer.disconnect() }
  }, [active])

  const importProject = useCallback(async () => {
    setError(undefined)
    const picked = await api.host.pickDirectory({})
    if (!picked.result.ok) {
      setError(picked.result.error.message)
      return
    }
    if (picked.result.value.path === null) return
    const installed = await api.widgets.install({ path: picked.result.value.path })
    if (!installed.result.ok) {
      setError(installed.result.error.message)
      return
    }
    await reload()
  }, [api, reload])

  const createWidget = useCallback(async () => {
    setCreating(true)
    setError(undefined)
    try {
      const created = await api.widgets.create({})
      if (!created.result.ok) throw new Error(created.result.error.message)
      await reload()
      await editWidget(created.result.value.widget)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setCreating(false)
    }
  }, [api, editWidget, reload])

  const edit = useCallback(async (widget: WidgetView) => {
    setError(undefined)
    try {
      await editWidget(widget)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [editWidget])

  const displayedLayout = useMemo(
    () => arrangeWidgetLayout(widgets, draftLayout ?? layout, columns),
    [columns, draftLayout, layout, widgets],
  )

  const persistLayout = useCallback(async (next: WidgetLayoutItem[]) => {
    const previous = layout
    setLayout(next)
    setError(undefined)
    const saved = await api.widgets.layoutWrite({ layout: next })
    if (!saved.result.ok) {
      setLayout(previous)
      setError(saved.result.error.message)
    }
  }, [api, layout])

  const cycleSize = useCallback((widget: WidgetView, item: WidgetLayoutItem) => {
    const options = widget.manifest.sizes
    const nextSize = options[(options.indexOf(item.size) + 1) % options.length] ?? widget.manifest.defaultSize
    void persistLayout(placeWidget(
      displayedLayout,
      widget.manifest.id,
      nextSize,
      item.column,
      item.row,
      columns,
    ))
  }, [columns, displayedLayout, persistLayout])

  const startDrag = useCallback((event: DragEvent<HTMLDivElement>, id: string) => {
    const button = (event.target as HTMLElement).closest('button')
    if (!editingLayout || (button !== null && button.dataset.widgetDragSurface !== 'true')) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    setDragging(id)
    setDraftLayout(displayedLayout)
  }, [displayedLayout, editingLayout])

  const dragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (dragging === undefined || canvas.current === null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const rect = canvas.current.getBoundingClientRect()
    const step = cellSize + GRID_GAP
    const column = Math.max(0, Math.floor((event.clientX - rect.left) / step))
    const row = Math.max(0, Math.floor((event.clientY - rect.top) / step))
    const current = draftLayout ?? displayedLayout
    const item = current.find(candidate => candidate.id === dragging)
    if (item !== undefined) setDraftLayout(placeWidget(current, dragging, item.size, column, row, columns))
  }, [cellSize, columns, displayedLayout, draftLayout, dragging])

  const drop = useCallback((event: DragEvent<HTMLElement>) => {
    if (dragging === undefined) return
    event.preventDefault()
    const next = draftLayout ?? displayedLayout
    setDragging(undefined)
    setDraftLayout(undefined)
    void persistLayout(next)
  }, [displayedLayout, draftLayout, dragging, persistLayout])

  const endDrag = useCallback(() => {
    setDragging(undefined)
    setDraftLayout(undefined)
  }, [])

  const moveWithKeyboard = useCallback((
    event: KeyboardEvent<HTMLButtonElement>,
    item: WidgetLayoutItem,
  ) => {
    const delta = ({
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    } as Record<string, readonly [number, number]>)[event.key]
    if (delta === undefined) return
    event.preventDefault()
    void persistLayout(placeWidget(
      displayedLayout,
      item.id,
      item.size,
      item.column + delta[0],
      item.row + delta[1],
      columns,
    ))
  }, [columns, displayedLayout, persistLayout])

  const placements = useMemo(
    () => new Map(displayedLayout.map(item => [item.id, item])),
    [displayedLayout],
  )
  const rows = widgetCanvasRows(displayedLayout)
  const canvasStyle = {
    '--widget-columns': columns,
    '--widget-cell-size': `${String(cellSize)}px`,
    gridTemplateRows: `repeat(${String(rows)}, ${String(cellSize)}px)`,
  } as CSSProperties

  if (active !== 'widgets') return null
  return (
    <main className={css.root}>
      <header className={css.pageHeader}>
        <div className={css.pageTitle}>
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
        <div className={css.headerActions}>
          <button
            type="button"
            className={css.importButton}
            aria-pressed={editingLayout}
            onClick={() => {
              setEditingLayout(value => !value)
              setDraftLayout(undefined)
              setDragging(undefined)
            }}
          >
            {editingLayout ? t('done') : t('editLayout')}
          </button>
          <button type="button" className={css.importButton} onClick={() => { void importProject() }}>
            <IconFolderOpenOutline16 />
            {t('import')}
          </button>
          <button
            type="button"
            className={css.createButton}
            disabled={creating}
            onClick={() => { void createWidget() }}
          >
            <IconPlusOutline16 />
            {creating ? t('creating') : t('create')}
          </button>
        </div>
      </header>

      {error !== undefined && <div className={css.pageError}>{error}</div>}
      {loading && widgets.length === 0 && <div className={css.empty}>{t('loading')}</div>}
      {!loading && widgets.length === 0 && (
        <div className={css.empty}>
          <IconFolderOpenOutline16 size={28} />
          <strong>{t('empty')}</strong>
          <span>{t('emptyDetail')}</span>
        </div>
      )}
      <section
        ref={canvas}
        className={css.canvas}
        style={canvasStyle}
        aria-label={t('title')}
        data-editing={editingLayout}
        onDragOver={dragOver}
        onDrop={drop}
      >
        {widgets.map((widget) => {
          const item = placements.get(widget.manifest.id)
          if (item === undefined) return null
          const span = widgetSpan(item.size)
          return (
            <div
              key={widget.manifest.id}
              className={css.canvasItem}
              data-editing={editingLayout}
              data-dragging={dragging === widget.manifest.id}
              draggable={editingLayout}
              onDragStart={(event) => { startDrag(event, widget.manifest.id) }}
              onDragEnd={endDrag}
              style={{
                gridColumn: `${String(item.column + 1)} / span ${String(span.columns)}`,
                gridRow: `${String(item.row + 1)} / span ${String(span.rows)}`,
              }}
            >
              <WidgetFrame
                api={api}
                widget={widget}
                size={item.size}
                t={t}
                subscribeChanges={subscribeChanges}
                {...editingLayout ? { onCycleSize: () => { cycleSize(widget, item) } } : {}}
                onEdit={() => { void edit(widget) }}
              />
              {editingLayout && (
                <button
                  type="button"
                  className={css.dragSurface}
                  data-widget-drag-surface="true"
                  aria-label={`${t('moveWidget')}: ${widget.manifest.name}`}
                  title={t('moveWidget')}
                  onKeyDown={(event) => { moveWithKeyboard(event, item) }}
                />
              )}
            </div>
          )
        })}
      </section>
    </main>
  )
}
