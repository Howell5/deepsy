/**
 * Web update plugin, browser half: the settings-footer update indicator,
 * registered into the `settings.footer` seat owned by the settings domain.
 * Zero business face — the version arrives through the seat owner prop and
 * the release list through the injected fetcher; the decision logic is pure
 * (update-check.ts). Copy follows the application locale.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings slot contract (SlotMap seat + owner props)
// and the ui-slots Context merge (ctx.slots) into the program.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { UpdateStatus } from './UpdateStatus.tsx'

/** Required service: the slot registry. */
export const inject = ['slots', 'locale']

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    update: 'available'
  }
}

/**
 * Client plugin body: register the update indicator into the settings footer.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register('update', {
    en: { available: 'Version {version} available' },
    zh: { available: '新版本 v{version} 可用' },
  }), 'ui-update: dictionaries')
  ctx.slots.inject('settings.footer', () => ctx.slots.register(
    { name: 'settings.footer', locale: 'update' },
    UpdateStatus,
  ))
}
