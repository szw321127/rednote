import { useCallback, useEffect, useRef, useState } from "react";
import { saveHistory } from "../services/db";
import { ApiService } from "../services/geminiService";
import { AppSettings, CompletedContent, GeneratedPost, Outline } from "../types";
import { generateUUID, isSimilarToExisting } from "../utils";

const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === "AbortError";
};

export const useGenerator = (
  settings: AppSettings,
  initialPost?: GeneratedPost | null,
  onPostRestored?: () => void
) => {
  const [step, setStep] = useState<number>(0);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [completedContents, setCompletedContents] = useState<CompletedContent[]>([]);
  const [progressText, setProgressText] = useState("");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const service = new ApiService(settings);

  // 从历史记录恢复状态
  useEffect(() => {
    if (initialPost) {
      setTopic(initialPost.topic);
      setOutlines(initialPost.outlines);
      setCurrentHistoryId(initialPost.id);

      // 处理新格式的 completedContents
      if (initialPost.completedContents && initialPost.completedContents.length > 0) {
        setCompletedContents(initialPost.completedContents);
        setStep(2);
      }
      // 向后兼容：处理旧格式的单个成品
      else if (initialPost.imageUrl && initialPost.fullCaption && initialPost.selectedOutline) {
        const legacyContent: CompletedContent = {
          id: generateUUID(),
          outline: initialPost.selectedOutline,
          imageUrl: initialPost.imageUrl,
          caption: initialPost.fullCaption,
          createdAt: initialPost.updatedAt,
        };
        setCompletedContents([legacyContent]);
        setStep(2);
      }
      else if (initialPost.status === "outline") {
        setStep(1);
      }

      onPostRestored?.();
    }
  }, [initialPost]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setProgressText("已取消");
  }, []);

  // 生成大纲
  const handleGenerateOutlines = async () => {
    if (!topic.trim()) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsGenerating(true);
    setStep(1);
    setProgressText("正在请求后端生成大纲...");
    setOutlines([]);

    try {
      const results = await service.generateOutlinesStream(
        topic,
        (chunk) => {
          if (chunk.length < 50) setProgressText("正在接收流式数据...");
        },
        abortController.signal,
      );
      setOutlines(results);

      const historyId = currentHistoryId || generateUUID();
      setCurrentHistoryId(historyId);

      const historyPost: GeneratedPost = {
        id: historyId,
        topic,
        status: "outline",
        outlines: results,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveHistory(historyPost);
    } catch (e) {
      if (isAbortError(e)) {
        setStep(0);
        return;
      }

      alert("生成大纲失败，请检查后端连接或重试。");
      setStep(0);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  // 再生成大纲
  const handleRegenerateOutlines = async () => {
    if (!topic.trim()) return;

    if (outlines.length >= 9) {
      alert("已达到最大大纲数量（9个），无法再生成更多大纲。");
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsGenerating(true);
    setProgressText("正在生成新的大纲...");

    try {
      const results = await service.generateOutlinesStream(
        topic,
        (chunk) => {
          if (chunk.length < 50) setProgressText("正在接收流式数据...");
        },
        abortController.signal,
      );

      const filteredResults = results.filter((newOutline) => {
        return !isSimilarToExisting(newOutline, outlines, 0.6);
      });

      if (filteredResults.length === 0) {
        alert("生成的新大纲与现有大纲过于相似，请重试。");
        return;
      }

      const availableSlots = 9 - outlines.length;
      const newOutlines = filteredResults.slice(0, availableSlots);
      const updatedOutlines = [...outlines, ...newOutlines];
      setOutlines(updatedOutlines);

      const historyId = currentHistoryId || generateUUID();
      setCurrentHistoryId(historyId);

      const historyPost: GeneratedPost = {
        id: historyId,
        topic,
        status: "outline",
        outlines: updatedOutlines,
        createdAt: currentHistoryId
          ? (initialPost?.createdAt || Date.now())
          : Date.now(),
        updatedAt: Date.now(),
      };

      await saveHistory(historyPost);
      alert(`成功添加了 ${newOutlines.length} 个新大纲！`);
    } catch (e) {
      if (isAbortError(e)) {
        return;
      }

      alert("生成新大纲失败，请检查后端连接或重试。");
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  // 选择大纲生成成品
  const handleSelectOutline = async (outline: Outline) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsGenerating(true);
    setStep(2);
    setProgressText("正在后端生成图片与文案...");

    try {
      const { imageUrl, caption } = await service.generateImageAndCaption(
        outline,
        abortController.signal,
      );

      // 创建新的成品内容
      const newContent: CompletedContent = {
        id: generateUUID(),
        outline,
        imageUrl,
        caption,
        createdAt: Date.now(),
      };

      // 追加到现有成品列表
      const updatedContents = [...completedContents, newContent];
      setCompletedContents(updatedContents);

      // 保存历史记录
      const historyId = currentHistoryId || generateUUID();
      const newPost: GeneratedPost = {
        id: historyId,
        topic,
        status: "completed",
        outlines,
        completedContents: updatedContents,
        createdAt: currentHistoryId
          ? (initialPost?.createdAt || Date.now())
          : Date.now(),
        updatedAt: Date.now(),
      };

      setCurrentHistoryId(historyId);
      await saveHistory(newPost);
    } catch (e) {
      if (isAbortError(e)) {
        setStep(1);
        return;
      }

      console.error(e);
      alert("生成最终图文失败，请检查后端服务。");
      setStep(1);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  // 编辑大纲
  const handleEditOutline = async (updatedOutline: Outline) => {
    // 更新大纲列表中的对应项
    const updatedOutlines = outlines.map((outline) =>
      outline.id === updatedOutline.id ? updatedOutline : outline
    );
    setOutlines(updatedOutlines);

    // 更新历史记录
    const historyId = currentHistoryId || generateUUID();
    setCurrentHistoryId(historyId);

    const historyPost: GeneratedPost = {
      id: historyId,
      topic,
      status: completedContents.length > 0 ? "completed" : "outline",
      outlines: updatedOutlines,
      completedContents: completedContents.length > 0 ? completedContents : undefined,
      createdAt: currentHistoryId
        ? (initialPost?.createdAt || Date.now())
        : Date.now(),
      updatedAt: Date.now(),
    };

    await saveHistory(historyPost);

    // 直接使用编辑后的大纲生成内容
    await handleSelectOutline(updatedOutline);
  };

  // 重置所有状态
  const reset = () => {
    cancelGeneration();
    setStep(0);
    setTopic("");
    setOutlines([]);
    setCompletedContents([]);
    setCurrentHistoryId(null);
    setProgressText("");
  };

  // 复制文案
  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption)
      .then(() => {
        alert("文案已复制到剪贴板！");
      })
      .catch((e) => {
        console.error("复制失败:", e);
        alert("复制失败，请手动复制");
      });
  };

  // 下载图片
  const handleDownloadImage = async (imageUrl: string) => {
    try {
      if (imageUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `rednote-${Date.now()}.png`;
        link.click();
        return;
      }

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rednote-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("下载失败:", e);
      window.open(imageUrl, "_blank");
    }
  };

  return {
    // 状态
    step,
    topic,
    isGenerating,
    outlines,
    completedContents,
    progressText,
    currentHistoryId,

    // 操作
    setStep,
    setTopic,
    handleGenerateOutlines,
    handleRegenerateOutlines,
    handleSelectOutline,
    handleEditOutline,
    cancelGeneration,
    reset,
    handleCopyCaption,
    handleDownloadImage,
  };
};
