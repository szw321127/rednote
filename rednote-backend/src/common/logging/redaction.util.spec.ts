import { redactSecrets, summarizeText } from './redaction.util';

describe('redaction.util', () => {
  it('should redact bearer tokens and URL query keys in strings', () => {
    const raw =
      'Authorization: Bearer abc.def.ghi https://example.com/v1?key=secret123&x=1';

    const redacted = redactSecrets(raw);

    expect(redacted).toContain('Authorization: [REDACTED]');
    expect(redacted).toContain('key=[REDACTED]');
    expect(redacted).not.toContain('abc.def.ghi');
    expect(redacted).not.toContain('secret123');
  });

  it('should redact apiKey/authorization fields in objects', () => {
    const redacted = redactSecrets({
      apiKey: 'sk-test-secret',
      nested: {
        Authorization: 'Bearer nested-secret',
        safe: 'ok',
      },
    });

    expect(redacted).toContain('"apiKey":"[REDACTED]"');
    expect(redacted).toContain('"Authorization":"[REDACTED]"');
    expect(redacted).toContain('"safe":"ok"');
    expect(redacted).not.toContain('sk-test-secret');
    expect(redacted).not.toContain('nested-secret');
  });

  it('should redact error messages', () => {
    const error = new Error('upstream failed with apiKey=abc123');
    const redacted = redactSecrets(error);

    expect(redacted).toContain('apiKey=[REDACTED]');
    expect(redacted).not.toContain('abc123');
  });

  it('should summarize long text', () => {
    const summary = summarizeText('a'.repeat(20), 10);
    expect(summary).toBe('aaaaaaaaaa...');
  });
});
