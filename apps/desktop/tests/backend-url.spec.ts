import { expect, it } from 'vitest'
import { backendReadyUrl } from '../src/backend-url.ts'

it('waits for a complete startup line and retains authentication', () => {
  const url = 'http://127.0.0.1:4567/?token=test-token'
  expect(backendReadyUrl(`dsh web: ${url}`)).toBeUndefined()
  expect(backendReadyUrl(`booting\ndsh web: ${url}\n`)).toBe(url)
  expect(backendReadyUrl(`dsh web: ${url} (LAN: http://192.168.1.1:4567/)\n`)).toBe(url)
  expect(backendReadyUrl('dsh web: http://example.com:4567/\n')).toBeUndefined()
})
