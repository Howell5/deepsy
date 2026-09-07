/**
 * Client-safe Widget event vocabulary shared with the Remote event projection.
 *
 * @module @deepseek-ai/dsh-widgets/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Stable project identifier from a validated Widget manifest. */
export type WidgetId = Branded<'WidgetId'>

/** Semantic Widget sizes supported by the desktop workspace. */
export type WidgetSize = 'small' | 'medium' | 'large'

/** JSON object persisted for one Widget outside its editable project. */
export type WidgetState = { [key: string]: WidgetStateValue }

/** Lossless JSON value accepted by Widget state storage. */
export type WidgetStateValue = null | boolean | number | string | WidgetStateValue[] | WidgetState

/** One Widget's logical position on the desktop canvas. */
export interface WidgetLayoutItem {
  id: WidgetId
  size: WidgetSize
  column: number
  row: number
}

/** Refresh behavior available to static Widgets. */
export type WidgetRefreshMode = 'manual' | 'on-open' | 'visible-interval'

/** Version 2 static Widget manifest. */
export interface WidgetManifest {
  schemaVersion: 2
  id: WidgetId
  name: string
  version: string
  runtime: 'static'
  entry: string
  sizes: WidgetSize[]
  defaultSize: WidgetSize
  permissions: {
    network: string[]
  }
  refresh: {
    mode: WidgetRefreshMode
    minimumIntervalSeconds: number
  }
}

/** Installed Widget metadata exposed to Consumers. */
export interface WidgetView {
  manifest: WidgetManifest
  sourcePath: string
  builtIn: boolean
}

/** Installed document returned for sandboxed rendering. */
export interface WidgetDocument {
  widget: WidgetView
  html: string
}

/** Bounded external response returned through the Widget bridge. */
export interface WidgetFetchResult {
  status: number
  contentType: string
  body: string
}

declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * A managed Widget project changed on disk.
     * @mode emit
     * @param id - direct managed project directory id.
     */
    'widgets/changed'(id: WidgetId): void
  }
}
