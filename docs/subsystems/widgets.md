# Local Widgets

English | [中文](widgets.zh.md)

The Widgets subsystem installs local static mini-applications for the desktop client. [`ctx.widgets`](#ctxwidgets--widgets-abstract-seam) separates manifest and lifecycle operations from the local filesystem provider, Host RPC, and browser presentation. Installed projects are product-global data and do not enter the Session log or model context.

Source: [`packages/widget/widgets/src/index.ts`](../../packages/widget/widgets/src/index.ts)

## Manifest and installed views

`WidgetId` is an opaque manifest id using lowercase dash-separated segments. A version 2 `WidgetManifest` names one static HTML entry, supported semantic sizes (`small`, `medium`, or `large`), a default size, exact network hostnames, and refresh metadata. The three sizes occupy `1×1`, `2×1`, and `2×2` logical cells. The parser rejects unknown fields, unsupported runtimes, malformed ids, and inconsistent size declarations. The browser Consumer fixes the iframe to the selected canvas, disables document scrolling, and reports intrinsic content overflow as an invalid Widget layout.

`WidgetView` combines a validated manifest with its managed source path and built-in status. `WidgetDocument` adds the bounded self-contained HTML returned for isolated rendering. `WidgetFetchResult` contains only status, content type, and bounded text; providers keep transport credentials and network authority outside the frame. `WidgetState` is one bounded JSON object per installed id, and `WidgetLayoutItem` records a semantic size plus non-negative logical column and row.

## Provider obligations

A provider validates durable paths and documents on every read, publishes installation only after its managed copy succeeds, and never deletes an external source directory through `remove()`. Its `fetch()` implementation enforces the calling manifest's network policy, cancellation, and complete response limits. State and layout writes validate JSON and replace owner-only files atomically outside each Agent-editable project.

The local provider stores projects under `$DSH_HOME/widgets/projects`, per-Widget state under the hidden `.state` directory, and the logical canvas layout in `.layout.json`. It seeds Calculator and Gold / USD examples and accepts only credential-free HTTPS GET requests to declared public hosts. The [package README](../../packages/widget/widgets-local/README.md) owns exact limits and current restrictions.

The desktop **Edit with Agent** action registers the managed project path as an ordinary Workspace and opens its reusable blank Session in Conversation. A generic `details.application` slot carries the live Widget preview in the right column. Exact managed-path matching contributes a preview toggle to both the blank Hero and active Session header, and a Workspace-level browser preference restores the column after ordinary Session navigation. The local provider watches managed projects and forwards `widgets/changed(id)` through the Remote allowlist, so the matching iframe re-reads its validated document after file writes. Opening the editor itself never sends a model request.

The desktop workspace uses the complete center area as a logical grid. Edit mode places an interaction layer over each iframe so the whole card can be dragged or moved with arrow keys; pointer targets snap to cells and avoid occupied spans. The Host persists explicit placements, while a narrow window may temporarily clamp and reflow them without overwriting the saved desktop layout. Agent-authored scripts call `window.dshWidget.state.get()` and `state.set(nextState)` through the same source-checked `postMessage` bridge as network fetches; the frame cannot choose another Widget id or access the storage files.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxwidgets--widgets-abstract-seam"></a>

### `ctx.widgets` — `Widgets` (abstract seam)

Registry and runtime operations for installed Widgets.

```ts cordis-catalog
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
```

Source: [`packages/widget/widgets/src/index.ts`](../../packages/widget/widgets/src/index.ts)

<a id="widgets-events"></a>

### `widgets/*` events

<a id="widgetschanged--emit"></a>

#### `widgets/changed` — emit

A managed Widget project changed on disk.

```ts cordis-catalog
/**
 * A managed Widget project changed on disk.
 * @mode emit
 * @param id - direct managed project directory id.
 */
'widgets/changed'(id: WidgetId): void
```

Source: [`packages/widget/widgets/src/types.ts`](../../packages/widget/widgets/src/types.ts)
<!-- END GENERATED cordis-surface -->
