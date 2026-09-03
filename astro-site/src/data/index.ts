import { z } from 'astro/zod';
import { parse } from 'yaml';
import capabilitiesRaw from './capabilities.yml?raw';
import credentialsRaw from './credentials.yml?raw';
import ctasRaw from './ctas.yml?raw';
import homepageRaw from './homepage.yml?raw';
import navigationRaw from './navigation.yml?raw';
import profileRaw from './profile.yml?raw';

const status = z.literal('approved');
const evidenceStatus = z.enum(['verified', 'artifact-supported', 'self-reported', 'unverified', 'synthetic', 'not-applicable']);

const navigationSchema = z.array(z.object({ label: z.string(), url: z.string().startsWith('/') }));
const homepageSchema = z.object({
  status,
  problems_heading: z.string(),
  problems: z.array(z.string()).length(6),
  how_i_work_heading: z.string(),
  how_i_work: z.array(z.object({ title: z.string(), description: z.string() })).length(3),
  about_heading: z.string(),
  about_summary: z.string(),
});
const capabilitySchema = z.object({
  id: z.string(), title: z.string(), status, evidence_status: evidenceStatus,
  career_basis: z.string(),
  claims: z.array(z.object({ id: z.string(), label: z.string(), status })),
  platforms: z.array(z.string()).optional(),
});
const credentialSchema = z.object({
  id: z.string(), name: z.string(), issuer: z.string(), status,
  date_label: z.string(), credential_status: evidenceStatus,
  verification_status: evidenceStatus, evidence_url: z.string(),
  areas: z.array(z.string()).optional(),
});
const careerStageSchema = z.object({ id: z.string(), title: z.string(), summary: z.string(), expanded: z.boolean() });
const careerRoleSchema = z.object({
  id: z.string(), stage_id: z.string(), organization: z.string(), actual_title: z.string(),
  start_label: z.string(), end_label: z.string(), display_priority: z.number().int(),
  evidence_status: evidenceStatus, scope: z.string(), bullets: z.array(z.string()).max(3),
  capability_ids: z.array(z.string()).min(1),
  sort_start_year: z.number().int(), sort_start_month: z.number().int(),
  sort_end_year: z.number().int().optional(), sort_end_month: z.number().int().optional(),
  engagement_type: z.string().optional(), employment_context: z.string().optional(),
  functional_descriptor: z.string().optional(), concurrent_note: z.string().optional(),
});
const profileSchema = z.object({
  status, name: z.literal('Nina Suico'), role: z.literal('Business Operations & Systems Analyst'),
  value_proposition: z.string(), supporting_statement: z.string(),
  location_label: z.string(), mobility_label: z.string(), availability_label: z.string(),
  market_context: z.string(), markets: z.array(z.string()),
  professional_narrative: z.array(z.string()),
  career_stages: z.array(careerStageSchema).length(5),
  career_progression: z.array(careerRoleSchema).length(11),
  industries: z.array(z.string()), working_style: z.array(z.string()),
  contact: z.object({ linkedin: z.url(), email: z.string().startsWith('mailto:'), github: z.url(), resume: z.literal('/assets/docs/resume.pdf') }),
});
const ctasSchema = z.object({ items: z.array(z.object({ id: z.string(), status, heading: z.string(), body: z.string(), label: z.string(), url: z.string() })) });

export const navigation = navigationSchema.parse(parse(navigationRaw));
export const homepage = homepageSchema.parse(parse(homepageRaw));
export const capabilities = z.array(capabilitySchema).length(3).parse(parse(capabilitiesRaw));
export const credentials = z.array(credentialSchema).parse(parse(credentialsRaw));
export const profile = profileSchema.parse(parse(profileRaw));
export const ctas = ctasSchema.parse(parse(ctasRaw));

export type Capability = (typeof capabilities)[number];
export type CareerRole = (typeof profile.career_progression)[number];
