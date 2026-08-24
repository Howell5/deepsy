/**
 * Service Definition for locally installed Widgets: validated static projects,
 * isolated document reads, permission-scoped external fetches, and registry
 * lifecycle. Providers own storage and network enforcement; UI and tool
 * Consumers depend only on this service.
 * @module @deepseek-ai/dsh-widgets
 */

import { Service, type Context } from '@deepseek-ai/cordis'
import { z } from 'zod'
import type { WidgetId as WidgetIdBrand } from './types.ts'

/** Stable project identifier from a validated Widget manifest. */
export type WidgetId = WidgetIdBrand

/**
 * Brand a manifest-validated identifier.
 * @param value - identifier already validated at its external boundary.
 * @returns the branded Widget identifier.
 */
export function WidgetId(value: string): WidgetId {
  return value as WidgetId
}

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

const widgetIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/)
const widgetSizeSchema = z.enum(['small', 'medium', 'large'])
const hostnameSchema = z.string().min(1).max(253).refine((value) => {
  try {
    const url = new URL(`https://${value}`)
    return url.hostname === value && url.port === ''
  } catch {
    return false
  }
}, 'network permissions must be exact hostnames')

/** Strict parser for the version 2 manifest boundary. */
export const widgetManifestSchema = z.strictObject({
  schemaVersion: z.literal(2),
  id: widgetIdSchema.transform(WidgetId),
  name: z.string().trim().min(1).max(80),
  version: z.string().trim().min(1).max(40),
  runtime: z.literal('static'),
  entry: z.string().min(1).max(240),
  sizes: z.array(widgetSizeSchema).min(1),
  defaultSize: widgetSizeSchema,
  permissions: z.strictObject({
    network: z.array(hostnameSchema).max(16),
  }),
  refresh: z.strictObject({
    mode: z.enum(['manual', 'on-open', 'visible-interval']),
    minimumIntervalSeconds: z.number().int().min(30).max(86_400),
  }),
}).superRefine((manifest, issue) => {
  if (!manifest.sizes.includes(manifest.defaultSize)) {
    issue.addIssue({
      code: 'custom',
      path: ['defaultSize'],
      message: 'defaultSize must appear in sizes',
    })
  }
})

/** Strict parser for one bounded Widget state document. */
export const widgetStateSchema: z.ZodType<WidgetState> = z.record(
  z.string().min(1).max(128),
  z.json(),
).superRefine((state, issue) => {
  if (Object.keys(state).length > 256) {
    issue.addIssue({ code: 'custom', message: 'Widget state may contain at most 256 keys' })
  }
})

/** Strict parser for the persisted desktop Widget layout. */
export const widgetLayoutSchema: z.ZodType<WidgetLayoutItem[]> = z.array(z.strictObject({
  id: widgetIdSchema.transform(WidgetId),
  size: widgetSizeSchema,
  column: z.number().int().min(0).max(255),
  row: z.number().int().min(0).max(65_535),
})).max(256).superRefine((items, issue) => {
  const seen = new Set<WidgetId>()
  for (const [index, item] of items.entries()) {
    if (seen.has(item.id)) {
      issue.addIssue({ code: 'custom', path: [index, 'id'], message: `duplicate Widget id '${item.id}'` })
    }
    seen.add(item.id)
  }
})

/**
 * Parse one untrusted manifest value or throw its zod diagnostic.
 * @param value - untrusted decoded manifest value.
 * @returns the strict version 2 manifest.
 */
export function parseWidgetManifest(value: unknown): WidgetManifest {
  return widgetManifestSchema.parse(value)
}

/**
 * Parse an untrusted Widget state document.
 * @param value - untrusted decoded state value.
 * @returns validated JSON state.
 */
export function parseWidgetState(value: unknown): WidgetState {
  return widgetStateSchema.parse(value)
}

/**
 * Parse an untrusted desktop Widget layout.
 * @param value - untrusted decoded layout value.
 * @returns validated logical placements.
 */
export function parseWidgetLayout(value: unknown): WidgetLayoutItem[] {
  return widgetLayoutSchema.parse(value)
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

/** Stable provider error vocabulary translated by Host gateways. */
export type WidgetErrorCode =
  | 'invalid-project'
  | 'not-found'
  | 'already-installed'
  | 'permission-denied'
  | 'network-failed'
  | 'invalid-data'

/** Typed failure from Widget provider operations. */
export class WidgetError extends Error {
  /**
   * @param code - stable provider error code.
   * @param message - user-readable failure description.
   */
  constructor(readonly code: WidgetErrorCode, message: string) {
    super(message)
    this.name = 'WidgetError'
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    widgets: Widgets
  }
}

/** Registry and runtime operations for installed Widgets. */
export abstract class Widgets extends Service {
  constructor(ctx: Context) {
    super(ctx, 'widgets')
  }

  /**
   * List every valid installed Widget in deterministic name order.
   * @returns validated installed Widget metadata.
   */
  abstract list(): Promise<WidgetView[]>

  /**
   * Create one valid managed starter project for Agent authoring.
   * @returns the newly created Widget metadata.
   */
  abstract create(): Promise<WidgetView>

  /**
   * Read one Widget's validated entry document.
   * @param id - installed Widget identifier.
   * @returns metadata and self-contained HTML.
   */
  abstract read(id: WidgetId): Promise<WidgetDocument>

  /**
   * Validate and copy one local static project into managed storage.
   * @param sourcePath - absolute source project directory.
   * @returns the installed Widget metadata.
   */
  abstract install(sourcePath: string): Promise<WidgetView>

  /**
   * Remove one managed Widget without deleting any external source directory.
   * @param id - installed Widget identifier.
   */
  abstract remove(id: WidgetId): Promise<void>

  /**
   * Read one Widget's Host-owned state document.
   * @param id - installed Widget identifier.
   * @returns persisted JSON state, or an empty object before the first write.
   */
  abstract readState(id: WidgetId): Promise<WidgetState>

  /**
   * Replace one Widget's Host-owned state document.
   * @param id - installed Widget identifier.
   * @param state - complete next JSON state.
   */
  abstract writeState(id: WidgetId, state: WidgetState): Promise<void>

  /**
   * Read the desktop canvas's logical Widget placements.
   * @returns persisted placements, or an empty layout before the first write.
   */
  abstract readLayout(): Promise<WidgetLayoutItem[]>

  /**
   * Replace the desktop canvas's logical Widget placements.
   * @param layout - complete next placement list.
   */
  abstract writeLayout(layout: WidgetLayoutItem[]): Promise<void>

  /**
   * Perform one permission-checked external GET for a Widget.
   * @param id - calling Widget identifier.
   * @param url - absolute HTTPS URL.
   * @param signal - caller lifetime.
   * @returns bounded textual response.
   */
  abstract fetch(id: WidgetId, url: string, signal: AbortSignal): Promise<WidgetFetchResult>
}

export default Widgets
