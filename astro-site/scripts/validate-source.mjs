import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(import.meta.dirname, '..');
const failures = [];
const workKinds = new Set(['professional', 'portfolio-simulation', 'technical-project', 'educational-capstone', 'proposed-system', 'pending-classification']);
const evidenceStatuses = new Set(['verified', 'artifact-supported', 'self-reported', 'unverified', 'synthetic', 'not-applicable']);
const implementationStatuses = new Set(['implemented', 'completed-project', 'documented-demonstration', 'simulated', 'proposed', 'not-applicable']);
const contentDirectories = ['case-studies', 'projects'];
const records = [];

for (const directory of contentDirectories) {
  for (const filename of readdirSync(join(root, 'src', 'content', directory)).filter((name) => name.endsWith('.md'))) {
    const source = readFileSync(join(root, 'src', 'content', directory, filename), 'utf8');
    const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
    if (!match) { failures.push(`Missing front matter: ${directory}/${filename}`); continue; }
    const data = parse(match[1]);
    records.push({ directory, filename, source, data });
    if (!workKinds.has(data.work_kind)) failures.push(`Invalid work_kind in ${filename}: ${data.work_kind}`);
    if (!evidenceStatuses.has(data.evidence_status)) failures.push(`Invalid evidence_status in ${filename}: ${data.evidence_status}`);
    if (!implementationStatuses.has(data.implementation_status)) failures.push(`Invalid implementation_status in ${filename}: ${data.implementation_status}`);
    if (!data.slug || !data.title || !data.summary || !data.disclosure) failures.push(`Empty required published record field in ${filename}`);
    if (data.work_kind === 'portfolio-simulation' && !/portfolio simulation/i.test(data.disclosure)) failures.push(`Simulation disclosure is not explicit in ${filename}`);
    if (data.work_kind === 'portfolio-simulation' && data.outcome_status !== 'synthetic') failures.push(`Simulation outcomes are not synthetic in ${filename}`);
    if (/^date:\s*["']?\d{4}-\d{2}["']?\s*$/m.test(match[1])) failures.push(`Incomplete reserved date in ${filename}`);
  }
}

const slugs = records.map(({ data }) => data.slug);
for (const slug of new Set(slugs)) if (slugs.filter((value) => value === slug).length !== 1) failures.push(`Duplicate work slug: ${slug}`);

const caseRecords = records.filter(({ directory }) => directory === 'case-studies');
const pdfDirectory = join(root, 'public', 'assets', 'case-studies');
const pdfs = readdirSync(pdfDirectory).filter((name) => name.toLowerCase().endsWith('.pdf'));
for (const record of caseRecords) {
  const filename = record.data.artifact_url?.split('/').pop();
  if (!filename || !existsSync(join(pdfDirectory, filename))) failures.push(`Missing case-study artifact for ${record.filename}`);
}
for (const pdf of pdfs) {
  const associations = caseRecords.filter(({ data }) => data.artifact_url?.endsWith(`/${pdf}`));
  if (associations.length !== 1) failures.push(`Expected one canonical record for ${pdf}; found ${associations.length}`);
}

const profileSource = readFileSync(join(root, 'src', 'data', 'profile.yml'), 'utf8');
const profile = parse(profileSource);
if (profile.career_progression?.length !== 11) failures.push(`Expected 11 career records; found ${profile.career_progression?.length ?? 0}`);
for (const role of profile.career_progression ?? []) if ((role.bullets?.length ?? 0) > 3) failures.push(`Career role ${role.id} exceeds three bullets`);
const ea = profile.career_progression?.find((role) => role.id === 'executive-assistant-personal-assistant');
if (!ea || ea.organization !== 'Various Employers' || ea.start_label !== 'December 2017' || ea.end_label !== 'May 2019' || !/Neuto Entertainment/.test(ea.employment_context ?? '')) failures.push('EA/PA record is missing its approved organization, dates, or context');
const gateway = profile.career_progression?.find((role) => role.id === 'fast-gateway-system');
if (!gateway || gateway.organization !== 'Fast Gateway System') failures.push('Fast Gateway System record is missing or renamed');
const director = profile.career_progression?.find((role) => role.id === 'bpo-sales-group');
if (!director || director.actual_title !== 'Director of Client Services' || director.end_label !== 'Present') failures.push('Current Director of Client Services record is missing or altered');

const textFiles = ['src/data/profile.yml', 'src/data/homepage.yml', 'src/data/capabilities.yml', 'src/data/credentials.yml', ...records.map(({ directory, filename }) => `src/content/${directory}/${filename}`)];
const publishableText = textFiles.map((path) => readFileSync(join(root, path), 'utf8')).join('\n');
for (const prohibited of [/Salesforce Administrator/i, /Fast Gateway Enterprises/i, /Niña Peterine/i, /\bNiña Suico\b/i, /\bBachelor(?:'s)?\b/i, /\bMaster(?:'s)? degree\b/i]) if (prohibited.test(publishableText)) failures.push(`Prohibited claim matched: ${prohibited}`);
if (/\b\d+(?:\.\d+)?%/.test(publishableText)) failures.push('Unsupported percentage metric found in publishable Astro content');

if (records.length !== 6 || caseRecords.length !== 4 || pdfs.length !== 4) failures.push(`Expected 6 work records, 4 case studies, and 4 PDFs; found ${records.length}, ${caseRecords.length}, and ${pdfs.length}`);
if (failures.length) { failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1); }
console.log(`Validated ${records.length} work records, ${profile.career_progression.length} career records, ${pdfs.length} case-study PDFs, controlled statuses, disclosures, and prohibited claims.`);
