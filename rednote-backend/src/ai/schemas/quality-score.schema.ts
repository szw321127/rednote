import { z } from 'zod';
import type { QualityScore } from '../services/content-quality.service';

const qualityScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  creativity: z.number().min(0).max(100),
  engagement: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  suggestions: z.array(z.string().trim().min(1).max(200)).max(5),
});

export function parseQualityScore(raw: unknown): QualityScore {
  const parsed = qualityScoreSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error('AI output schema validation failed for quality score');
  }

  return parsed.data;
}
