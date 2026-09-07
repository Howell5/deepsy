/** Widget-specific generated Remote operations used by this UI. */
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'

/** Installed Widget operations and native directory selection. */
export type WidgetApi = Pick<ClientRemote, 'widgets' | 'directoryPicker'>
