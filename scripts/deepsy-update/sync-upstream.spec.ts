import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { nextDesktopVersion, resolveVersionConflicts } from './sync-upstream.ts'

describe('desktop source synchronization', () => {
  it('advances versions only after new source is selected', () => {
    expect(nextDesktopVersion('0.1.2-rc.1', '0.1.3-alpha.1')).toBe('0.1.3-alpha.1')
    expect(nextDesktopVersion('0.1.3-alpha.1', '0.1.3-alpha.1')).toBe('0.1.3-alpha.1.deepsy.1')
    expect(nextDesktopVersion('0.1.3-alpha.1.deepsy.1', '0.1.3-alpha.1')).toBe('0.1.3-alpha.1.deepsy.2')
    expect(nextDesktopVersion('1.2.3', '1.2.2')).toBe('1.2.4')
  })

  it('resolves version-only conflicts without hiding dependency or source conflicts', () => {
    const conflict = '<<<<<<< HEAD\n  "version": "0.1.2-rc.1",\n=======\n  "version": "0.1.3-alpha.1",\n>>>>>>> upstream\n'
    expect(resolveVersionConflicts(conflict)).toBe('  "version": "0.1.3-alpha.1",\n')
    const dependency = conflict.replaceAll('version', 'dependency')
    expect(resolveVersionConflicts(dependency)).toBe(dependency)
  })

  it('merges real source, leaves dry runs untouched, and stops on source conflicts', () => {
    const root = mkdtempSync(join(tmpdir(), 'deepsy-sync-'))
    const upstream = join(root, 'upstream')
    const fork = join(root, 'fork')
    const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
    const commit = (cwd: string) => {
      git(cwd, 'add', '.')
      git(cwd, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture')
    }
    const sync = (...args: string[]) => spawnSync(process.execPath, [
      '--import', import.meta.resolve('tsx/esm'), fileURLToPath(new URL('./sync-upstream.ts', import.meta.url)), ...args,
    ], { cwd: fork, encoding: 'utf8', timeout: 30_000, env: { ...process.env, GITHUB_OUTPUT: undefined } })
    try {
      git(root, 'init', '-b', 'master', upstream)
      writeFileSync(join(upstream, 'package.json'), '{"name":"@deepseek-ai/dsh","version": "1.0.0"}\n')
      writeFileSync(join(upstream, 'source.txt'), 'base\n')
      commit(upstream)
      git(root, 'clone', upstream, fork)
      git(fork, 'config', `url.${upstream}.insteadOf`, 'https://github.com/deepseek-ai/deepseek-harness.git')
      git(fork, 'config', 'user.name', 'Fixture')
      git(fork, 'config', 'user.email', 'fixture@example.invalid')
      writeFileSync(join(upstream, 'source.txt'), 'upstream feature\n')
      commit(upstream)

      const dry = sync('--dry-run')
      expect(dry.error).toBeUndefined()
      expect(dry.signal).toBeNull()
      expect(dry.status, dry.stderr).toBe(0)
      expect(JSON.parse(dry.stdout)).toMatchObject({ sourceChanged: true, target: '1.0.1' })
      expect(readFileSync(join(fork, 'source.txt'), 'utf8')).toBe('base\n')
      expect(git(fork, 'status', '--porcelain')).toBe('')

      const merged = sync()
      expect(merged.error).toBeUndefined()
      expect(merged.signal).toBeNull()
      expect(merged.status, merged.stderr).toBe(0)
      expect(readFileSync(join(fork, 'source.txt'), 'utf8')).toBe('upstream feature\n')
      expect(JSON.parse(readFileSync(join(fork, 'package.json'), 'utf8')).version).toBe('1.0.1')
      commit(fork)
      expect(git(fork, 'merge-base', '--is-ancestor', git(upstream, 'rev-parse', 'HEAD'), 'HEAD')).toBe('')
      const unchanged = sync()
      expect(unchanged.status, unchanged.stderr).toBe(0)
      expect(JSON.parse(unchanged.stdout)).toMatchObject({ updateAvailable: false })

      writeFileSync(join(fork, 'source.txt'), 'desktop change\n')
      commit(fork)
      const checkpoint = git(fork, 'rev-parse', 'HEAD')
      writeFileSync(join(upstream, 'source.txt'), 'incompatible upstream change\n')
      commit(upstream)
      const conflict = sync()
      expect(conflict.error).toBeUndefined()
      expect(conflict.signal).toBeNull()
      expect(conflict.status).toBe(1)
      expect(conflict.stderr).toContain('nothing published')
      expect(git(fork, 'rev-parse', 'HEAD')).toBe(checkpoint)
      expect(git(fork, 'diff', '--name-only', '--diff-filter=U')).toBe('source.txt')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
