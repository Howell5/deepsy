/** Zod schemas for the Widgets unary RPC domain. */

import { z } from 'zod'
import type { RequestPayload, ResponseValue } from './rpc-map.ts'
import type { Wire } from './rpc.schema.ts'

const widgetIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/)
const widgetSizeSchema = z.enum(['small', 'medium', 'large'])
const widgetStateSchema = z.record(z.string().min(1).max(128), z.json())
const widgetLayoutSchema = z.array(z.object({
  id: widgetIdSchema,
  size: widgetSizeSchema,
  column: z.number().int().min(0).max(255),
  row: z.number().int().min(0).max(65_535),
})).max(256)

const widgetManifestSchema = z.object({
  schemaVersion: z.literal(2),
  id: widgetIdSchema,
  name: z.string(),
  version: z.string(),
  runtime: z.literal('static'),
  entry: z.string(),
  sizes: z.array(widgetSizeSchema),
  defaultSize: widgetSizeSchema,
  permissions: z.object({ network: z.array(z.string()) }),
  refresh: z.object({
    mode: z.enum(['manual', 'on-open', 'visible-interval']),
    minimumIntervalSeconds: z.number().int().positive(),
  }),
})

const widgetViewSchema = z.object({
  manifest: widgetManifestSchema,
  sourcePath: z.string(),
  builtIn: z.boolean(),
})

/** Wire request schema for `widget.list`. */
export const widgetListRequestSchema = z.object({}) satisfies z.ZodType<Wire<RequestPayload<'widget.list'>>>
/** Wire response value schema for `widget.list`. */
export const widgetListValueSchema = z.object({
  widgets: z.array(widgetViewSchema),
}) satisfies z.ZodType<Wire<ResponseValue<'widget.list'>>>

/** Wire request schema for `widget.create`. */
export const widgetCreateRequestSchema = z.object({}) satisfies z.ZodType<Wire<RequestPayload<'widget.create'>>>
/** Wire response value schema for `widget.create`. */
export const widgetCreateValueSchema = z.object({
  widget: widgetViewSchema,
}) satisfies z.ZodType<Wire<ResponseValue<'widget.create'>>>

/** Wire request schema for `widget.read`. */
export const widgetReadRequestSchema = z.object({
  id: widgetIdSchema,
}) satisfies z.ZodType<Wire<RequestPayload<'widget.read'>>>
/** Wire response value schema for `widget.read`. */
export const widgetReadValueSchema = z.object({
  widget: widgetViewSchema,
  html: z.string(),
}) satisfies z.ZodType<Wire<ResponseValue<'widget.read'>>>

/** Wire request schema for `widget.install`. */
export const widgetInstallRequestSchema = z.object({
  path: z.string().min(1),
}) satisfies z.ZodType<Wire<RequestPayload<'widget.install'>>>
/** Wire response value schema for `widget.install`. */
export const widgetInstallValueSchema = z.object({
  widget: widgetViewSchema,
}) satisfies z.ZodType<Wire<ResponseValue<'widget.install'>>>

/** Wire request schema for `widget.remove`. */
export const widgetRemoveRequestSchema = z.object({
  id: widgetIdSchema,
}) satisfies z.ZodType<Wire<RequestPayload<'widget.remove'>>>
/** Wire response value schema for `widget.remove`. */
export const widgetRemoveValueSchema = z.object({
  removed: z.literal(true),
}) satisfies z.ZodType<Wire<ResponseValue<'widget.remove'>>>

/** Wire request schema for `widget.state.read`. */
export const widgetStateReadRequestSchema = z.object({
  id: widgetIdSchema,
}) satisfies z.ZodType<Wire<RequestPayload<'widget.state.read'>>>
/** Wire response value schema for `widget.state.read`. */
export const widgetStateReadValueSchema = z.object({
  state: widgetStateSchema,
}) satisfies z.ZodType<Wire<ResponseValue<'widget.state.read'>>>

/** Wire request schema for `widget.state.write`. */
export const widgetStateWriteRequestSchema = z.object({
  id: widgetIdSchema,
  state: widgetStateSchema,
}) satisfies z.ZodType<Wire<RequestPayload<'widget.state.write'>>>
/** Wire response value schema for `widget.state.write`. */
export const widgetStateWriteValueSchema = z.object({
  saved: z.literal(true),
}) satisfies z.ZodType<Wire<ResponseValue<'widget.state.write'>>>

/** Wire request schema for `widget.layout.read`. */
export const widgetLayoutReadRequestSchema = z.object({}) satisfies z.ZodType<Wire<RequestPayload<'widget.layout.read'>>>
/** Wire response value schema for `widget.layout.read`. */
export const widgetLayoutReadValueSchema = z.object({
  layout: widgetLayoutSchema,
}) satisfies z.ZodType<Wire<ResponseValue<'widget.layout.read'>>>

/** Wire request schema for `widget.layout.write`. */
export const widgetLayoutWriteRequestSchema = z.object({
  layout: widgetLayoutSchema,
}) satisfies z.ZodType<Wire<RequestPayload<'widget.layout.write'>>>
/** Wire response value schema for `widget.layout.write`. */
export const widgetLayoutWriteValueSchema = z.object({
  saved: z.literal(true),
}) satisfies z.ZodType<Wire<ResponseValue<'widget.layout.write'>>>

/** Wire request schema for `widget.fetch`. */
export const widgetFetchRequestSchema = z.object({
  id: widgetIdSchema,
  url: z.url(),
}) satisfies z.ZodType<Wire<RequestPayload<'widget.fetch'>>>
/** Wire response value schema for `widget.fetch`. */
export const widgetFetchValueSchema = z.object({
  status: z.number().int().min(100).max(599),
  contentType: z.string(),
  body: z.string(),
}) satisfies z.ZodType<Wire<ResponseValue<'widget.fetch'>>>
