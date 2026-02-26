import { parseQualityScore } from './quality-score.schema';

describe('quality-score.schema', () => {
  it('should parse valid quality score payload', () => {
    const parsed = parseQualityScore({
      overall: 85,
      creativity: 80,
      engagement: 82,
      clarity: 90,
      suggestions: ['建议1'],
    });

    expect(parsed.overall).toBe(85);
  });

  it('should reject out-of-range scores', () => {
    expect(() =>
      parseQualityScore({
        overall: 101,
        creativity: 80,
        engagement: 82,
        clarity: 90,
        suggestions: ['建议1'],
      }),
    ).toThrow('AI output schema validation failed for quality score');
  });
});
