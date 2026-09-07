---
description: "Widget manifests, durable state, and provider operations."
kind: "package-reference"
---
# @deepseek-ai/dsh-widgets

English | [中文](README.zh.md)

## Summary

Service Definition for locally installed Widgets. It owns the version 2 manifest parser, branded Widget identifiers, provider error codes, Host-owned state and layout operations, and the `ctx.widgets` operations used by Host and UI Consumers.

## Table of Contents

- [Use and behavior](#use-and-behavior)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-and-behavior"></a>
## Use and behavior

The strict manifest accepts a static entry document, one or more semantic `small`/`medium`/`large` sizes, an exact HTTPS hostname allowlist, and a refresh declaration. Unknown fields, malformed ids, unsupported runtimes, and a `defaultSize` absent from `sizes` fail parsing. Sizes occupy `1×1`, `2×1`, and `2×2` logical cells respectively. Providers expose validated project lifecycle operations, bounded permission-checked GET requests, a bounded JSON state document per Widget, and one logical desktop-canvas layout. State and layout are product data outside the Agent-editable project.

Provider failures use `WidgetError` with `invalid-project`, `not-found`, `already-installed`, `permission-denied`, `network-failed`, or `invalid-data`. Consumers may present the message to the user but use the code for stable branching.

Providers emit `widgets/changed(id)` after a managed project's files change. The event is an invalidation signal rather than a validated document snapshot: Consumers re-read through `read()` and present any transient invalid state while an edit is incomplete.

<a id="model-experience"></a>
## Model Experience

None, as this package defines a human-facing local application service and registers no prompt, message, schema, stream, or tool result.

#### KV Cache effect

None; the service does not assemble or send provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Version 2 is static-only** — the service has no build, background worker, credential, or arbitrary backend operation; persistent state is bounded JSON rather than a general filesystem.
- **Installation and instance placement are the same unit** — the API has no separate artifact version or multi-instance identity, and duplicate manifest ids are rejected.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer context</summary>

No invariant companion is published. This Service Definition owns no mutable runtime data; providers validate persisted documents.

</details>
