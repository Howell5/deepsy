---
description: "Settings-footer release detection and download links for deepsy."
kind: "package-reference"
---
# @deepseek-ai/dsh-client-ui-update

English | [中文](README.zh.md)

## Summary

Settings-footer update indicator for the deepsy desktop shell.

## Table of Contents

- [Use and behavior](#use-and-behavior)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-and-behavior"></a>
## Use and behavior

## Purpose

Renders an update hint in the bottom-right of the settings panel when the packaged app version is behind the newest deepsy GitHub release. Checking and up-to-date states render nothing (zero-noise); an available update renders a link that opens the release page in the system browser.

## Behavior

- Detection source: `https://api.github.com/repos/Howell5/deepsy/releases?per_page=1` (CORS-enabled; newest release first, prereleases included).
- Current version: the `settings.footer` owner prop `currentVersion`, injected by the settings shell from `<meta name="dsh-version">` on the desktop startup page. Web-only mode has no meta tag and falls back to `0.0.0`, so the indicator stays silent.
- Comparison: npm `semver` strict greater-than, rc-aware.

<a id="model-experience"></a>
## Model Experience

None, as the browser-side release indicator never reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The indicator follows the application locale in English and Chinese; other locales are unavailable.
- Web-only mode cannot know the packaged version (no meta tag), so it cannot offer a reliable update comparison.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer context</summary>

No invariant companion is published. Slot and locale registries own the contribution lifecycles; the indicator keeps no Host state.

</details>
