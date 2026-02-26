const INSECURE_SECRET_VALUES = new Set([
  'rednote-jwt-secret-change-in-production',
  'rednote-default-secret-key-change-in-production',
  'rednote-session-secret-change-in-production',
  'changeme',
  'change-me',
  'default-secret',
]);

function assertStrongSecret(name: string, value?: string): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  if (value.length < 32) {
    throw new Error(`${name} must be at least 32 characters`);
  }

  if (INSECURE_SECRET_VALUES.has(value.toLowerCase())) {
    throw new Error(`${name} uses an insecure default value`);
  }

  return value;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function validateEnv(config: Record<string, unknown>) {
  const jwtSecret = assertStrongSecret(
    'JWT_SECRET',
    process.env.JWT_SECRET ?? asString(config.JWT_SECRET),
  );

  const sessionSecret = assertStrongSecret(
    'SESSION_SECRET',
    process.env.SESSION_SECRET ?? asString(config.SESSION_SECRET),
  );

  return {
    ...config,
    JWT_SECRET: jwtSecret,
    SESSION_SECRET: sessionSecret,
  };
}
