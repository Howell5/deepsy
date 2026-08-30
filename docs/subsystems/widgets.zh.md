# 本地 Widgets

[English](widgets.md) | 中文

Widgets 子系统为桌面客户端安装本地静态微型应用。[`ctx.widgets`](#ctxwidgets--widgets-abstract-seam) 将 manifest（元数据清单）与生命周期操作同本地文件系统提供方、宿主 RPC 和浏览器呈现分离。已安装项目是产品全局数据，不进入 Session 日志或模型上下文。

来源：[`packages/widget/widgets/src/index.ts`](../../packages/widget/widgets/src/index.ts)

## Manifest 与已安装视图

`WidgetId` 是使用小写短横线分段的、不透明 manifest id。第二版 `WidgetManifest` 指定一个静态 HTML 入口、支持的语义尺寸（`small`、`medium` 或 `large`）、默认尺寸、精确网络主机名和刷新元数据。这三种尺寸分别占用 `1×1`、`2×1` 和 `2×2` 个逻辑单元格。解析器拒绝未知字段、不支持的运行时、格式错误的 id 和不一致的尺寸声明。浏览器消费方把 iframe 固定为所选画布，禁止文档滚动，并把内容固有溢出报告为无效 Widget 布局。

`WidgetView` 把经过校验的 manifest 与受管理源路径和内置状态组合在一起。`WidgetDocument` 增加用于隔离渲染的受限自包含 HTML。`WidgetFetchResult` 只包含状态、内容类型和受限文本；提供方把传输凭证与网络权限保留在 frame 之外。`WidgetState` 是每个已安装 id 的一份受限 JSON 对象，`WidgetLayoutItem` 则记录语义尺寸及非负的逻辑列与行。

## 提供方义务

提供方每次读取时都校验持久路径和文档，只在受管理副本成功后发布安装，并且绝不通过 `remove()` 删除外部源目录。其 `fetch()` 实现执行调用方 manifest 的网络策略、取消和完整响应限制。状态和布局写入会校验 JSON，并在每个 Agent 可编辑项目之外原子替换仅所有者可读写的文件。

本地提供方把项目存储在 `$DSH_HOME/widgets/projects`，把每个 Widget 的状态存储在隐藏的 `.state` 目录，并把逻辑画布布局存储在 `.layout.json`。它写入 Calculator 和 Gold / USD 示例，并且只接受面向已声明公网主机的无凭证 HTTPS GET 请求。[包 README](../../packages/widget/widgets-local/README.zh.md)拥有精确限制和当前约束。

桌面端的**用 Agent 编辑**操作会把受管理项目路径注册为普通 Workspace，并在 Conversation 中打开其可复用空白会话。通用 `details.application` slot 在右栏承载实时 Widget 预览。精确受管理路径匹配会同时向空白 Hero 和活跃会话页头贡献预览开关，工作区级浏览器偏好会在普通 Session 导航后恢复该栏。本地提供方监听受管理项目，并通过 Remote 白名单转发 `widgets/changed(id)`；文件写入后，匹配的 iframe 会重新读取经过校验的文档。仅打开编辑界面绝不会发送模型请求。

桌面工作台把完整中间区域作为逻辑网格。编辑模式在每个 iframe 上方放置交互层，使整张卡片可以拖动或用方向键移动；指针目标会吸附到单元格并避开已占用范围。宿主持久化明确位置，较窄窗口可以临时约束并重排显示，但不会覆盖保存的桌面布局。退出编辑模式后，双击或明确的控件会在模态框中打开同一个入口，Escape 会将其关闭。`window.dshWidget.displayMode` 区分 `compact` 与 `expanded` 呈现，不改变 manifest 尺寸、Widget 身份、状态、权限或沙箱策略。Agent 编写的脚本通过与网络请求相同且校验消息来源的 `postMessage` 桥接调用 `window.dshWidget.state.get()` 和 `state.set(nextState)`；frame 不能选择其他 Widget id，也不能访问存储文件。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxwidgets--widgets-abstract-seam"></a>

### `ctx.widgets` — `Widgets` (abstract seam)

Registry and runtime operations for installed Widgets.

```ts cordis-catalog
/**
 * List every valid installed Widget in deterministic name order.
 * @returns validated installed Widget metadata.
 */
abstract list(): Promise<WidgetView[]>

/**
 * Create one valid managed starter project for Agent authoring.
 * @returns the newly created Widget metadata.
 */
abstract create(): Promise<WidgetView>

/**
 * Read one Widget's validated entry document.
 * @param id - installed Widget identifier.
 * @returns metadata and self-contained HTML.
 */
abstract read(id: WidgetId): Promise<WidgetDocument>

/**
 * Validate and copy one local static project into managed storage.
 * @param sourcePath - absolute source project directory.
 * @returns the installed Widget metadata.
 */
abstract install(sourcePath: string): Promise<WidgetView>

/**
 * Remove one managed Widget without deleting any external source directory.
 * @param id - installed Widget identifier.
 */
abstract remove(id: WidgetId): Promise<void>

/**
 * Read one Widget's Host-owned state document.
 * @param id - installed Widget identifier.
 * @returns persisted JSON state, or an empty object before the first write.
 */
abstract readState(id: WidgetId): Promise<WidgetState>

/**
 * Replace one Widget's Host-owned state document.
 * @param id - installed Widget identifier.
 * @param state - complete next JSON state.
 */
abstract writeState(id: WidgetId, state: WidgetState): Promise<void>

/**
 * Read the desktop canvas's logical Widget placements.
 * @returns persisted placements, or an empty layout before the first write.
 */
abstract readLayout(): Promise<WidgetLayoutItem[]>

/**
 * Replace the desktop canvas's logical Widget placements.
 * @param layout - complete next placement list.
 */
abstract writeLayout(layout: WidgetLayoutItem[]): Promise<void>

/**
 * Perform one permission-checked external GET for a Widget.
 * @param id - calling Widget identifier.
 * @param url - absolute HTTPS URL.
 * @param signal - caller lifetime.
 * @returns bounded textual response.
 */
abstract fetch(id: WidgetId, url: string, signal: AbortSignal): Promise<WidgetFetchResult>
```

Source: [`packages/widget/widgets/src/index.ts`](../../packages/widget/widgets/src/index.ts)

<a id="widgets-events"></a>

### `widgets/*` events

<a id="widgetschanged--emit"></a>

#### `widgets/changed` — emit

A managed Widget project changed on disk.

```ts cordis-catalog
/**
 * A managed Widget project changed on disk.
 * @mode emit
 * @param id - direct managed project directory id.
 */
'widgets/changed'(id: WidgetId): void
```

Source: [`packages/widget/widgets/src/types.ts`](../../packages/widget/widgets/src/types.ts)
<!-- END GENERATED cordis-surface -->
