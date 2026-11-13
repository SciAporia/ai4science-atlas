import {nodes,MIN_YEAR,MAX_YEAR,SURVEY_COUNT,RESEARCH_COUNT} from './atlas';
export type DesignSection = {
  number: string;
  title: string;
  kicker: string;
  paragraphs: string[];
  items?: { label: string; text: string }[];
};

export const designSections: DesignSection[] = [
  {
    number: '01',
    title: '让学术脉络成为可探索的空间',
    kicker: 'CONCEPT & AUDIENCE',
    paragraphs: [
      'ARBOR 是面向科研工作者、研究生与学术展示观众的双语知识入口。以一棵不断向上生长的树组织研究：根部承载较早工作，树冠承载较新工作，9 个分支划分领域，精选节点打开可核查的研究档案。空间总览帮助发现结构，文字详情支持准确阅读。',
      `第三版保留仓库原有 130 条记录的稳定身份并继续扩展；当前包含 R6 综述的 ${SURVEY_COUNT} 项工作与 ${RESEARCH_COUNT} 项一手资料调研，共 ${nodes.length} 个节点，覆盖 ${MIN_YEAR}–${MAX_YEAR} 年。原始综述截止于 2026-11-02；本轮扩展核查日期为 2026-11-13，各条目保留各自的核查日期。两类来源分别标注，新增节点不冒充综述原文。本图谱是跨领域目的性策展，不是完整的 AI4Science 历史，也不把节点数量解释为领域规模。`,
    ],
    items: [
      { label: '调研程序', text: '按领域寻找历史锚点、方法转折与近期系统，优先期刊、会议、原始预印本及官方项目。核对标题、作者、年份、贡献与适用边界，按论文身份去重。各节点显示所选版本和来源链接。元数据与公开摘要核查不等于逐篇全文系统综述、独立实验复现或影响力计量。' },
      { label: '核心问题', text: '不只看系统做出了什么，也看哪些数据、工具、参数或程序被保留，以及保留后的收益由什么证据支持。' },
      { label: '分支组织', text: '生命科学、化学、材料、能源、地球与环境构成文章主体；数学、物理、机器人与实验室、科学智能体提供机制与比较案例。' },
    ],
  },
  {
    number: '02',
    title: '一个入口，三种阅读尺度',
    kicker: 'INFORMATION ARCHITECTURE',
    paragraphs: [
      '首页直接进入知识树，避免让介绍页挡住内容。全局、领域、研究节点共享同一套数据和筛选状态；树、时间线与领域视图提供互补的阅读方式。',
    ],
    items: [
      { label: '全局', text: '顶部提供品牌、导览、方法与中英文选择；主舞台工具栏承载搜索、视图切换和筛选。侧边提供领域入口、节点计数与阅读图例，底部展示年份范围。' },
      { label: '领域', text: '选择分支后聚焦相应研究，并保留返回全局的入口。概览说明该领域的核心问题，时间线提供适合精读的条目顺序。' },
      { label: '节点', text: '详情包括标题、作者、年份、类型、贡献、保留对象、证据边界、编辑评分、关联工作与原文位置。源论文链接与综述页码分别提供，便于核查。' },
      { label: '方法与索引', text: '方法面板解释设计与数据规则；论文索引呈现当前筛选下的全部条目。JSON 导出保留来源、评分与关联说明，支持进一步整理。' },
    ],
  },
  {
    number: '03',
    title: '探索时自由，阅读时稳定',
    kicker: 'INTERACTION DESIGN',
    paragraphs: [
      '典型路径为：观察全树 → 选择领域 → 调整年份或关键词 → 点击节点 → 阅读贡献与证据 → 沿关联继续探索。筛选结果同步影响各视图；无匹配结果时明确提示，并提供重置入口。',
    ],
    items: [
      { label: '空间操作', text: '拖动旋转，滚轮缩放，平移调整观察位置；按钮提供缩放与复位。选择分支或节点后平滑聚焦；可切换标签、自动旋转、所选节点的主题连线与沉浸视图。点击固定详情，前后按钮沿当前结果逐项浏览。' },
      { label: '筛选与时间', text: '搜索覆盖标题、作者和关键词；领域、年份、工作类型、来源类别与编辑重要度共同限定结果。年份表示所引版本的记录年份，不表示统一的首次发现日期；在线发表与卷期跨年的情况在节点来源中注明。' },
      { label: '空间形态与生长', text: 'Arbor 与 Time helix 使用同一时间高度和节点身份，改变枝条的横向组织。Watch it grow 每 700 毫秒推进结束年份，逐年揭示当前筛选范围内的工作；可暂停，坐标比例尺保持固定。' },
      { label: '故事模式', text: '按时间浏览当前分支的精选站点，可播放、暂停和逐站切换。它是导览路径，不是历史因果论证，也不代表分支内所有论文。' },
      { label: '可访问性', text: '界面、领域说明、贡献、保留对象、证据边界和评分理由支持中英文切换，保留当前探索状态；每次重新加载页面均默认英文与白天模式，可在本次浏览中切换中文和暗色模式。文字索引支持键盘阅读，小屏优先保证正文可读，并尊重减少动态效果偏好。' },
    ],
  },
  {
    number: '04',
    title: '双重展厅，同一知识结构',
    kicker: 'VISUAL DIRECTION',
    paragraphs: [
      '整体采用安静、精密、通透的科研展厅气质。暗色模式以深蓝黑背景托起发光枝干；亮色模式采用暖白纸感、深色线条和低饱和矿物色节点，少量粒子提供纵深，不与论文标题竞争。图谱是视觉中心，界面作为清晰、低干扰的阅读框架。',
    ],
    items: [
      { label: '配色与材质', text: '暗色采用深墨色，亮色采用暖象牙色；生命科学使用薄荷绿，化学使用青色，材料使用淡紫。其余领域以低饱和蓝、金、粉与灰绿区分，同时保留文字标签，避免仅依赖颜色。' },
      { label: '字体与布局', text: '英文正文采用本地 Open Sans（ArborSans）字体，标题采用 Latin Modern（ArborEditorial）衬线字体；中文及缺失字符回退到 Noto Sans SC 或系统字体。论文标题保留原名。正文保持舒适行高，桌面采用侧栏、主舞台、详情栏，小屏转为纵向阅读。' },
      { label: '光影与动效', text: '节点以亮度和尺寸建立层次，发光保留克制；选中态增强局部对比。镜头过渡强调方向连续性，避免突然跳转和持续干扰。' },
    ],
  },
  {
    number: '05',
    title: '把每一种视觉含义说清楚',
    kicker: 'DATA MAPPING & EVIDENCE',
    paragraphs: [
      '树的几何结构服务于信息编排，不是自动推断出的学术谱系。节点大小使用透明的编辑重要度；它衡量本展览的呈现优先级，不是实时引用量、客观学术影响力或证据强度。',
    ],
    items: [
      { label: '时间 → 高度', text: `当前范围为 ${MIN_YEAR}–${MAX_YEAR}：y = −4 + 10.5 × (year − minYear) / (maxYear − minYear)。同年节点保持相同世界坐标高度，用角度与径向位置分散；镜头透视会改变屏幕投影位置。时间线提供精确年份阅读。` },
      { label: '领域 → 分支', text: '每个节点拥有一个主领域，决定所属分支与颜色。secondaryDomains 记录跨领域标签；筛选辅助领域时也能找到该节点，但不复制论文身份或计数。' },
      { label: '重要度 → 大小', text: '三个编辑维度各取 1–5 分：代表性 R、方法价值 M、证据讨论价值 E。S = 0.5R + 0.3M + 0.2E；球体基础半径 r = 0.072√S。同等观察深度下，投影面积近似正比于编辑分数；透视及选中态会影响视觉尺寸。节点公开分项与评分理由。' },
      { label: '连线 → 关系', text: '实体枝线表示领域归属；同分支的前后条目仅表示时间邻近。专题关联单独标记并附理由，不冒充引用、直接继承或因果影响。未来若增加引用关系，需使用独立类型、出处与核查状态。' },
      { label: '证据与版本', text: '贡献、保留对象和局限分别记录。证据讨论价值不是可靠性评级；更正、版本差异和回顾性/前瞻性实验边界以文字显式展示。未来接入引用数据时，应单独记录来源、抓取日期和学科/年份归一化规则。' },
    ],
  },
  {
    number: '06',
    title: '从可用版本，走向持续维护的图谱',
    kicker: 'IMPLEMENTATION & ROADMAP',
    paragraphs: [
      '当前技术路径为 React、TypeScript、Vite、Three.js 与 OrbitControls，使用 CSS 实现界面与过渡。WebGL 为主渲染路径；不可用时采用不依赖 WebGL 的软件三维投影兼容视图，时间线与文字索引也持续可用。研究数据、领域定义、关系记录与展示逻辑分离，public/engine/tree-layout.js 为 WebGL 与 Canvas 渲染共享确定性几何；React 组件负责应用状态和引擎适配。',
    ],
    items: [
      { label: '数据契约', text: '节点保留稳定 id、标题、作者、year、domain、secondaryDomains、type、双语贡献与局限、scores、scoreReason、keywords、source(origin/reference/checkedAt/publicationType/yearNote/sources) 和 url；仅原始综述节点带 section/page。关系单独记录 source、target、type、label、reason；不把关系埋入几何坐标。' },
      { label: 'MVP 优先级', text: 'P0：来源准确、详情可读、搜索和时间筛选；P1：3D 操作、领域聚焦、时间线及双语；P2：故事导览、JSON 导出与方法说明。先保证学术内容完整，再增加空间装饰。' },
      { label: '增强版本', text: '可增加版本化编辑后台、审稿记录、可分享的筛选链接、独立引文层和人工编排故事。引用服务与论文元数据自动更新属于后续能力，当前没有后台实时抓取。' },
      { label: '交付与验证', text: '源码与预构建 dist 以 ZIP 交付，由维护者自行部署。附带 GitHub Pages Actions 工作流与中文部署指南。本环境的浏览器验证使用 Canvas 兼容路径；WebGL 主渲染器尚未在此环境进行浏览器验证，也未报告实测帧率。' },
      { label: '性能与维护', text: '控制像素比、粒子数与标签密度，复用几何体并释放 WebGL 资源；移动端降低装饰。规模扩大后采用实例化、按需载入和空间索引。新增记录校验唯一 id、年份、链接、关系端点与来源完整性。' },
    ],
  },
  {
    number: '07',
    title: '可以直接继续开发的设计语言',
    kicker: 'COPY, COMPONENTS & BUILD BRIEF',
    paragraphs: [
      '已实现的首页文案为：“科学，生长不息。”、“追寻每一次发现的来路。”；简介：“穿越领域与时间，探索科学智能如何从知识走向发现，从反馈走向进化。” 主要行动：“开启发现之旅”；索引入口：“浏览论文索引”。英文主标题为 “Discovery takes root.”，两种语言保持相同信息层级，论文原始标题不变。',
    ],
    items: [
      { label: '页面草图', text: '上方：品牌、导览、语言与方法入口；左侧：领域导航；中央工具栏：搜索、筛选和视图切换；主舞台：3D / 时间线 / 领域视图；右侧：概览或节点档案；下方：年份范围和操作提示。窄屏将详情移至主视图下方。' },
      { label: '组件清单', text: '当前页面包含领域导航、搜索筛选、KnowledgeTree、软件投影兼容视图、时间线、领域图、节点详情、故事控制、年份范围、论文索引、方法面板与语言切换。后续可将这些页面区域继续拆为独立组件；所有视图读取相同筛选结果和选中节点。' },
      { label: '前端实现提示词', text: '“构建双语 ARBOR 学术图谱：使用 React/TypeScript 和 Three.js，严格读取版本化节点与关系数据。以年份映射高度、主领域映射分支、公开编辑分数映射半径；实现旋转缩放平移、领域聚焦、搜索筛选、详情、时间线、故事和 JSON 导出。保留原始论文标题与来源页码，明确区分主题关联和已验证继承。每次新载入默认英文与白天模式，支持暗色主题，采用低饱和视觉、键盘可访问控件、减少动态效果和移动端降级。不得编造引用量、论文或实验结论。”' },
    ],
  },
];

export const designSectionsEn: DesignSection[] = [
  {
    number: '01', title: 'Make scholarly structure explorable', kicker: 'CONCEPT & AUDIENCE',
    paragraphs: [
      'ARBOR is a bilingual knowledge entrance for researchers, graduate students and academic audiences. Earlier work sits near the roots; newer work grows toward the canopy. Nine branches organize disciplines, while selected nodes open research records that can be checked against their sources. The spatial overview reveals structure; the detail panel supports precise reading.',
      `Edition 03 preserves the stable identities of the repository’s 130-record baseline and expands it to ${nodes.length} records spanning ${MIN_YEAR}–${MAX_YEAR}: ${SURVEY_COUNT} survey works and ${RESEARCH_COUNT} primary-source research entries. The survey cutoff is 2 November 2026; this expansion was checked on 13 November 2026, while individual records retain their own check dates. Provenance is labeled, and additions are not attributed to the uploaded survey. This is a purposive cross-domain atlas, not an exhaustive history; counts do not measure field size.`,
    ],
    items: [
      { label: 'Research procedure', text: 'Identify historical anchors, methodological turning points and recent systems within each discipline. Prioritize journals, proceedings, original preprints and official projects; verify title, authors, year, contribution and scope, then deduplicate paper identities. Records expose the cited version and links. Metadata and accessible-abstract checks are not a full-text systematic review, independent replication or bibliometric evaluation.' },
      { label: 'Central question', text: 'Ask what a system produces, what data, tools, parameters or procedures it retains, and what evidence supports a benefit from that inheritance.' },
      { label: 'Disciplines', text: 'Life sciences, chemistry, materials, energy and environment form the main scientific branches. Mathematics, physics, robotics and laboratories, and scientific agents provide mechanisms and comparison cases.' },
    ],
  },
  {
    number: '02', title: 'One entrance, three scales of reading', kicker: 'INFORMATION ARCHITECTURE',
    paragraphs: ['The home page opens directly into the atlas. Global, discipline and paper views share the same data and filters. Tree, timeline and domain views provide complementary ways to read that content.'],
    items: [
      { label: 'Global view', text: 'The header contains identity, tours, methodology and language selection. The stage toolbar contains search, view controls and filters. Side panels provide disciplines, counts and a legend. Year controls anchor the bottom.' },
      { label: 'Discipline view', text: 'Selecting a branch focuses its research while keeping a route back to the full atlas. The overview states the disciplinary question; the timeline provides a readable chronological sequence.' },
      { label: 'Paper record', text: 'Details include title, authors, year, type, contribution, retained artifact, evidence boundary, editorial scores, related work and source location. Original-paper links and survey page links remain distinct.' },
      { label: 'Method and index', text: 'The methodology panel explains the design and data rules. The research index lists all currently matching records. JSON export preserves provenance, scores and relationship descriptions.' },
    ],
  },
  {
    number: '03', title: 'Freedom to explore, stability to read', kicker: 'INTERACTION DESIGN',
    paragraphs: ['A typical journey is: inspect the tree, choose a discipline, refine the year range or query, select a paper, read its contribution and limits, then follow another connection. Filters apply across views; empty results provide a clear explanation and reset action.'],
    items: [
      { label: 'Spatial controls', text: 'Drag to rotate, scroll to zoom and pan to reposition. Buttons provide zoom and reset. Branch and paper selection focus the camera. Toggle labels, auto orbit, selected thematic links and immersive viewing. Clicking fixes the detail panel; previous/next actions traverse the current results.' },
      { label: 'Search and time', text: 'Search covers titles, authors and keywords. Domain, year, work type, provenance and editorial importance combine to restrict results. A year belongs to the cited publication version, not a universal first-discovery date. Where online and issue years differ, the source panel states the convention.' },
      { label: 'Form and growth', text: 'Arbor and Time helix share time height and paper identity while changing lateral branch geometry. Watch it grow advances the end year every 700 milliseconds, progressively revealing work within the other active filters. It can be paused and never rescales time coordinates.' },
      { label: 'Story mode', text: 'Play, pause or step through selected stops in the current branch. This is an editorial tour, not a claim of historical causation or complete coverage.' },
      { label: 'Accessibility', text: 'The interface, discipline descriptions, contributions, retained artifacts, evidence boundaries and scoring rationales switch between Chinese and English. Exploration state is preserved when switching languages. Every fresh page load starts in English and light mode; Chinese and dark mode remain available during the session. A text index supports keyboard reading; small screens prioritize legibility and reduced-motion preferences are respected.' },
    ],
  },
  {
    number: '04', title: 'Two gallery modes, one knowledge structure', kicker: 'VISUAL DIRECTION',
    paragraphs: ['The visual language is quiet, precise and translucent. Dark mode uses blue-black space, fine luminous branches and layered nodes. Light mode uses warm ivory, ink-like branch lines and muted mineral colors. Sparse particles establish depth without competing with paper titles. The atlas remains the visual focus; the interface provides a restrained reading frame.'],
    items: [
      { label: 'Color and material', text: 'Deep ink and warm ivory define the two modes. Mint, cyan and lilac distinguish life sciences, chemistry and materials. Muted blue, gold, rose and sage distinguish the remaining branches. Text labels accompany color.' },
      { label: 'Typography and layout', text: 'Locally supplied Open Sans (ArborSans) serves body text and Latin Modern (ArborEditorial) supplies serif headings. Chinese and missing glyphs use Noto Sans SC or system fallbacks. Original paper titles stay intact. Body text has comfortable spacing. Desktop uses navigation, stage and detail columns; narrow screens read vertically.' },
      { label: 'Light and motion', text: 'Controlled glow and size establish hierarchy. Selection raises local contrast. Camera transitions preserve spatial continuity without sudden jumps or persistent distraction.' },
    ],
  },
  {
    number: '05', title: 'Give every visual encoding a meaning', kicker: 'DATA MAPPING & EVIDENCE',
    paragraphs: ['Tree geometry is an editorial organization, not an inferred scholarly genealogy. Node size expresses transparent editorial importance: a presentation priority, not live citations, objective scientific influence or strength of proof.'],
    items: [
      { label: 'Time → height', text: `The current range is ${MIN_YEAR}–${MAX_YEAR}: y = −4 + 10.5 × (year − minYear) / (maxYear − minYear). Same-year nodes share world-coordinate height and separate by angle or radius. Perspective changes screen projection; the timeline supplies precise year reading.` },
      { label: 'Domain → branch', text: 'Each record has one primary domain that determines its branch and color. secondaryDomains supplies cross-domain tags. Filtering another relevant discipline can reveal the same paper without duplicating its identity or count.' },
      { label: 'Importance → size', text: 'Three editorial dimensions receive 1–5: representativeness R, method value M and relevance to the evidence discussion E. S = 0.5R + 0.3M + 0.2E. Base sphere radius r = 0.072√S makes projected area approximately proportional to the editorial score at equal camera depth. Perspective and selection emphasis affect apparent size. Every node exposes components and rationale.' },
      { label: 'Lines → relationships', text: 'Solid branches mean domain membership. Nearby works within a branch are chronological neighbors only. Thematic comparisons have separate labels and reasons; they do not assert citation, direct inheritance or causality. Future citation edges need their own type, source and verification status.' },
      { label: 'Evidence and versions', text: 'Contribution, retained artifact and caveat are separate fields. Evidence relevance is not a reliability rating. Corrections, version differences and retrospective versus prospective evidence remain explicit. A future citation layer must record its provider, retrieval date and field/year normalization separately.' },
    ],
  },
  {
    number: '06', title: 'From a usable atlas to a maintained resource', kicker: 'IMPLEMENTATION & ROADMAP',
    paragraphs: ['The implementation uses React, TypeScript, Vite, Three.js, OrbitControls and CSS. WebGL is the primary renderer. A software 3D projection provides compatibility when WebGL is unavailable; the timeline and text index remain available. Research records, domain definitions, relations and rendering are separated; public/engine/tree-layout.js shares deterministic geometry between WebGL and Canvas renderers; the React adapter owns application-state integration.'],
    items: [
      { label: 'Data contract', text: 'Nodes retain a stable id, title, authors, year, domain, secondaryDomains, type, bilingual contribution and caveat, scores, scoreReason, keywords, source(origin/reference/checkedAt/publicationType/yearNote/sources) and url. Only source-survey records carry section/page pointers. Relations separately record source, target, type, label and reason; their meaning is not buried in coordinates.' },
      { label: 'MVP priorities', text: 'P0: accurate provenance, readable details, search and time filters. P1: 3D controls, branch focus, timeline and two languages. P2: guided stories, JSON export and methodology. Complete scholarly content before adding decoration.' },
      { label: 'Next version', text: 'Possible additions include a versioned editorial console, review history, shareable filter links, a separate citation layer and manually authored stories. Citation services and automatic metadata refresh are future capabilities; no live background harvesting is implemented.' },
      { label: 'Delivery and verification', text: 'The ZIP includes source and a prebuilt dist for maintainer-controlled deployment, with a GitHub Pages Actions workflow and a Chinese deployment guide. Browser verification in this environment exercised the Canvas fallback. The primary WebGL renderer was not browser-exercised here, and no measured frame-rate claim is made.' },
      { label: 'Performance and upkeep', text: 'Bound pixel ratio, particles and label density; reuse geometry and release WebGL resources. Reduce decoration on mobile. At larger scale use instancing, lazy loading and spatial indexing. Validate unique identifiers, dates, links, relation endpoints and provenance.' },
    ],
  },
  {
    number: '07', title: 'A concrete brief for continued development', kicker: 'COPY, COMPONENTS & BUILD BRIEF',
    paragraphs: ['Implemented headline: “Discovery takes root.” Subheading: “Trace the roots of what comes next.” Supporting copy: “Across disciplines and time. Explore how scientific AI moves from knowledge to discovery, and from feedback to lasting change.” Primary action: “Begin a discovery story.” Index action: “Browse paper index.” Both languages preserve the information hierarchy and original paper titles.'],
    items: [
      { label: 'Page sketch', text: 'Top: identity, tours, language and methodology. Left: domain navigation. Stage toolbar: search, filters and view switcher. Main stage: tree, timeline or domain view. Right: overview or paper record. Bottom: year range and interaction guidance. Details move below the main view on narrow screens.' },
      { label: 'Component inventory', text: 'The current page contains domain navigation, search and filters, KnowledgeTree, software projection fallback, timeline, domain map, paper details, story controls, year range, research index, methodology dialog and language switcher. These regions can be further extracted into independent components. Every view consumes the same filtered records and selected node.' },
      { label: 'Implementation prompt', text: '“Build a bilingual ARBOR scholarly atlas with React/TypeScript and Three.js, consuming versioned node and relation data. Map publication years to height, primary domains to branches and transparent editorial scores to radius. Implement rotate/zoom/pan, branch focus, search and filters, paper details, timeline, story controls and JSON export. Preserve original titles and source page references. Distinguish thematic comparisons from verified inheritance. Start every fresh page load in English and light mode, and provide an optional muted dark theme, keyboard-accessible controls, reduced motion and mobile fallback. Never invent citations, papers or experimental conclusions.”' },
    ],
  },
];
