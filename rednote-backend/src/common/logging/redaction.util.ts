const REDACTED = '[REDACTED]';

const SECRET_PATTERNS: RegExp[] = [
  /(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi,
  /([?&](?:key|api[_-]?key|access[_-]?token|refresh[_-]?token|token)=)[^&\s]+/gi,
  /((?:authorization|api[_-]?key|x-goog-api-key)\s*[:=]\s*["']?)[^"'\s,}]+/gi,
];

const SENSITIVE_KEY_PATTERN =
  /(authorization|api[_-]?key|x-goog-api-key|password|secret|token)/i;

function redactSecretString(value: string): string {
  return SECRET_PATTERNS.reduce(
    (acc, pattern) => acc.replace(pattern, `$1${REDACTED}`),
    value,
  );
}

function sanitizeObject(value: unknown, depth: number = 0): unknown {
  if (depth > 6 || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, raw] of Object.entries(source)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = REDACTED;
      } else {
        sanitized[key] = sanitizeObject(raw, depth + 1);
      }
    }

    return sanitized;
  }

  if (typeof value === 'string') {
    return redactSecretString(value);
  }

  return value;
}

export function redactSecrets(input: unknown): string {
  if (typeof input === 'string') {
    return redactSecretString(input);
  }

  if (input instanceof Error) {
    return redactSecretString(input.message);
  }

  try {
    return redactSecretString(JSON.stringify(sanitizeObject(input)));
  } catch {
    return REDACTED;
  }
}

export function summarizeText(value: string, maxLength: number = 120): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}
