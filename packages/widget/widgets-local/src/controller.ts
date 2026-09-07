/** Generated Remote access to the local Widget provider. */

import { type Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { openNativePath } from '@deepseek-ai/dsh-native-command'
import type {
  WidgetDocument, WidgetFetchResult, WidgetId, WidgetLayoutItem, WidgetState, WidgetView,
} from '@deepseek-ai/dsh-widgets/types'

/** Host operations exposed as the generated `widgets` namespace. */
export class WidgetController extends TypertRemoteService {
  static inject = ['widgets']

  /** @param ctx - Host context containing the Widget provider. */
  constructor(ctx: Context) {
    super(ctx, 'widgetController', { namespace: 'widgets' })
  }

  /** List validated managed projects.
   * @returns installed Widgets.
   */
  @Remote
  async list(): Promise<{ widgets: WidgetView[] }> {
    return { widgets: await this.ctx.widgets.list() }
  }

  /** Create an editable starter project.
   * @returns the new managed Widget.
   */
  @Remote
  async create(): Promise<{ widget: WidgetView }> {
    return { widget: await this.ctx.widgets.create() }
  }

  /** Read a validated static entry.
   * @param id - installed Widget identifier.
   * @returns entry HTML and metadata.
   */
  @Remote
  read(id: WidgetId): Promise<WidgetDocument> {
    return this.ctx.widgets.read(id)
  }

  /** Import a validated static project.
   * @param path - absolute project directory.
   * @returns the copied managed Widget.
   */
  @Remote
  async importProject(path: string): Promise<{ widget: WidgetView }> {
    return { widget: await this.ctx.widgets.install(path) }
  }

  /** Remove managed files while preserving the external source project.
   * @param id - managed Widget to remove.
   */
  @Remote
  removeProject(id: WidgetId): Promise<void> {
    return this.ctx.widgets.remove(id)
  }

  /** Restore durable interactive data.
   * @param id - installed Widget identifier.
   * @returns Host-owned JSON state.
   */
  @Remote
  async stateRead(id: WidgetId): Promise<{ state: WidgetState }> {
    return { state: await this.ctx.widgets.readState(id) }
  }

  /** Atomically replace durable interactive data.
   * @param id - installed Widget identifier.
   * @param state - complete next JSON state.
   */
  @Remote
  stateWrite(id: WidgetId, state: WidgetState): Promise<void> {
    return this.ctx.widgets.writeState(id, state)
  }

  /** Restore the desktop canvas.
   * @returns persisted logical placements.
   */
  @Remote
  async layoutRead(): Promise<{ layout: WidgetLayoutItem[] }> {
    return { layout: await this.ctx.widgets.readLayout() }
  }

  /** Atomically replace the desktop canvas placements.
   * @param layout - complete next placement list.
   */
  @Remote
  layoutWrite(layout: WidgetLayoutItem[]): Promise<void> {
    return this.ctx.widgets.writeLayout(layout)
  }

  /** Fetch through the installed Widget's network permission policy.
   * @param id - calling Widget.
   * @param url - permitted HTTPS URL.
   * @param signal - caller lifetime.
   * @returns bounded response.
   */
  @Remote
  fetch(id: WidgetId, url: string, signal: AbortSignal): Promise<WidgetFetchResult> {
    return this.ctx.widgets.fetch(id, url, signal)
  }

  /** Reveal a validated managed project in the native file manager.
   * @param id - installed Widget.
   * @param signal - caller lifetime.
   */
  @Remote
  async openFolder(id: WidgetId, signal: AbortSignal): Promise<void> {
    const { widget } = await this.ctx.widgets.read(id)
    await openNativePath(widget.sourcePath, signal)
  }
}
