import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const failures = [];
const expectedOrigin = (process.env.SITE_ORIGIN || 'https://xxreina-28.github.io').replace(/\/$/, '');
const requiredRoutes = ['index.html', 'work/index.html', 'about/index.html', 'contact/index.html', '404.html', 'work/business-operations-diagnostic-process-redesign/index.html', 'work/revenue-operations-sales-performance-system/index.html', 'work/strategic-procurement-supplier-decision-system/index.html', 'work/project-delivery-recovery-scrum-operating-system/index.html', 'work/employee-of-the-month-automation/index.html', 'work/pipeline-strategist-agent/index.html'];
const publicRoutePaths = ['/', '/work/', '/about/', '/contact/', '/work/business-operations-diagnostic-process-redesign/', '/work/revenue-operations-sales-performance-system/', '/work/strategic-procurement-supplier-decision-system/', '/work/project-delivery-recovery-scrum-operating-system/', '/work/employee-of-the-month-automation/', '/work/pipeline-strategist-agent/'];
const requiredAssets = ['assets/docs/resume.pdf', 'assets/img/ns-mark.svg', 'assets/img/favicon.png', 'assets/img/profile.jpg', 'assets/case-studies/operations-diagnostic-process-redesign.pdf', 'assets/case-studies/revenue-operations-sales-performance-system.pdf', 'assets/case-studies/strategic-procurement-supplier-decision-system.pdf', 'assets/case-studies/project-delivery-recovery-scrum-operating-system.pdf'];
const forbidden = ['operations', 'services', 'README.md', 'README.html', 'structure', 'scripts', '_data', '_projects', '_case_studies', '.github', '_config.yml', 'Gemfile'];

if (!existsSync(dist)) failures.push('dist directory does not exist');
for (const relative of requiredRoutes) if (!existsSync(join(dist, relative))) failures.push(`Missing route: ${relative}`);
for (const relative of requiredAssets) if (!existsSync(join(dist, relative))) failures.push(`Missing asset: ${relative}`);
for (const relative of forbidden) if (existsSync(join(dist, relative))) failures.push(`Forbidden development output: ${relative}`);

const walk = (directory) => readdirSync(directory).flatMap((name) => { const path = join(directory, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
const htmlFiles = existsSync(dist) ? walk(dist).filter((path) => extname(path) === '.html') : [];
const javascriptFiles = existsSync(dist) ? walk(dist).filter((path) => extname(path) === '.js') : [];
if (javascriptFiles.length) failures.push(`Expected no JavaScript output; found ${javascriptFiles.length} files`);
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const relative = file.slice(dist.length + 1);
  if ((html.match(/<main\b/gi) ?? []).length !== 1) failures.push(`Expected one main landmark: ${relative}`);
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) failures.push(`Expected one H1: ${relative}`);
  const canonicalMatches = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/gi)];
  if (canonicalMatches.length !== 1) failures.push(`Expected one canonical: ${relative}`);
  else if (!canonicalMatches[0][1].startsWith(`${expectedOrigin}/`)) failures.push(`Canonical does not use ${expectedOrigin}: ${relative}`);
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(html)) failures.push(`Missing title: ${relative}`);
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|#|\/\/)/i.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    if (!clean) continue;
    let candidate = clean.startsWith('/') ? join(dist, clean.slice(1)) : resolve(dirname(file), clean);
    if (clean.endsWith('/') || (existsSync(candidate) && statSync(candidate).isDirectory())) candidate = join(candidate, 'index.html');
    if (!existsSync(normalize(candidate))) failures.push(`Broken local reference in ${relative}: ${reference}`);
  }
}

const robotsPath = join(dist, 'robots.txt');
if (!existsSync(robotsPath)) failures.push('Missing robots.txt');
else {
  const robots = readFileSync(robotsPath, 'utf8');
  if (!new RegExp(`^Sitemap: ${expectedOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap-index\\.xml$`, 'm').test(robots)) failures.push(`robots.txt does not reference the ${expectedOrigin} sitemap`);
  if (/^\s*Disallow:\s*\/$/mi.test(robots)) failures.push('Production robots.txt contains a broad crawl block');
}

const sitemapIndex = join(dist, 'sitemap-index.xml');
const sitemapPage = join(dist, 'sitemap-0.xml');
if (!existsSync(sitemapIndex) || !existsSync(sitemapPage)) failures.push('Missing generated sitemap-index.xml or sitemap-0.xml');
else {
  const sitemap = readFileSync(sitemapPage, 'utf8');
  for (const route of publicRoutePaths) if (!sitemap.includes(`<loc>${expectedOrigin}${route}</loc>`)) failures.push(`Sitemap is missing: ${route}`);
  if (/<loc>[^<]*(?:\/404\/?|\/operations\/?|\/services\/?|\/astro-site\/?|\/\.qa-output\/?|\/src\/|\/scripts\/)(?:<|[^<]*)/i.test(sitemap)) failures.push('Sitemap contains a non-public route');
}

if (failures.length) { failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1); }
console.log(`Validated ${requiredRoutes.length} routes, ${requiredAssets.length} assets, ${htmlFiles.length} HTML files, sitemap, robots, canonicals, internal links, landmarks, and public-output hygiene.`);
