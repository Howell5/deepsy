---
description: "本地 Widget 的服务定义、存储与桌面呈现。"
kind: "package-group"
---
# Widget 包

[English](README.md) | 中文

## 概述

本地微型应用能力系列。Widget 是由桌面客户端渲染的、经过校验的静态项目；宿主持有受管理存储和所有外部请求。

## 目录

- [包](#packages)
- [相关文档](#related-documentation)
- [开发备注](#dev-note)

<a id="packages"></a>
## 包

| 包 | 角色 | `ctx` 键 |
|---|---|---|
| [`widgets`](widgets/README.zh.md) | Service Definition、manifest（元数据清单）解析器、操作和错误 | `widgets` |
| [`widgets-local`](widgets-local/README.zh.md) | 本地 Service Provider、内置示例、存储和网络策略 | 提供 `widgets` |

浏览器消费方是 [`dsh-client-ui-widgets`](../client/ui-widgets/README.zh.md)，发行版组合通过 [`dsh-web-app`](../bundle/web-app/README.zh.md) 挂载本地提供方。

<a id="related-documentation"></a>
## 相关文档

[Widgets 子系统](../../docs/subsystems/widgets.zh.md)

<a id="dev-note"></a>
## 开发备注

无。
