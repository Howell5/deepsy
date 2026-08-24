import { describe, expect, it } from 'vitest'
import { parseWidgetManifest } from '../src/index.ts'

const base = {
  schemaVersion: 2,
  id: 'fixed-canvas',
  name: 'Fixed canvas',
  version: '1',
  runtime: 'static',
  entry: 'dist/index.html',
  sizes: ['small', 'medium'],
  defaultSize: 'small',
  permissions: { network: [] },
  refresh: { mode: 'manual', minimumIntervalSeconds: 30 },
} as const

describe('Widget manifest', () => {
  it('accepts only the semantic desktop sizes', () => {
    expect(parseWidgetManifest(base)).toMatchObject({
      sizes: ['small', 'medium'],
      defaultSize: 'small',
    })
    expect(() => parseWidgetManifest({
      ...base,
      sizes: ['extra-large'],
      defaultSize: 'extra-large',
    })).toThrow()
  })

  it('requires the default canvas to be declared', () => {
    expect(() => parseWidgetManifest({
      ...base,
      defaultSize: 'large',
    })).toThrow(/defaultSize must appear in sizes/)
  })
})
