import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const failures = [];
const requiredRoutes = ['index.html', 'work/index.html', 'about/index.html', 'contact/index.html', '404.html', 'work/business-operations-diagnostic-process-redesign/index.html', 'work/revenue-operations-sales-performance-system/index.html', 'work/strategic-procurement-supplier-decision-system/index.html', 'work/project-delivery-recovery-scrum-operating-system/index.html', 'work/employee-of-the-month-automation/index.html', 'work/pipeline-strategist-agent/index.html'];
const requiredAssets = ['assets/docs/resume.pdf', 'assets/img/ns-mark.svg', 'assets/img/favicon.png', 'assets/img/profile.jpg', 'assets/case-studies/operations-diagnostic-process-redesign.pdf', 'assets/case-studies/revenue-operations-sales-performance-system.pdf', 'assets/case-studies/strategic-procurement-supplier-decision-system.pdf', 'assets/case-studies/project-delivery-recovery-scrum-operating-system.pdf'];
const forbidden = ['operations', 'services', 'README.md', 'README.html', 'structure', 'scripts', '_data', '_projects', '_case_studies', '.github', '_config.yml', 'Gemfile'];

if (!existsSync(dist)) failures.push('dist directory does not exist');
for (const relative of requiredRoutes) if (!existsSync(join(dist, relative))) failures.push(`Missing route: ${relative}`);
for (const relative of requiredAssets) if (!existsSync(join(dist, relative))) failures.push(`Missing asset: ${relative}`);
for (const relative of forbidden) if (existsSync(join(dist, relative))) failures.push(`Forbidden development output: ${relative}`);

const walk = (directory) => readdirSync(directory).flatMap((name) => { const path = join(directory, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
const htmlFiles = existsSync(dist) ? walk(dist).filter((path) => extname(path) === '.html') : [];
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const relative = file.slice(dist.length + 1);
  if ((html.match(/<main\b/gi) ?? []).length !== 1) failures.push(`Expected one main landmark: ${relative}`);
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) failures.push(`Expected one H1: ${relative}`);
  if ((html.match(/<link[^>]+rel=["']canonical["']/gi) ?? []).length !== 1) failures.push(`Expected one canonical: ${relative}`);
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

if (failures.length) { failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1); }
console.log(`Validated ${requiredRoutes.length} routes, ${requiredAssets.length} assets, ${htmlFiles.length} HTML files, internal links, landmarks, and public-output hygiene.`);
