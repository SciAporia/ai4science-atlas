# ARBOR — AI for Science Knowledge Atlas

可独立部署的 AI4Science 交互式知识树。这个版本使用 **React + TypeScript + Vite + Three.js**，是纯前端静态网站，可部署到 GitHub Pages，无需服务器、数据库、API Key 或 ChatGPT 登录。

包含 **130 项研究、9 个领域、44 条主题关联**，覆盖 **2004–2026 年**。保留中英切换、每次进入默认英文、亮暗主题记忆、3D 旋转/缩放/平移、领域聚焦、搜索筛选、时间线、领域视图、节点详情、故事导览和 JSON 导出。WebGL 不可用时自动使用相同三维坐标的兼容渲染。

## 直接部署

请按 [GitHub Pages 中文部署说明](DEPLOY_GITHUB_PAGES.zh-CN.md) 操作。仓库已包含 `.github/workflows/deploy.yml`：推送到 `main` 后，自动安装依赖、校验数据、构建并部署。

**解压后，把项目目录里面的内容放到仓库根目录**，确保仓库根目录直接出现 `package.json`、`index.html` 和 `.github/`。不要把 ZIP 本身或外层文件夹当成网站上传。

在 GitHub 仓库中将 **Settings → Pages → Build and deployment → Source** 设置为 **GitHub Actions**。首次启用后可在 Actions 页面手动运行工作流。本交付包没有替你创建仓库或执行 GitHub 部署。

## 本地运行

推荐 **Node.js 24**，版本记录在 `.nvmrc`；依赖版本由 `package-lock.json` 锁定。

```bash
npm ci
npm run dev
```

打开终端显示的本地地址。生产构建和预览：

```bash
npm run build
npm run preview
```

`npm run build` 会先运行数据校验和 TypeScript 检查，再生成 `dist/`。也可单独运行 `npm run check`。

ZIP 内附预构建的 `dist/`，便于静态预览或上传到其他静态服务器。它已被 `.gitignore` 排除；GitHub Actions 每次从源码重新构建，不依赖这份预构建目录。请通过 HTTP 服务器访问，勿直接双击 HTML 使用 `file://` 打开。

## 项目文件

| 路径 | 用途 |
| --- | --- |
| `index.html`、`src/main.tsx` | 静态页面与 React 入口 |
| `app/page.tsx`、`app/globals.css` | 页面逻辑、双语文案和主题样式 |
| `components/KnowledgeTree.tsx` | Three.js 场景与交互 |
| `components/SoftwareTree.tsx` | WebGL 不可用时的兼容渲染 |
| `lib/tree-layout.ts` | 共用三维布局与时间/大小映射 |
| `lib/domains.ts` | 领域名称、说明和配色 |
| `data/nodes.json` | 130 项研究记录 |
| `data/relationships.json` | 44 条主题关联及双语理由 |
| `data/research-review.json` | 调研范围、检索记录、来源和领域总结 |
| `lib/design-plan.ts` | 站内方法与设计说明 |
| `public/source-survey.pdf` | 用户提供的原始综述 |
| `tests/validate-atlas.mjs` | 数据完整性与关系端点校验 |
| `.github/workflows/deploy.yml` | GitHub Pages 自动部署 |

`app/` 只是保留的源码目录名，本版本不使用 Next.js App Router，也不需要 Next.js 或 Cloudflare。

## 数据与扩展

52 项记录来自原始 R6 综述，78 项为扩展调研。新增记录附原始来源、出版类型、核查日期、双语贡献与局限；在线发表、预印本与期刊卷期不同的情况保留年份说明。核查日期为 2026-11-09。这是有选择的学术图谱，不能当作穷尽式系统综述或独立实验复现。

节点的主领域决定其树枝位置，跨领域标签参与筛选但不重复创建节点。高度映射所引版本年份；节点大小依据公开的编辑评分：代表性 50%、方法价值 30%、证据讨论相关性 20%。评分不是引用量，也不代表实验可靠性。结构枝线表示领域归属，主题关联不等同于已验证的引用或因果继承。

添加研究时修改 `data/nodes.json`；添加关系时修改 `data/relationships.json`，然后运行 `npm run check`。保留已有稳定 `id`。`public/source-survey.pdf` 可以替换为你的新版文章；若不准备展示全文，删除文件时同步移除页面中的相关链接。

资源路径采用 `base: './'` 和 `import.meta.env.BASE_URL`，可用于仓库子路径、用户主页根路径或自定义域名，无需填写 GitHub 用户名。字体使用 Google Fonts，无法加载时自动回退到系统字体。

## 第三方依赖

运行时依赖的许可文本保存在 `third-party-licenses/`，请随项目保留。论文、原始综述与项目代码的权属不因本导出包而变更。
