# Agent Note: Local Widgets workspace

Status: implemented

English | [中文](2026-08-20-local-widgets-workspace.zh.md)

## Problem

Users need small personal tools such as weather boards, selected market views, currency conversion, calculators, and narrow monitors. These tools are too specific to become permanent product features but should remain available after the Session that created them. Running every generated project as a development server would add system Node.js, package-manager state, port allocation, process supervision, and broad backend authority to the desktop runtime.

DeepSeek Harness needs one durable place to install and revisit local mini-applications while keeping their execution authority narrower than the desktop Host.

## Decision

The desktop composition includes a first-class **Widgets** application below the Workspace browser and above Settings. Selecting it preserves the current Session and replaces the center Conversation view with a Widget grid. Starting or opening a Session selects Conversation again.

Version 2 accepts a local directory containing a strict `widget.json` manifest and one self-contained static HTML entry. The manifest declares one or more semantic `small`, `medium`, or `large` sizes and a default size; these occupy `1×1`, `2×1`, and `2×2` logical cells. The local provider validates and copies those files into `$DSH_HOME/widgets/projects/<id>` through a staging rename. It can also create a uniquely identified starter containing the manifest, entry, and project-local `AGENTS.md` authoring rules. The Workspace instruction loader supplies those rules to every model request that creates or changes the Widget. They require the Agent to infer the use context, form a private design read, implement one domain-specific visual system, self-review data states, accessibility, and anti-template criteria, and use the Host state bridge for durable interaction data without asking the user to configure a style. The provider never invokes `npm install`, package scripts, arbitrary build commands, or one localhost server per Widget.

Two built-in projects establish both runtime paths. Quick Calculator has no permissions and supports all three sizes. Gold / USD supports `medium` and `large`, requests public daily history from `xaus.com` through the Host bridge, and draws the latest 90 observations; the card identifies the data as indicative.

The Widgets application uses the complete center area as a logical canvas. Users enter an explicit edit mode, drag the whole card, and drop it onto snapped grid cells; arrow keys provide the same move operation. Occupied targets resolve to the next free cell. The Host stores explicit `{ id, size, column, row }` placements in an owner-only file. Narrow windows may temporarily clamp and reflow the saved placements for display, but resizing alone never overwrites the desktop layout.

**New Widget** creates the managed starter and immediately adopts its directory as an ordinary Workspace, opens its blank Session in Conversation, and selects a live preview in the right details column. Each existing card's **Talk to this Widget** action performs the same handoff. Exact managed-path matching adds one preview toggle to both the blank Hero and active Session header. Browser storage records whether the preview is open for that Workspace: either handoff opts in, ordinary Workspace or Session navigation restores the preference, and either preview close control opts out. The actions never send a prompt by themselves. The local provider watches the managed root and publishes `widgets/changed(id)` after settled writes; the Remote projection forwards that invalidation so every visible frame for the Widget re-reads the validated entry and every adopted Workspace takes the current manifest name as its display title.

## Runtime and network policy

Cards render Host-validated HTML through `iframe sandbox="allow-scripts"` at the selected semantic size. The parent injects fixed-canvas rules that disable scrolling without scaling content. A layout observer reports intrinsic overflow to the parent, which replaces an overflowing document with an invalid-layout error; generated pages must fit every size they declare. The parent also injects a Content Security Policy that denies direct connections, navigation authority, Node integration, and filesystem access. Embedded scripts call `window.dshWidget.fetch(url)`, `state.get()`, and `state.set(nextState)` through `postMessage`; the parent accepts requests only from that card's frame, supplies the calling Widget id itself, and forwards them to the typed Host RPC domain.

The local provider allows only credential-free HTTPS GET requests to exact manifest hostnames. It checks each redirect and resolved address, rejects private destinations and non-default ports, limits requests to 15 seconds and three redirects, and caps each response at 512 KiB. The frame receives response status, content type, and text, never Host credentials.

Each installed Widget owns one bounded JSON object under `$DSH_HOME/widgets/projects/.state/<id>.json`; the logical canvas lives in `.layout.json`. These files are outside every Agent-editable project, ignored by the project watcher, owner-only, and replaced atomically. A state document has at most 256 keys and 64 KiB, and a layout has at most 256 placements and 128 KiB. Removing a non-built-in Widget removes its state. The state API deliberately has no arbitrary path, filesystem, database, or cross-Widget access.

## Package ownership

| Package | Responsibility |
|---|---|
| `packages/widget/widgets` | Service Definition, strict manifest/state/layout parsers, branded ids, operations, and stable errors |
| `packages/widget/widgets-local` | Managed project and Host-owned data storage, built-in examples, path validation, file-change publication, and external request policy |
| `packages/host/apiproxy` | Typed Widget lifecycle, state, layout, and fetch RPC methods plus carrier schemas |
| `packages/client/ui-widgets` | Sidebar entry, snapped canvas, Agent editing handoff, live preview, isolated frames, and frame-to-Host bridge |
| `packages/client/ui-layout`, `packages/client/ui-sidebar`, and `packages/client/ui-conversation` | Generic root/details application selection plus Session-header and blank-Hero utility slots |

The Service Definition contains no UI or transport assumptions. The UI reads projects only through Host methods and never accesses local directories directly.

## Verification

Provider tests cover starter creation, example seeding, static project import, duplicate rejection, state and layout persistence outside project files, undeclared network denial, watcher invalidation, and watcher disposal. Client tests cover logical placement, collision avoidance, semantic resizing, keyboard movement persistence, Workspace reuse, adoption, manifest-name synchronization, and preview preference persistence for Agent editing. The built Web journey creates a starter, enters its blank Session with the preview open, then covers the same handoff and preview restoration for an existing Widget. API carrier tests exercise Widget request and response serialization through the real fetch handler. Client and Host aggregate TypeScript programs include every package, and the shipped Web/desktop composition mounts the provider and UI together.

## Alternatives considered

**Run one localhost development server per Widget.** Rejected because it requires Node.js, dependencies, ports, child-process cleanup, and arbitrary backend execution on end-user computers.

**Build weather, stocks, gold, and calculators as fixed product components.** Rejected because the product value is a container for user-owned software that an agent can continue to edit; built-ins are examples, not the extension model.

**Use only a declarative dashboard schema.** Rejected because it cannot express the interactive tools users will request. Static Web documents preserve ordinary UI behavior inside a bounded runtime.

**Load projects through Electron `webview` or Node integration.** Rejected because generated code would inherit desktop authority beyond its declared network hosts.

**Keep preview availability only in the Widgets-card handoff.** Rejected because the preview belongs to the managed project, not one navigation path; returning through the ordinary Workspace browser must retain an explicit way to open it.

**Use iframe `localStorage` for Widget data and browser storage for layout.** Rejected because sandboxed frames have an opaque origin, state would depend on one browser profile and rendering context, and Agent edits or frame recreation could detach data from the installed Widget identity.

**Add a database or expose project files to generated code.** Rejected because bounded JSON replacement already provides the required durability. A database adds schema and lifecycle weight, while filesystem access would broaden generated-code authority beyond state persistence.

## Consequences

The desktop can run useful local Widgets without a system Node.js installation or per-project server, and networked Widgets have one auditable Host mediation point. The same application slots can host later first-class desktop surfaces without making them Session views.

The provider deliberately copies only the manifest and one self-contained HTML entry. Its authoring flow reuses the ordinary Workspace, Session, composer, and details column instead of adding a separate editor. Preview-open preference remains browser-local presentation state, while Widget data and canvas placement are Host-owned files rather than Session-log data. The platform has no asset directory, credential bridge, interval scheduler, approval UI, updates, multi-instance identity, disable state, or standalone focused view. Those additions require separate decisions because they broaden durable state or runtime authority.
