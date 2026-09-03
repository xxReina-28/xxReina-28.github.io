# Nina Suico portfolio — Astro migration candidate

This directory contains a static Astro parity implementation of the approved Jekyll portfolio. It is intentionally isolated from the current GitHub Pages source: Jekyll remains the production baseline until a separate cutover is authorized.

## Requirements

- Node.js 24 LTS (see `.nvmrc`)
- npm 12 or a lockfile-compatible npm version

Astro telemetry is disabled by the project-local CLI wrapper. The site has no frontend framework, server runtime, database, CMS, analytics, authentication, or Cloudflare adapter.

## Local setup and development

```powershell
npm ci
npm run dev
```

The development server is for local review only. No command in this project deploys the site.

## Build, validation, and preview

```powershell
npm run check
npm run build
npm run validate
npx playwright install chromium
npm run qa
npm run preview
```

`npm run build` validates source evidence rules, runs strict Astro checks, creates the static site in `dist/`, and validates routes, assets, metadata, internal links, landmarks, and output hygiene. `npm run qa` serves `dist/` on a loopback-only ephemeral port, tests ten routes at eight viewport conditions, and writes 13 screenshots plus JSON and Markdown reports under `.qa-output/astro-visual-qa/`.

## Content architecture

- `src/data/*.yml`: canonical profile, homepage, capabilities, credentials, calls to action, and navigation records.
- `src/data/index.ts`: typed schemas and validated data exports.
- `src/content/case-studies/*.md`: four canonical flagship simulation records and executive summaries.
- `src/content/projects/*.md`: two canonical supporting-project records.
- `src/content.config.ts`: controlled content-collection schemas.
- `src/pages/`: public route definitions only.
- `src/components/`: reusable semantic interface components.
- `src/styles/global.css`: Midnight Executive Systems tokens and responsive styles.
- `public/`: public PDFs, the approved profile image, NS mark, favicon fallback, and robots policy only.

Do not duplicate work summaries in data files. A case study or project is authored once in its collection record and queried by pages and components.

## Add a project

1. Add one Markdown file under `src/content/projects/`.
2. Use a unique route-safe `slug` and a controlled `work_kind`, evidence, implementation, data, and outcome status.
3. Include an explicit disclosure. Do not present unverified or synthetic outcomes as realized business results.
4. Add a repository URL only when it points to the actual public project repository.
5. Run `npm run build`.

## Add a case study

1. Add one Markdown file under `src/content/case-studies/`.
2. Add exactly one corresponding PDF under `public/assets/case-studies/`.
3. Set `work_kind: portfolio-simulation`, `evidence_status: artifact-supported`, `implementation_status: simulated`, `data_classification: synthetic`, and `outcome_status: synthetic`.
4. Include the visible portfolio-simulation disclosure and the exact public `artifact_url`.
5. Use a unique `flagship_order` and run `npm run build`.

## Evidence classification

Allowed work kinds are `professional`, `portfolio-simulation`, `technical-project`, `educational-capstone`, `proposed-system`, and `pending-classification`. Evidence statuses are `verified`, `artifact-supported`, `self-reported`, `unverified`, `synthetic`, and `not-applicable`. Implementation statuses are `implemented`, `completed-project`, `documented-demonstration`, `simulated`, `proposed`, and `not-applicable`.

Salesforce is platform exposure only. The source validator blocks the prohibited administrator claim, unsupported degree wording, percentage metrics, invalid controlled values, missing simulation disclosures, career-history regressions, and ambiguous PDF associations.

## Preserved routes

The build produces `/`, `/work/`, `/about/`, `/contact/`, six `/work/<slug>/` detail routes, and `/404.html`. It intentionally does not create `/operations/`, `/services/`, raw collection paths, or internal data paths. `trailingSlash: "always"` and directory-format output preserve current public route expectations.

## Future Cloudflare Pages settings

These are handoff notes only; Cloudflare is not connected or configured in this phase.

- Root directory: `astro-site`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: decide during the authorized cutover
- Preview indexing: prevent indexing before preview deployment is enabled
- Custom domain and DNS: future work

The final canonical origin can be supplied through `SITE_ORIGIN` during the authorized production cutover. Until then, metadata defaults to the current GitHub Pages origin.
