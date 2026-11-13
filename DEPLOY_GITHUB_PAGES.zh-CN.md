# ARBOR 第三版：自行部署到 GitHub Pages

此 ZIP 提供完整源码、锁定依赖、预构建 `dist/` 和 GitHub Actions 工作流。你可以自行部署到 `SciAporia/ai4science-atlas`；本次交付不代表已经推送或上线。

## 1. 解压并放到仓库根目录

先解压 ZIP，再把其中的项目内容放入仓库根目录。不要把 ZIP 文件本身作为网站上传，也不要多套一层项目文件夹。

根目录中应直接看到以下文件：

| 路径 | 用途 |
| --- | --- |
| `package.json`、`package-lock.json` | 构建配置与锁定依赖 |
| `index.html`、`vite.config.ts` | Vite 入口与相对资源路径 |
| `app/`、`components/`、`src/`、`lib/`、`data/` | 网站源码与研究数据 |
| `public/` | 三维引擎、字体与原始综述 |
| `.github/workflows/deploy.yml` | 自动构建和发布流程 |
| `dist/` | 已构建的静态网站，可直接使用 HTTP 服务器预览 |

**务必保留 `.github` 目录。** 文件管理器可能默认隐藏它；复制时请显示隐藏文件。通过 GitHub 网页上传后，也要确认仓库里存在 `.github/workflows/deploy.yml`。使用本地 Git 或 GitHub Desktop 复制并提交整个项目更便于核对目录结构；已有仓库的 `.git` 历史保留在本地，不需要从 ZIP 中获取。

目标仓库：<https://github.com/SciAporia/ai4science-atlas>

## 2. 设置发布来源

在目标仓库依次打开：

1. **Settings → Pages**。
2. 在 **Build and deployment** 下，将 **Source** 设为 **GitHub Actions**。
3. 本项目已经包含工作流，不需要再创建 GitHub 推荐的模板。

这一步需要该仓库的管理或维护权限。GitHub 的官方操作说明：[Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 3. 提交到 `main` 并运行工作流

将解压后的内容提交到 `main`。现有 `.github/workflows/deploy.yml` 会在 `main` 收到推送后执行：

1. 使用 Node.js **24**。
2. 运行 `npm ci`，按照锁文件安装依赖。
3. 运行 `npm run build`，依次校验数据、检查 TypeScript、生成 `dist/`。
4. 上传 `dist/` 并发布至 GitHub Pages。

如果文件已经提交，但随后才开启 Pages，可在 **Actions → Deploy ARBOR to GitHub Pages → Run workflow** 手动运行，并选择 `main`。如果实际使用其他分支，需要同步修改工作流中的 `branches: [main]`。

等待构建和部署两个任务成功后，在 **Settings → Pages** 或工作流的 `github-pages` 环境中查看实际访问地址。没有自定义域名时，目标地址通常为：

<https://sciaporia.github.io/ai4science-atlas/>

这是预期的部署地址；只有工作流成功后才代表该版本已经上线。

## 4. 本地预览与后续维护

如果只想查看 ZIP 中的现成页面，在项目根目录运行：

```sh
python3 -m http.server 8000 --directory dist
```

然后访问 <http://localhost:8000>。不要双击 `dist/index.html` 使用 `file://` 打开；浏览器会限制模块加载。

修改源码或 `data/` 后，使用 Node.js 24 在项目根目录执行：

```sh
npm ci
npm run build
npm run preview
```

`npm run preview` 会在终端显示预览地址。部署工作流会重新构建源码，因此仅修改预构建 `dist/` 不会成为下次发布的内容来源。

## 5. 路径与常见问题

- **仓库子路径**：`vite.config.ts` 已设置 `base: './'`。保留完整 `dist/` 目录内容即可支持 `/ai4science-atlas/` 等子路径，无需写死域名。
- **没有 Actions 工作流**：检查 `.github/workflows/deploy.yml` 是否因隐藏目录或多余文件夹层级而漏传。
- **构建失败**：打开 Actions 中失败步骤的日志。确认 `package-lock.json` 已提交、使用 `npm ci`，并先在本地运行 `npm run build`。
- **部署权限错误**：确认 Pages 来源已选择 GitHub Actions；保留工作流已有的 `pages: write` 与 `id-token: write` 权限，并检查仓库对 Actions 或 `github-pages` 环境的限制。
- **页面缺少资源或空白**：确认上传的是项目内容而非 ZIP 本身，检查浏览器请求路径，并确认未漏掉 `public/engine/`、`public/fonts/` 或构建输出资源。
- **出现兼容渲染**：浏览器无法创建 WebGL 上下文时会自动使用 Canvas 三维投影。这不影响时间线、索引和论文详情的使用。当前交付环境的浏览器验证覆盖 Canvas 路径；正式展示前请在目标设备检查 WebGL 画面。

每次重新打开或刷新页面均默认 **English + Light**，可在顶部切换中文或暗色模式。
