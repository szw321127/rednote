import { z } from 'zod';
import { Outline } from '../../common/interfaces/outline.interface';

const outlineSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(800),
  emoji: z.string().trim().min(1).max(16).default('📝'),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10)
    .default([]),
});

const outlinesSchema = z.array(outlineSchema).min(1).max(20);

export function parseOutlineOutput(raw: unknown): Outline[] {
  const parsed = outlinesSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error('AI output schema validation failed for outlines');
  }

  return parsed.data.map((item) => ({
    title: item.title,
    content: item.content,
    emoji: item.emoji,
    tags: item.tags,
  }));
}
