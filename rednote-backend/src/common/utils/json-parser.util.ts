/**
 * AI 输出 JSON 解析工具函数
 * 处理：thinking 内容、markdown 代码块、前后解释文字
 */

import { Outline } from '../interfaces/outline.interface';

/**
 * 从 AI 输出中提取 JSON 数组
 */
export function extractJsonArray(text: string): string {
  let cleaned = text.trim();

  // 1. 移除 <think>...</think> 或 <thinking>...</thinking> 标签
  cleaned = cleaned.replace(/<think(?:ing)?[\s\S]*?<\/think(?:ing)?>/gi, '');

  // 2. 移除 markdown 代码块标记
  cleaned = cleaned
    .replace(/```(?:json)?\s*\n?/gi, '')
    .replace(/\n?```\s*$/gi, '');

  // 3. 提取 JSON 数组
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    throw new Error('No JSON array found in response');
  }

  return jsonMatch[0];
}

/**
 * 解析并验证数组
 */
export function parseJsonArray<T>(text: string): T[] {
  const jsonString = extractJsonArray(text);
  const parsed = JSON.parse(jsonString);

  if (!Array.isArray(parsed)) {
    throw new Error('Parsed result is not an array');
  }

  return parsed as T[];
}

/**
 * 验证单个 Outline 对象
 */
export function validateOutline(item: unknown): Outline {
  if (!item || typeof item !== 'object') {
    throw new Error('Outline must be an object');
  }

  const obj = item as Record<string, unknown>;

  if (typeof obj.title !== 'string') {
    throw new Error('Outline.title must be a string');
  }
  if (typeof obj.content !== 'string') {
    throw new Error('Outline.content must be a string');
  }
  if (typeof obj.emoji !== 'string') {
    throw new Error('Outline.emoji must be a string');
  }
  if (!Array.isArray(obj.tags)) {
    throw new Error('Outline.tags must be an array');
  }

  return {
    title: obj.title,
    content: obj.content,
    emoji: obj.emoji,
    tags: obj.tags.map((t) => {
      if (typeof t !== 'string') {
        throw new Error('Each tag must be a string');
      }
      return t;
    }),
  };
}

/**
 * 解析并验证 Outline 数组
 */
export function parseOutlines(text: string): Outline[] {
  const items = parseJsonArray<unknown>(text);
  return items.map((item, index) => {
    try {
      return validateOutline(item);
    } catch (error) {
      throw new Error(`Outline[${index}]: ${error instanceof Error ? error.message : 'Invalid outline'}`);
    }
  });
}
