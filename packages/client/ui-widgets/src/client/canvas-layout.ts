import type { WidgetLayoutItem, WidgetSize, WidgetView } from '@deepseek-ai/dsh-api-remotes/client'

/** Grid span occupied by one semantic Widget size. */
export interface WidgetSpan {
  columns: number
  rows: number
}

const SPANS: Record<WidgetSize, WidgetSpan> = {
  small: { columns: 1, rows: 1 },
  medium: { columns: 2, rows: 1 },
  large: { columns: 2, rows: 2 },
}

/**
 * Return the logical grid span for a semantic Widget size.
 * @param size Semantic Widget size.
 * @returns Logical grid span.
 */
export function widgetSpan(size: WidgetSize): WidgetSpan {
  return SPANS[size]
}

function overlaps(left: WidgetLayoutItem, right: WidgetLayoutItem): boolean {
  const a = widgetSpan(left.size)
  const b = widgetSpan(right.size)
  return left.column < right.column + b.columns
    && left.column + a.columns > right.column
    && left.row < right.row + b.rows
    && left.row + a.rows > right.row
}

function freePosition(
  occupied: WidgetLayoutItem[],
  item: WidgetLayoutItem,
  columns: number,
): WidgetLayoutItem {
  const span = widgetSpan(item.size)
  const startColumn = Math.min(item.column, Math.max(0, columns - span.columns))
  for (let row = item.row; row < 65_536; row++) {
    const maximum = columns - span.columns
    const candidates = row === item.row
      ? [...Array.from({ length: maximum - startColumn + 1 }, (_, index) => startColumn + index),
        ...Array.from({ length: startColumn }, (_, index) => index)]
      : Array.from({ length: maximum + 1 }, (_, index) => index)
    for (const column of candidates) {
      const candidate = { ...item, column, row }
      if (occupied.every(other => !overlaps(candidate, other))) return candidate
    }
  }
  return { ...item, column: 0, row: 65_535 }
}

/**
 * Project persisted placements onto the current canvas width and place new Widgets.
 * The returned reflow is display-only until a user moves or resizes a Widget.
 * @param widgets Widgets to place.
 * @param saved Persisted placements.
 * @param columns Available logical columns.
 * @returns Non-overlapping display placements.
 */
export function arrangeWidgetLayout(
  widgets: WidgetView[],
  saved: WidgetLayoutItem[],
  columns: number,
): WidgetLayoutItem[] {
  const byId = new Map(saved.map(item => [item.id, item]))
  const arranged: WidgetLayoutItem[] = []
  for (const widget of widgets) {
    const stored = byId.get(widget.manifest.id)
    const size = stored !== undefined && widget.manifest.sizes.includes(stored.size)
      ? stored.size
      : widget.manifest.defaultSize
    arranged.push(freePosition(arranged, {
      id: widget.manifest.id,
      size,
      column: stored?.column ?? 0,
      row: stored?.row ?? 0,
    }, columns))
  }
  return arranged
}

/**
 * Snap one Widget to the requested cell or the next unoccupied cell.
 * @param layout Current placements.
 * @param id Widget identifier.
 * @param size Requested semantic size.
 * @param column Requested logical column.
 * @param row Requested logical row.
 * @param columns Available logical columns.
 * @returns Placements with the requested Widget moved.
 */
export function placeWidget(
  layout: WidgetLayoutItem[],
  id: string,
  size: WidgetSize,
  column: number,
  row: number,
  columns: number,
): WidgetLayoutItem[] {
  const occupied = layout.filter(item => item.id !== id)
  const next = freePosition(occupied, {
    id,
    size,
    column: Math.max(0, column),
    row: Math.max(0, row),
  }, columns)
  return [...occupied, next]
}

/**
 * Return the canvas row count needed for the current placements.
 * @param layout Current placements.
 * @returns Required logical row count.
 */
export function widgetCanvasRows(layout: WidgetLayoutItem[]): number {
  return Math.max(4, ...layout.map(item => item.row + widgetSpan(item.size).rows + 1))
}
