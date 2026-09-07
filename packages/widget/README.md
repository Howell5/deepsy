---
description: "Local Widget service definitions, storage, and desktop presentation."
kind: "package-group"
---
# Widget Packages

English | [中文](README.zh.md)

## Summary

Local mini-application capability family. Widgets are validated static projects rendered by the desktop client; the Host owns managed storage and all external requests.

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

<a id="packages"></a>
## Packages

| Package | Role | `ctx` key |
|---|---|---|
| [`widgets`](widgets/README.md) | Service Definition, manifest parser, operations, and errors | `widgets` |
| [`widgets-local`](widgets-local/README.md) | Local Service Provider, built-in examples, storage, and network policy | provides `widgets` |

The browser Consumer is [`dsh-client-ui-widgets`](../client/ui-widgets/README.md), and the shipped composition mounts the local provider through [`dsh-web-app`](../bundle/web-app/README.md).

<a id="related-documentation"></a>
## Related documentation

[Widgets subsystem](../../docs/subsystems/widgets.md)

<a id="dev-note"></a>
## Dev Note

None.
