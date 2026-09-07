import { expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { verifyRuntimeClosure } from '../verify-runtime-closure.ts'

it('supplies the packaged desktop with every required workspace peer and preset plugin', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const result = await verifyRuntimeClosure(root, 'apps/desktop/package.json')
  expect(result.failures).toEqual([])
})
