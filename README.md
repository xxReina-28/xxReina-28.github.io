# Niña Suico Portfolio

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
- `_site/operations/index.html`
- `_site/services/index.html`

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
| Positioning | `_data/positioning.yml` | Working role, value proposition, capability line, audience context, and future SEO fields |
| Homepage order | `_data/homepage.yml` | Future business-facing section hierarchy and its data sources |
| Capabilities | `_data/capabilities.yml` | Four capability groups, individual claims, publication states, and evidence references |
| Operations model | `_data/operations.yml` | Draft-safe topics for the future Operations narrative |
| Services | `_data/services.yml` | Working engagement categories and their related capabilities |
| Proof points | `_data/proof.yml` | Approved claims and supporting evidence; currently empty |
| Credentials | `_data/credentials.yml` | Credentials already stated on the current portfolio |
| Testimonials | `_data/testimonials.yml` | Approved attributed testimonials; currently empty |
| Calls to action | `_data/ctas.yml` | Reusable approved CTA records; currently empty |
| Featured references | `_data/featured.yml` | Ordered references to approved featured projects and case studies |
| Projects | `_projects/*.md` | Portfolio and technical project records |
| Case studies | `_case_studies/*.md` | Long-form evidence records; currently empty |

The homepage remains hand-authored in `index.md` until its later content phase. Reusable records should not be copied back into that file when the homepage is converted; render them through includes instead.

### Publication status

Allowed statuses are:

- `approved`: eligible for public rendering.
- `draft`: working content that must remain private to the source repository.
- `future`: a planned capability or content area that is not yet a public claim.

The supplied includes render only records whose status is `approved`. Collection output is disabled in `_config.yml`, so project and case-study documents do not automatically receive public URLs. Pages consuming a collection must also filter it to `approved` before rendering.

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
date: ""
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

### Homepage hierarchy

`_data/homepage.yml` records the future order without changing `index.md` in this phase:

1. Hero
2. Business problems / context
3. Core capabilities
4. Featured work
5. Operations perspective
6. Proof / selected outcomes
7. Credentials
8. About
9. Final CTA

The record is `draft` and is not consumed publicly yet. When the homepage is rebuilt, each section should render only approved records and should be omitted when its approved collection is empty.

### Featured content

`featured: true` identifies an item as eligible for featured treatment. `_data/featured.yml` supplies explicit ordering and must reference an existing approved record. Empty content types should not render an empty public section.

### Reusable includes

The semantic, approved-only presentation includes are:

- `_includes/capability-card.html`
- `_includes/work-card.html`
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

This checks required data files, allowed statuses, duplicate capability IDs and collection slugs, capability and evidence references, featured references, disabled collection output, and approved-only rendering guards.

After Jekyll builds `_site`, run the complete route and local-link validation:

```powershell
.\scripts\validate-site.ps1
```
