import { parseOutlineOutput } from './outline-output.schema';

describe('outline-output.schema', () => {
  it('should parse valid outline payload', () => {
    const parsed = parseOutlineOutput([
      {
        title: '示例标题',
        content: '示例内容',
        emoji: '📝',
        tags: ['tag1', 'tag2'],
      },
    ]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('示例标题');
  });

  it('should reject malformed outlines', () => {
    expect(() =>
      parseOutlineOutput([
        {
          title: 'missing content',
          emoji: '📝',
          tags: ['tag1'],
        },
      ]),
    ).toThrow('AI output schema validation failed for outlines');
  });
});
