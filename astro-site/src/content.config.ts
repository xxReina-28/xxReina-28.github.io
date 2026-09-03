import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const workKinds = ['professional', 'portfolio-simulation', 'technical-project', 'educational-capstone', 'proposed-system', 'pending-classification'] as const;
const evidenceStatuses = ['verified', 'artifact-supported', 'self-reported', 'unverified', 'synthetic', 'not-applicable'] as const;
const implementationStatuses = ['implemented', 'completed-project', 'documented-demonstration', 'simulated', 'proposed', 'not-applicable'] as const;
const dataClassifications = ['professional', 'synthetic', 'mixed', 'not-applicable'] as const;
const outcomeStatuses = ['verified', 'unverified', 'synthetic', 'project-output', 'not-applicable'] as const;

const baseWorkSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.string().optional(),
  published: z.boolean().optional().default(true),
  status: z.literal('approved'),
  featured: z.boolean().default(false),
  flagship_order: z.number().int().positive().optional(),
  work_kind: z.enum(workKinds),
  classification_status: z.string().optional(),
  evidence_status: z.enum(evidenceStatuses),
  verification_status: z.enum(evidenceStatuses),
  implementation_status: z.enum(implementationStatuses),
  data_classification: z.enum(dataClassifications),
  outcome_status: z.enum(outcomeStatuses),
  summary: z.string().min(1),
  disclosure: z.string().min(1),
  artifact_url: z.string().startsWith('/assets/').optional(),
  artifact_label: z.string().min(1).optional(),
  repository_url: z.url().optional(),
  capability_ids: z.array(z.string()).min(1),
  tools: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).optional(),
  evidence: z.array(z.string()).optional(),
  date_label: z.string().optional(),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    social_description: z.string(),
    og_image: z.string(),
  }).optional(),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: baseWorkSchema.extend({
    work_kind: z.literal('portfolio-simulation'),
    evidence_status: z.literal('artifact-supported'),
    implementation_status: z.literal('simulated'),
    data_classification: z.literal('synthetic'),
    outcome_status: z.literal('synthetic'),
    artifact_url: z.string().startsWith('/assets/case-studies/').endsWith('.pdf'),
    artifact_label: z.string().min(1),
    flagship_order: z.number().int().min(1).max(4),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: baseWorkSchema,
});

export const collections = { caseStudies, projects };
export { workKinds, evidenceStatuses, implementationStatuses, dataClassifications, outcomeStatuses };
