---
description: "deepsy 设置页的版本检测与下载链接。"
kind: "package-reference"
---
# @deepseek-ai/dsh-client-ui-update

[English](README.md) | 中文

## 概述

deepsy 桌面壳的设置页底部更新提示。

## 目录

- [使用与行为](#use-and-behavior)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-and-behavior"></a>
## 使用与行为

## 用途

打包应用版本落后于 deepsy 最新 GitHub release 时，在设置面板右下角渲染一个更新提示。检查中与已是最新的状态不渲染任何内容（零噪音）；有可用更新时渲染一个链接，在系统浏览器中打开 release 页面。

## 行为

- 检测源：`https://api.github.com/repos/Howell5/deepsy/releases?per_page=1`（允许 CORS；最新的 release 排在最前，包含预发布）。
- 当前版本：`settings.footer` owner 属性 `currentVersion`，由设置壳从桌面启动页的 `<meta name="dsh-version">` 注入。纯 Web 模式没有 meta 标签，回退为 `0.0.0`，因此不显示更新提示。
- 比较：npm `semver` 严格大于，感知 rc。

<a id="model-experience"></a>
## 模型体验

无，因为浏览器侧 release 提示永远不会进入模型请求。

#### KV 缓存影响

无；此包既不组装也不发送供应商请求。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- 更新提示跟随应用语言，支持英文和中文；其他语言尚不可用。
- 纯 Web 模式无法知道打包版本（没有 meta 标签），因此无法提供可靠的更新比较。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护上下文</summary>

不发布不变式伴生入口。Slot 与 locale 注册表拥有贡献项的生命周期；更新提示不保留 Host 状态。

</details>
