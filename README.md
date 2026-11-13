# ARBOR — An Atlas of Scientific Discovery

Edition 03 is a bilingual AI for Science atlas built with **React 19, TypeScript, Vite 8 and Three.js**. It contains **264 works across nine domains, spanning 1998–2026**: **134 new works** while preserving the repository’s original **130 research identities**. The atlas has **103 thematic connections**, including all 44 original relations. Live counts and year bounds are derived from `data/nodes.json`.

**Every fresh page load starts in English and light mode.** Chinese and dark mode are available from the header. The deliverable contains source code, a prebuilt `dist/` and a GitHub Pages workflow for self-deployment; preparing this package does not publish it.

## Explore

- Switch between the sculptural **Arbor** and **Time helix** layouts; play or pause **Watch it grow** to reveal work by year.
- Orbit, pan, zoom, reset and focus branches or selected papers. Toggle labels, auto orbit, thematic connections and immersive viewing.
- Combine domain, year range, search, work type, provenance and editorial-importance filters.
- Read paper contributions, retained artifacts, evidence boundaries, source versions and related work.
- Use the timeline, domain map, searchable paper index and guided discovery stories; export filtered graph data or the research log as JSON.

The domain map groups records; it is not a citation network. Cross-domain tags point to the same canonical record. Domain navigation can therefore overlap, while the global count remains unique.

## Run and build

Use **Node.js 24** to match the included deployment workflow. From the project root:

```sh
npm ci
npm run dev
```

For a validated production build and local preview:

```sh
npm run build
npm run preview
```

`npm run build` validates the atlas, runs the TypeScript check and writes the Vite output to `dist/`. To inspect the already built package without installing Node dependencies:

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Serve over HTTP: opening `index.html` through `file://` is unsupported because the application loads JavaScript modules. Vite uses `base: './'`, so the complete output also works under a repository subpath.

## Self-deploy to GitHub Pages

Extract the ZIP and place its **contents at the repository root**, preserving `.github/workflows/deploy.yml`. Under **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. The included workflow builds on a push to `main` and also supports a manual run. It installs the locked dependencies with Node.js 24, runs `npm run build` and publishes `dist/`.

See [the Chinese deployment guide](DEPLOY_GITHUB_PAGES.zh-CN.md) for the complete process. Uploading the ZIP file itself does not deploy the application.

## Source map

| Path | Purpose |
| --- | --- |
| `app/page.tsx`, `app/globals.css` | React interface, state and visual system |
| `components/KnowledgeTree.tsx` | React adapter for the current rendering engines |
| `public/engine/tree.js` | Three.js / OrbitControls renderer and fallback selection |
| `public/engine/tree-canvas.js` | Canvas2D perspective projection when WebGL is unavailable |
| `public/engine/tree-layout.js` | Shared deterministic layout, time scale and node radii |
| `public/engine/vendor/` | Local Three.js modules and license |
| `data/nodes.json`, `data/relationships.json` | Canonical research records and explicit relationships |
| `data/research-review.json` | Expansion methodology and domain review notes |
| `lib/atlas-types.ts`, `lib/atlas.ts` | Data contract, editorial scoring and computed counts |
| `lib/design-plan.ts` | Bilingual in-app design and methodology text |
| `public/source-survey.pdf` | Original survey, separate from later research additions |
| `tests/validate-atlas.mjs` | Data integrity checks |
| `DESIGN_SPEC.md` | Chinese design and implementation specification |
| `.github/workflows/deploy.yml` | GitHub Pages build and deployment |

## Data and visual meaning

A paper has a stable ID, one primary domain, optional secondary domains, bilingual contribution and limitation text, publication metadata, sources, and transparent editorial scores. Original survey records retain their survey references; independently researched additions are explicitly labeled and do not acquire invented survey page numbers. The survey cutoff is **2 November 2026**; this expansion was checked on **13 November 2026**, and records retain their individual check dates and cited versions.

Three editorial dimensions receive 1–5: representativeness `R`, method value `M`, and relevance to the evidence discussion `E`. The displayed score is `S = 0.5R + 0.3M + 0.2E`. It is a navigation judgment, **not a citation count, reliability rating or RSI maturity score**.

Both rendering paths use `t = (year − minYear) / (maxYear − minYear)`, `y = −4 + 10.5t`, and base node radius `r = 0.072√S`. Same-year nodes share world-coordinate height; X/Z offsets separate them. Filters do not change this scale. At equal camera depth, projected area is approximately proportional to `S`; perspective and selection emphasis change apparent size. The roots mark the beginning of the selected collection, not the origin of scientific AI.

Branches express editorial grouping. Thematic connections do not establish citation, direct inheritance or causality. New records should be deduplicated by paper/system identity, retain accurate version dates, explain their scores and limitations, and resolve all relationship endpoints. Run `npm run build` after data changes.

## Rendering and verification scope

WebGL is the primary renderer. If a context cannot initialize, the application switches to a Canvas2D renderer that projects the same 3D layout. This preserves the reading structure and interactions, while materials and lighting differ. The timeline and paper index also remain available independently of WebGL.

Browser verification in the available environment exercised the **Canvas fallback**. The primary WebGL renderer was **not browser-exercised in that environment**. No measured FPS or universal device-performance claim is made. Inspect the WebGL path on the intended presentation device before an event.
