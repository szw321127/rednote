import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';

export interface ModelConfigLike {
  provider?: string;
  baseUrl?: string;
  path?: string;
}

export interface ResolvedEndpoint {
  provider: string;
  baseUrl: string;
  path?: string;
  trusted: boolean;
  hostname: string;
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com',
  google: 'https://generativelanguage.googleapis.com',
};

const PROVIDER_PATH_ALLOWLIST: Record<string, string[]> = {
  openai: ['/v1/'],
  google: ['/v1', '/v1beta'],
};

const DEFAULT_ALLOWLIST = [
  'api.openai.com',
  'generativelanguage.googleapis.com',
];

const LOCAL_HOSTNAMES = new Set(['localhost', 'localhost.localdomain']);

function normalizeProvider(provider?: string): string {
  const value = (provider || '').toLowerCase();
  if (value === 'gemini') {
    return 'google';
  }
  return value;
}

function parseAllowlist(raw?: string): Set<string> {
  const parsed = new Set<string>(DEFAULT_ALLOWLIST);

  if (!raw) {
    return parsed;
  }

  const entries = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const entry of entries) {
    try {
      const candidate = entry.includes('://') ? entry : `https://${entry}`;
      const url = new URL(candidate);
      if (url.hostname) {
        parsed.add(url.hostname.toLowerCase());
        if (url.port) {
          parsed.add(`${url.hostname.toLowerCase()}:${url.port}`);
        }
      }
    } catch {
      // Ignore malformed allowlist entry.
    }
  }

  return parsed;
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  if (LOCAL_HOSTNAMES.has(lower) || lower.endsWith('.local')) {
    return true;
  }

  const ipType = isIP(lower);

  if (ipType === 4) {
    const parts = lower.split('.').map((part) => Number(part));
    const [a, b] = parts;

    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;

    return false;
  }

  if (ipType === 6) {
    return (
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe80:')
    );
  }

  return false;
}

function assertPathAllowed(provider: string, path?: string): void {
  if (!path) {
    return;
  }

  if (!path.startsWith('/')) {
    throw new BadRequestException('Model config path must start with /');
  }

  if (path.includes('..')) {
    throw new BadRequestException('Model config path cannot contain ..');
  }

  const allowedPrefixes = PROVIDER_PATH_ALLOWLIST[provider];
  if (!allowedPrefixes || allowedPrefixes.length === 0) {
    return;
  }

  const allowed = allowedPrefixes.some((prefix) => path.startsWith(prefix));
  if (!allowed) {
    throw new BadRequestException(
      `Path is not allowed for provider ${provider}. Allowed prefixes: ${allowedPrefixes.join(', ')}`,
    );
  }
}

export function resolveAndValidateEndpoint(
  modelConfig: ModelConfigLike,
  allowlistRaw?: string,
): ResolvedEndpoint {
  const provider = normalizeProvider(modelConfig.provider);

  if (!provider) {
    throw new BadRequestException('Model provider is required');
  }

  const baseUrl = modelConfig.baseUrl || DEFAULT_BASE_URLS[provider];
  if (!baseUrl) {
    throw new BadRequestException(`Unsupported provider: ${provider}`);
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new BadRequestException('Invalid model baseUrl');
  }

  if (parsed.protocol !== 'https:') {
    throw new BadRequestException('Only https baseUrl is allowed');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (isLocalOrPrivateHost(hostname)) {
    throw new BadRequestException('baseUrl cannot target local/private hosts');
  }

  const allowlist = parseAllowlist(allowlistRaw);
  const hostWithPort = parsed.port ? `${hostname}:${parsed.port}` : hostname;
  const trusted = allowlist.has(hostname) || allowlist.has(hostWithPort);

  if (!trusted) {
    throw new BadRequestException(
      `baseUrl host is not allowlisted: ${hostname}. Configure AI_BASE_URL_ALLOWLIST to permit additional hosts.`,
    );
  }

  assertPathAllowed(provider, modelConfig.path);

  return {
    provider,
    baseUrl: parsed.origin,
    path: modelConfig.path,
    trusted,
    hostname,
  };
}
