/** Merge upstream source into a disposable release checkout before validation. */

import { execFileSync, spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { compareVersions } from '../release/bump.ts'
import { isEntry } from '../release/process.ts'

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

/**
 * Choose a strictly newer desktop version for newly merged source.
 * @param current - last desktop version.
 * @param upstream - version declared by upstream source.
 * @returns upstream's newer version, or a fork revision when it has not advanced.
 */
export function nextDesktopVersion(current: string, upstream: string): string {
  if (compareVersions(upstream, current) > 0) return upstream
  if (current.includes('-')) {
    const revision = /^(.*\.deepsy\.)(\d+)$/.exec(current)
    return revision === null ? `${current}.deepsy.1` : `${revision[1]}${Number(revision[2]) + 1}`
  }
  const parts = current.split('.').map(Number)
  return `${parts[0]}.${parts[1]}.${(parts[2] as number) + 1}`
}

/**
 * Resolve only isolated package version conflicts; every other conflict remains visible.
 * @param content - Git's conflicted manifest text.
 * @returns text with version-only hunks resolved to the newer value.
 */
export function resolveVersionConflicts(content: string): string {
  return content.replace(
    /^<<<<<<<[^\n]*\n(\s*"version": "([^"]+)",\n)=======\n(\s*"version": "([^"]+)",\n)>>>>>>>[^\n]*\n/gm,
    (_match, left: string, leftVersion: string, right: string, rightVersion: string) =>
      compareVersions(leftVersion, rightVersion) >= 0 ? left : right,
  )
}

function output(values: Record<string, string | boolean>): void {
  console.log(JSON.stringify(values, null, 2))
  if (process.env.GITHUB_OUTPUT !== undefined) {
    appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values)
      .map(([key, value]) => `${key}=${String(value)}\n`).join(''))
  }
}

function main(): void {
  if (git('status', '--porcelain') !== '') throw new Error('source synchronization requires a clean checkout')
  const current = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version
  if (process.argv.includes('--release-current')) {
    output({ updateAvailable: true, target: current, sourceChanged: false })
    return
  }
  git('fetch', '--no-tags', 'https://github.com/deepseek-ai/deepseek-harness.git',
    'master:refs/remotes/upstream/master')
  const upstream = git('rev-parse', 'upstream/master')
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', upstream, 'HEAD'])
  if (ancestry.status === 0) {
    output({ updateAvailable: false, target: current, sourceChanged: false, upstream })
    return
  }
  if (ancestry.status !== 1) throw new Error('cannot determine upstream ancestry')
  const upstreamVersion = (JSON.parse(git('show', 'upstream/master:package.json')) as { version: string }).version
  const target = nextDesktopVersion(current, upstreamVersion)
  if (process.argv.includes('--dry-run')) {
    output({ updateAvailable: true, target, sourceChanged: true, upstream })
    return
  }

  const merge = spawnSync('git', ['merge', '--no-commit', '--no-ff', upstream], { stdio: 'inherit' })
  if (merge.status !== 0) {
    const conflicted = git('diff', '--name-only', '--diff-filter=U').split('\n').filter(Boolean)
    if (conflicted.length === 0) throw new Error('upstream merge failed without resolvable conflicts')
    for (const path of conflicted) {
      if (path !== 'package.json' && !path.endsWith('/package.json')) continue
      const resolved = resolveVersionConflicts(readFileSync(path, 'utf8'))
      if (/^<<<<<<<|^=======|^>>>>>>>/m.test(resolved)) continue
      writeFileSync(path, resolved)
      git('add', '--', path)
    }
    const remaining = git('diff', '--name-only', '--diff-filter=U')
    if (remaining !== '') throw new Error(`upstream conflicts require manual resolution; nothing published:\n${remaining}`)
  }
  for (const path of git('ls-files', 'package.json', 'apps/*/package.json', 'packages/*/*/package.json').split('\n')) {
    const text = readFileSync(path, 'utf8')
    const manifest = JSON.parse(text) as { name: string; version: string }
    if (manifest.name === '@deepseek-ai/dsh' || manifest.name.startsWith('@deepseek-ai/dsh-')) {
      writeFileSync(path, text.replace(/"version": "[^"]+"/, `"version": "${target}"`))
    }
  }
  output({ updateAvailable: true, target, sourceChanged: true, upstream })
}

if (isEntry(import.meta.url)) main()
