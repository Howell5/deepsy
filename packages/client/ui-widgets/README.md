# @deepseek-ai/dsh-client-ui-widgets

English | [中文](README.zh.md)

Browser-side Widgets application for the desktop composition. It contributes a first-class row to `sidebar.application`, a root-scoped surface to `application`, and a session-scoped live preview to `details.application`; selecting the row preserves the current Session while replacing the conversation center with the Widget grid.

The workspace lists installed projects through the Host Widgets RPC domain and imports a local project through the native directory picker. Its full-width logical canvas supports semantic `small`, `medium`, and `large` cards occupying `1×1`, `2×1`, and `2×2` cells. Edit mode makes the whole card draggable, snaps drops to free cells, exposes arrow-key movement, and persists explicit positions through the Host; narrow windows temporarily reflow without overwriting the saved desktop layout. Outside edit mode, a double-click or the visible expanded-view control opens the same Widget in a large modal, and Escape, the close control, or the mask returns to the canvas. **New Widget** creates a managed starter and immediately opens it as an ordinary Agent Workspace with its blank Session and live preview. **Talk to this Widget** performs the same handoff for an existing card. An exact managed-path match adds the same preview toggle to the blank Hero and active Session header; its Workspace-level browser preference restores the right column when the user later enters through the ordinary Workspace browser, while an explicit close keeps it closed. Neither action sends a prompt or starts a paid model request; the user describes the requested tool or change in the ordinary composer. Host file-change events reload the matching frame and synchronize an adopted Workspace's display title with the current manifest name after an agent or external editor writes the project.

Each card gives its iframe the complete selected semantic canvas and never stretches the frame from document content. The injected canvas rules disable document scrolling; a layout observer reports intrinsic overflow and replaces the frame with an invalid-layout error until the project fits the declared size. The Host-validated HTML renders with `iframe sandbox="allow-scripts"`. The injected Content Security Policy denies direct connections and all capabilities except inline scripts and styles plus embedded images and fonts. `window.dshWidget.displayMode` is `compact` on the canvas and `expanded` in the modal; both presentations load the same entry under the same Widget id, state, network permissions, and security policy. `window.dshWidget.fetch(url)` and `window.dshWidget.state.get()`/`state.set(nextState)` cross a versioned `postMessage` bridge; the parent verifies the source frame, supplies its installed Widget id, and delegates requests to Host permission and persistence checks.

The package includes no runtime Node.js dependency and starts no per-Widget localhost server. The bundled calculator runs offline. The Gold / USD example loads daily history through the Host bridge and displays an error with retry when the provider is unavailable.

## Model Experience

None, as this package is a browser-side application container and registers no prompt, message, schema, stream, or tool result.

#### KV Cache effect

None; the UI and its Host bridge never assemble or send model requests.

## Known Limitations and Deferred Work

- **One installed project is one canvas instance** — layout has no separate instance id, so duplicate cards, disable, remove UI, and settings are deferred.
- **Refresh policy is manual at the container level** — a Widget may load data when its frame opens, but `visible-interval` scheduling and stale-state persistence are not implemented.
- **The bridge exposes GET-style fetch and bounded JSON state** — credentials, theme, locale, notifications, arbitrary files, and background execution are unavailable.
