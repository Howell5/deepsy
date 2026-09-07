# deepsy 桌面端

[English](README.md) | 中文

deepsy 是随 DeepSeek Harness Web 客户端交付的 Electron 桌面壳。渲染器启用 Chromium 沙箱、关闭 Node 集成、启用上下文隔离，并默认拒绝权限请求。Harness profile 运行于独立的 Electron Utility Process，并监听由操作系统分配的随机回环端口。

## 开发

在仓库根目录运行：

```sh
pnpm run dev:desktop
```

该命令会先构建 Host 库、浏览器 bundle 和桌面入口，再打开 Electron。运行中的应用不会使用系统安装的 Node.js；Utility Process 使用 Electron 自带的运行时。

## 打包

```sh
pnpm run package:desktop
```

暂存步骤先验证必需的 workspace peer 和 preset 插件，再通过 `pnpm deploy` 生成生产依赖，最后由 Electron Builder 创建对应平台的安装产物。由于 Electron Utility Process 的入口必须是实体文件，应用资源暂不封装进 ASAR。macOS 打包后，`pnpm --filter @deepseek-ai/dsh-desktop run smoke` 会在隔离的 Electron Utility Process 中启动包内后端并检查认证 HTTP 就绪状态，不打开用户窗口，也不访问已有用户数据。

## 当前边界

暂存步骤会在隔离部署目录中为声明的 Electron 版本强制重建原生依赖。重复打包不会仅因旧 Electron ABI 缓存标记仍然存在，就复用系统 Node 的二进制文件。

首版桌面载体通过随机回环端口复用已经验证的 HTTP/WebSocket Web profile。后端进程与桌面主进程隔离，端口不会监听到回环之外，但本机其他进程仍可能探测它。后续生产硬化会把载体替换为已经规划的 IPC 传输；该改动不需要重写产品 UI。

Electron 会在打包应用中阻止 Node internals 标志，因此此界面不启用 profile patch 实时监听。编辑 profile patch 后需要重启 deepsy。

桌面壳保留后端就绪 URL 中的认证令牌，并关闭 CLI 的外部浏览器启动。[发布工作流](../../.github/workflows/deepsy-release.yml) 每六小时检查上游 Git 历史；它合并源码并验证桌面端后才发布新包。源码冲突或检查失败会停止发布。
