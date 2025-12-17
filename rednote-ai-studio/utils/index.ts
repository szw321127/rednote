import { Outline } from "../types";

// 生成 UUID 的兼容函数
export const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 生成符合 UUID v4 格式的字符串
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 计算两个文本的 Jaccard 相似度
export const calculateJaccardSimilarity = (
  text1: string,
  text2: string
): number => {
  // 将文本转换为小写并分词
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  // 计算交集
  const intersection = new Set([...words1].filter((x) => words2.has(x)));

  // 计算并集
  const union = new Set([...words1, ...words2]);

  // 返回 Jaccard 相似度
  return union.size === 0 ? 0 : intersection.size / union.size;
};

// 检查新大纲与现有大纲的相似度
export const isSimilarToExisting = (
  newOutline: Outline,
  existingOutlines: Outline[],
  threshold: number = 0.6
): boolean => {
  for (const existing of existingOutlines) {
    // 比较标题和内容的相似度
    const titleSimilarity = calculateJaccardSimilarity(
      newOutline.title,
      existing.title
    );
    const contentSimilarity = calculateJaccardSimilarity(
      newOutline.content,
      existing.content
    );

    // 如果标题或内容的相似度超过阈值，则认为相似
    if (titleSimilarity > threshold || contentSimilarity > threshold) {
      return true;
    }
  }
  return false;
};
