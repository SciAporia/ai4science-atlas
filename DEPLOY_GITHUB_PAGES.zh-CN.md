# GitHub Pages 部署说明

这个项目可直接挂在 GitHub Pages。部署完成后，访问者用普通浏览器即可打开，不需要 ChatGPT 账号。当前交付的是可部署的源码包，**尚未替你创建 GitHub 仓库或执行部署**。

## 推荐：GitHub Desktop 上传

1. 在 GitHub 新建独立仓库，例如 `science-arbor`。仓库名由你决定；准备公开展示时可使用 Public 仓库。不要选择已有个人主页仓库，除非你就是要替换其内容。
2. 在 GitHub Desktop 中登录，使用 **File → Clone repository** 将刚创建的仓库克隆到电脑。
3. 解压本项目 ZIP，把 `arbor-github-pages` 文件夹**里面的内容**复制到克隆出的仓库目录。复制后，`package.json` 和 `index.html` 应直接位于仓库根目录。
4. 确保隐藏目录 **`.github/`** 一并复制。macOS Finder 可按 `Command + Shift + .` 显示隐藏文件；不要遗漏 `.github/workflows/deploy.yml`、`.gitignore` 和 `.nvmrc`。保留克隆目录原有的 `.git`。
5. 在 GitHub Desktop 填写提交说明，例如 `Add ARBOR science atlas`，提交到 `main`，然后点击 **Push origin** 或 **Publish branch**。
6. 打开 GitHub 仓库，进入 **Settings → Pages → Build and deployment**，把 **Source** 选择为 **GitHub Actions**。
7. 进入 **Actions → Deploy ARBOR to GitHub Pages**。如果首次自动运行早于 Pages 设置而失败，设置完成后点击 **Run workflow**，选择 `main` 再运行。
8. 等待 `build` 和 `deploy` 都显示成功，从部署结果或 **Settings → Pages** 打开实际站点地址。

不需要添加访问令牌或仓库 Secrets；工作流使用 GitHub 自动提供的授权。组织仓库若限制 Actions 或 Pages，需先按该组织的设置启用相关能力。

## 上传位置要正确

仓库首页应直接看到这些内容：

| 文件/目录 | 是否需要上传 |
| --- | --- |
| `package.json`、`package-lock.json`、`index.html`、`vite.config.ts`、`tsconfig.json` | 是 |
| `.github/`、`.gitignore`、`.nvmrc` | 是，包含隐藏文件 |
| `src/`、`app/`、`components/`、`lib/`、`data/`、`public/`、`tests/` | 是 |
| `README.md`、本说明文件 | 是 |
| `node_modules/` | 否，工作流自动安装 |
| `dist/` | 不需要，工作流从源码构建 |

不要仅上传 ZIP；GitHub Pages 不会替你解压。也不要形成 `仓库/arbor-github-pages/package.json` 这一额外层级，否则当前工作流会找不到项目。

若使用 GitHub 网页的 **Add file → Upload files**，同样上传解压后的内容，并确认 `.github/workflows/deploy.yml` 已进入仓库。隐藏目录容易漏传，优先使用 GitHub Desktop。

## 可选：命令行上传

在包含 `package.json` 的项目目录打开终端。下面适用于一个新的空仓库；请将占位用户名和仓库名换成你的实际值：

```bash
git init -b main
git add .
git commit -m "Add ARBOR science atlas"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Git 身份认证使用你电脑已有的 GitHub 登录方式。推送后仍需完成上面的 **Settings → Pages → GitHub Actions** 设置。

## 本地修改和预览

安装 **Node.js 24**。如果已安装 nvm，可在项目目录运行 `nvm use`。第一次运行：

```bash
npm ci
npm run dev
```

按终端给出的 URL 打开开发预览。准备提交时运行：

```bash
npm run build
npm run preview
```

`npm run build` 包含研究数据校验和 TypeScript 检查。修改后提交、推送到 `main`，GitHub Actions 会自动更新网站。若使用其他默认分支，请同步修改 `.github/workflows/deploy.yml` 的 `branches: [main]`。

ZIP 中的 `dist/` 是本次生成的静态成品，可通过 HTTP 服务器预览，或将其内部内容上传到其他静态托管平台。GitHub 工作流不会使用包内旧成品，而会重新构建。

## 仓库路径与自定义域名

本项目已使用相对资源路径，普通项目站点、`用户名.github.io` 根站点与自定义域名都无需修改源码里的用户名或仓库名。普通项目网址通常具有 `https://用户名.github.io/仓库名/` 的形式；请以 GitHub 部署成功后给出的实际地址为准。

自定义域名在 **Settings → Pages → Custom domain** 配置，并按 GitHub 官方说明设置 DNS。相对路径只解决静态资源定位，不会自动购买域名或配置 DNS。

## 常见问题

| 现象 | 检查方法 |
| --- | --- |
| Actions 中没有部署流程 | 查看 `.github/workflows/deploy.yml` 是否上传，以及分支是否为 `main` |
| 提示找不到 `package.json` 或锁文件 | 将项目文件放到仓库根目录，确保 `package-lock.json` 已提交 |
| Configure Pages 失败 | 在仓库 Settings → Pages 中将 Source 设为 GitHub Actions，再重新运行 |
| 网站显示 README 或源代码 | 使用本包的 Actions 部署，Source 不要选择普通源码分支发布 |
| 页面 404 | 确认工作流成功，使用部署结果里的完整地址，包括仓库路径 |
| PDF 链接 404 | 确认 `public/source-survey.pdf` 仍存在；若更名，更新 `app/page.tsx` 对应链接 |
| 无法生成 WebGL 画面 | 页面会启用兼容渲染；也可检查浏览器的硬件加速设置 |

`public/` 包含你提供的综述 PDF。你可以替换为准备展示的版本；若不展示全文，移除该文件并同步移除相关链接。论文节点、引用链接与调研说明均在独立 JSON 文件中，可继续维护。

官方文档：[配置 GitHub Pages 发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [使用自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
