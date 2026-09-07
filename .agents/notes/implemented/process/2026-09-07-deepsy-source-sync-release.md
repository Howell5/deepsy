# Agent Note: Publish desktop updates from synchronized source

Status: implemented

English | [中文](2026-09-07-deepsy-source-sync-release.zh.md)

## Problem

A newer upstream npm version does not update the source embedded in a desktop installer. A version-only release can advertise an upgrade while shipping the same behavior.

## Decision

The [GitHub workflow](../../../../.github/workflows/deepsy-release.yml) checks upstream Git ancestry every six hours. It merges new source into the fork, resolves only isolated version conflicts, installs dependencies, and runs desktop integration checks before packaging and pushing. A normal push rejects concurrent master changes. Published tags and assets are not replaced; uploads remain drafts until complete. Manual dispatch can publish the current master version or report updates without publishing.

The desktop version follows a newer upstream version. Source changes without a newer version increment a fork revision so update detection remains monotonic. [Ad-hoc signing](2026-08-18-adhoc-sign-macos-release-artifacts.md) remains independently owned and unchanged.

Native dependencies are force-rebuilt in the isolated deployment for the declared Electron version. System-Node rebuilds can replace a binary without removing Electron's ABI marker, so trusting that marker alone can package an incompatible addon.

## Alternatives considered

**Bump only to the npm dist-tag.** Rejected because that changes labels without incorporating the upstream implementation.

**Use a Codex scheduler.** Rejected because the repository workflow can run without a desktop session and already owns packaging credentials and logs.

**Resolve every merge conflict automatically.** Rejected because desktop-specific behavior needs review when upstream changes its interfaces. Such conflicts stop publication and retain the last published version.

## Consequences

The desktop deploy manifest explicitly supplies required workspace peers because production deployment does not install them automatically. Staging reuses the existing runtime-closure gate; release packaging also boots the installed backend under Electron with temporary user data before publication. Source-only browser checks cannot detect omitted production dependencies. Translation pairing excludes desktop build artifacts, while continuing to check the desktop source README.

Routine compatible changes can publish without an operator. Conflicts, validation failures, and concurrent updates require a maintainer; a schedule is not a guarantee of a release on every run. Focused version/conflict tests and the assembled desktop startup checks guard the source-to-package path.
