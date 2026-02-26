import { BadRequestException } from '@nestjs/common';
import { resolveAndValidateEndpoint } from './ai-endpoint-policy.util';

describe('ai-endpoint-policy.util', () => {
  it('should resolve trusted default OpenAI endpoint', () => {
    const result = resolveAndValidateEndpoint({
      provider: 'openai',
      modelName: 'gpt-4o-mini',
    } as any);

    expect(result.provider).toBe('openai');
    expect(result.baseUrl).toBe('https://api.openai.com');
    expect(result.trusted).toBe(true);
    expect(result.envKeyAutofillAllowed).toBe(true);
  });

  it('should reject non-https baseUrl', () => {
    expect(() =>
      resolveAndValidateEndpoint({
        provider: 'openai',
        baseUrl: 'http://api.openai.com',
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject local/private hosts', () => {
    expect(() =>
      resolveAndValidateEndpoint({
        provider: 'openai',
        baseUrl: 'https://127.0.0.1',
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      resolveAndValidateEndpoint({
        provider: 'google',
        baseUrl: 'https://192.168.1.2',
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject unallowlisted host', () => {
    expect(() =>
      resolveAndValidateEndpoint({
        provider: 'openai',
        baseUrl: 'https://evil.example.com',
      }),
    ).toThrow(BadRequestException);
  });

  it('should allow configured host but disable env autofill for non-default host', () => {
    const result = resolveAndValidateEndpoint(
      {
        provider: 'openai',
        baseUrl: 'https://proxy.example.com',
      },
      'proxy.example.com',
    );

    expect(result.trusted).toBe(true);
    expect(result.envKeyAutofillAllowed).toBe(false);
  });

  it('should reject disallowed path prefix', () => {
    expect(() =>
      resolveAndValidateEndpoint({
        provider: 'openai',
        path: '/not-allowed/path',
      }),
    ).toThrow(BadRequestException);
  });
});
