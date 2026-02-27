// HTTP helpers for robust JSON parsing and friendly errors

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  error?: string;
  statusCode?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
};

export async function readTextSafe(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

export function tryParseJson(text: string): unknown | null {
  const t = text.trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as ApiErrorPayload;
  // Nest default shape: { statusCode, message, error }
  if (typeof p.message === 'string' && p.message.trim()) return p.message;
  // Our custom shape: { code, message }
  if (typeof p.error === 'string' && p.error.trim()) return p.error;
  return null;
}

export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await readTextSafe(res);
  const parsed = tryParseJson(text);

  // Non-2xx: try to surface backend message
  if (!res.ok) {
    const msg = extractApiErrorMessage(parsed) || `请求失败：${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  if (parsed == null) {
    // Avoid leaking raw "Unexpected end of JSON input" to users
    throw new Error('服务返回为空或格式异常，请稍后重试。');
  }

  return parsed as T;
}
