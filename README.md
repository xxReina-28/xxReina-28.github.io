# Nina Suico Portfolio

This repository contains the Jekyll source for the portfolio published through GitHub Pages.

## Local requirements

- Ruby 3.3.4
- Bundler compatible with Ruby 3.3.4

The versions in `Gemfile` match the GitHub Pages build environment used by this site. Keep them aligned with GitHub Pages when intentionally updating dependencies.

## Install and run

From the repository root:

```powershell
bundle install
bundle exec jekyll serve
```

The development site is available at `http://127.0.0.1:4000/` by default.

To create a production build:

```powershell
bundle exec jekyll build
```

Jekyll writes the generated static site to `_site/`.

## Lightweight validation

After a production build, verify that these files exist:

- `_site/index.html`
- `_site/work/index.html`
- `_site/about/index.html`
- `_site/contact/index.html`

The repository includes a lightweight route and local-link check:

```powershell
.\scripts\validate-site.ps1
```

Check the site at widths of 320, 375, 768, and 1024 pixels, plus a wider desktop viewport. Confirm that navigation remains reachable by keyboard, focus indicators are visible, and no horizontal scrolling is introduced.

GitHub Pages remains the production host. No separate deployment command is required; publishing continues through the repository's configured `main` branch workflow.

## Content architecture

The public pages use a small set of manually maintained Jekyll data files and collections:

| Content | Location | Purpose |
| --- | --- | --- |
| Profile and positioning | `_data/profile.yml` | Canonical public name, role, value proposition, location, market context, narrative, and contact channels |
| Homepage content | `_data/homepage.yml` | Homepage-specific problems, working approach, and short professional narrative |
| Capabilities | `_data/capabilities.yml` | Three capability pillars, individual claims, publication states, and platform exposure |
| Legacy draft operations | `_data/operations.yml` | Retained, non-canonical draft material; not linked or rendered publicly |
| Legacy draft services | `_data/services.yml` | Retained, non-canonical draft material; not linked or rendered publicly |
| Proof points | `_data/proof.yml` | Approved claims and supporting evidence; currently empty |
| Credentials | `_data/credentials.yml` | Credentials already stated on the current portfolio |
| Testimonials | `_data/testimonials.yml` | Approved attributed testimonials; currently empty |
| Calls to action | `_data/ctas.yml` | Reusable approved CTA records |
| Featured references | `_data/featured.yml` | Ordered references to approved featured projects and case studies |
| Projects | `_projects/*.md` | Classified project records with evidence, implementation, data, and outcome disclosures |
| Case studies | `_case_studies/*.md` | Future long-form evidence records; currently empty |

The homepage is assembled in `index.md` from the canonical profile, homepage, capability, project, credential, and CTA records. Do not duplicate that copy directly in page templates.

### Publication status

Allowed statuses are:

- `approved`: eligible for public rendering.
- `draft`: working content that must remain private to the source repository.
- `future`: a planned capability or content area that is not yet a public claim.

The supplied includes render only records whose status is `approved`. Approved project and case-study documents can generate local `/work/<slug>/` URLs. Listing pages and includes must still filter records to `approved` before rendering.

Approval means the wording is permitted on the public portfolio. It does not substitute for evidence. Use `evidence` references to connect a claim to an existing project, case study, credential, or other supported proof.

Typed evidence references currently support `project`, `case_study`, `credential`, and `proof`. A proof record is the place for a measurable outcome or other claim/evidence pair once it is substantiated; do not place unsupported metrics directly in capability data.

### Add or update a capability

Edit `_data/capabilities.yml`:

1. Use a stable lowercase, hyphenated `id`.
2. Place the claim under one of the four primary groups.
3. Set `status` to `draft` until the wording and evidence are approved.
4. Add only valid typed evidence references, such as a project or credential ID.
5. Run source validation before publishing.

Do not promote a claim solely because it appeared in a skills list. A strong claim should point to defensible evidence when available.

### Add a project

Create `_projects/<slug>.md` with front matter. The useful core fields are:

```yaml
---
title: "Project title"
slug: project-slug
type: automation
status: draft
work_kind: technical-project
evidence_status: unverified
verification_status: unverified
implementation_status: proposed
data_classification: not-applicable
outcome_status: unverified
disclosure: ""
date_label: ""
summary: ""
tools: []
capability_ids: []
outcomes: []
evidence: []
featured: false
external_url: ""
repository_url: ""
seo:
  title: ""
  description: ""
  social_description: ""
  og_image: ""
---
```

Omit optional fields that do not add value. Do not add empty results or metrics as prose. Set `featured: true` only after the project is approved, and add its slug to `_data/featured.yml` when ordered featured placement is needed.

### Add a case study

Create `_case_studies/<slug>.md` with the same publication controls. A case study may additionally use `challenge`, `approach`, `outcomes`, and `evidence` when those details are supported. Keep it `draft` until every public claim is reviewed. Do not create a case study merely to fill a section.

Case-study SEO fields can later provide a page title, meta description, social description, and OG image without requiring a new plugin.

### Evidence and work classification

Work records use controlled `work_kind` values: `professional`, `portfolio-simulation`, `technical-project`, `educational-capstone`, `proposed-system`, and `pending-classification`. Use `pending-classification` only when the work exists but its professional, portfolio, or demonstration classification still requires confirmation.

The shared evidence vocabulary is `verified`, `artifact-supported`, `self-reported`, `unverified`, `synthetic`, and `not-applicable`. Implementation values are `implemented`, `completed-project`, `documented-demonstration`, `simulated`, `proposed`, and `not-applicable`. Data classifications are `professional`, `synthetic`, `mixed`, and `not-applicable`.

Do not mark a work record or credential verified without a reviewable evidence field. Approved work using synthetic data or simulation must carry an explicit public disclosure.

### Homepage hierarchy

The public homepage follows this order:

1. Hero
2. Problems I Solve
3. Three capability pillars
4. Featured work
5. How I Work
6. Short professional narrative
7. Credentials
8. Contact CTA

Each section renders from canonical approved records and should be omitted when its approved collection is empty.

### Featured content

`featured: true` identifies an item as eligible for featured treatment. `_data/featured.yml` supplies explicit ordering and must reference an existing approved record. Empty content types should not render an empty public section.

### Reusable includes

The semantic, approved-only presentation includes are:

- `_includes/capability-card.html`
- `_includes/work-card.html`
- `_includes/work-grid.html`
- `_includes/proof-card.html`
- `_includes/service-card.html`
- `_includes/cta-block.html`
- `_includes/credential-item.html`

They intentionally reuse existing classes and contain no final redesign styling.

## Content validation

Run content and source validation without Ruby:

```powershell
.\scripts\validate-site.ps1 -SourceOnly
```

If Windows PowerShell blocks local scripts under its current execution policy, run the same check without changing the machine policy:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-site.ps1 -SourceOnly
```

This checks required data files, controlled statuses, duplicate capability IDs and work slugs, capability and evidence references, featured references, collection routing, work disclosures, credential evidence rules, canonical naming, navigation, incomplete reserved dates, and approved-only rendering guards.

After Jekyll builds `_site`, run the complete route and local-link validation:

```powershell
.\scripts\validate-site.ps1
```
