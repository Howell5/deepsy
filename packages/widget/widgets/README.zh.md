# @deepseek-ai/dsh-widgets

[English](README.md) | 中文

本地已安装 Widget 的 Service Definition。它拥有第二版 manifest（元数据清单）解析器、品牌化 Widget 标识符、提供方错误代码、宿主拥有的状态与布局操作，以及宿主和 UI 消费方使用的 `ctx.widgets` 操作。

严格 manifest 接受一个静态入口文档、一种或多种语义尺寸 `small`／`medium`／`large`、精确的 HTTPS 主机名白名单和刷新声明。未知字段、格式错误的 id、不支持的运行时，以及未出现在 `sizes` 中的 `defaultSize` 都会导致解析失败。这三种尺寸分别占用 `1×1`、`2×1` 和 `2×2` 个逻辑单元格。提供方暴露经过校验的项目生命周期操作、受限且经过权限检查的 GET 请求、每个 Widget 的受限 JSON 状态文档，以及一份桌面逻辑画布布局。状态和布局是 Agent 可编辑项目之外的产品数据。

提供方失败使用 `WidgetError`，其代码为 `invalid-project`、`not-found`、`already-installed`、`permission-denied`、`network-failed` 或 `invalid-data`。消费方可以向用户展示错误消息，但应使用代码进行稳定分支。

受管理项目文件发生变化后，提供方会发送 `widgets/changed(id)`。该事件是失效通知，不是经过校验的文档快照：消费方会通过 `read()` 重新读取，并在编辑尚未完成时展示短暂的无效状态。

## 模型体验

无，因为本包定义面向人类的本地应用服务，不注册提示词、消息、schema、流或工具结果。

#### KV Cache effect

无；该服务不组装或发送 provider 请求。

## 已知限制与暂缓事项

- **第二版仅支持静态内容** —— 该服务没有构建、后台 worker、凭证或任意后端操作；持久状态是受限 JSON，而不是通用文件系统。
- **安装和实例布局属于同一单元** —— API 没有独立的产物版本或多实例身份，重复的 manifest id 会被拒绝。
