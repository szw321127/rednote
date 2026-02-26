import { validateEnv } from './env.validation';

describe('env.validation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should pass with strong secrets', () => {
    process.env.JWT_SECRET = 'a'.repeat(40);
    process.env.SESSION_SECRET = 'b'.repeat(40);

    const result = validateEnv({ NODE_ENV: 'test' });
    expect(result.JWT_SECRET).toHaveLength(40);
    expect(result.SESSION_SECRET).toHaveLength(40);
  });

  it('should fail when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    process.env.SESSION_SECRET = 'b'.repeat(40);

    expect(() => validateEnv({ NODE_ENV: 'test' })).toThrow(
      'JWT_SECRET is required',
    );
  });

  it('should fail when SESSION_SECRET is weak', () => {
    process.env.JWT_SECRET = 'a'.repeat(40);
    process.env.SESSION_SECRET = 'short-secret';

    expect(() => validateEnv({ NODE_ENV: 'test' })).toThrow(
      'SESSION_SECRET must be at least 32 characters',
    );
  });

  it('should fail on insecure default secret values', () => {
    process.env.JWT_SECRET = 'rednote-jwt-secret-change-in-production';
    process.env.SESSION_SECRET = 'b'.repeat(40);

    expect(() => validateEnv({ NODE_ENV: 'test' })).toThrow(
      'JWT_SECRET uses an insecure default value',
    );
  });
});
