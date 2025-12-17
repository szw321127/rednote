import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Image as ImageIcon, CheckCircle, Loader2, ChevronRight, ArrowLeft, LayoutList, PenTool } from 'lucide-react';
import { ApiService } from '../services/geminiService'; // Importing generic service
import { AppSettings, Outline, GeneratedPost } from '../types';
import { saveHistory } from '../services/db';

interface GeneratorProps {
  settings: AppSettings;
  initialPost?: GeneratedPost | null; // 从历史记录恢复的数据
  onPostRestored?: () => void; // 恢复后的回调
}

// 生成 UUID 的兼容函数
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 生成符合 UUID v4 格式的字符串
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Generator: React.FC<GeneratorProps> = ({ settings, initialPost, onPostRestored }) => {
  const [step, setStep] = useState<number>(0); // 0: Input, 1: Outlines, 2: Final
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [finalPost, setFinalPost] = useState<GeneratedPost | null>(null);
  const [progressText, setProgressText] = useState('');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null); // 当前历史记录ID

  const service = new ApiService(settings);

  // 从历史记录恢复状态
  useEffect(() => {
    if (initialPost) {
      setTopic(initialPost.topic);
      setOutlines(initialPost.outlines);
      setCurrentHistoryId(initialPost.id);

      if (initialPost.status === 'outline') {
        setStep(1);
      } else if (initialPost.status === 'completed') {
        setSelectedOutline(initialPost.selectedOutline || null);
        setFinalPost(initialPost);
        setStep(2);
      }

      onPostRestored?.();
    }
  }, [initialPost]);

  // Helper to get display name
  const getTextModelName = () => settings.models.find(m => m.id === settings.activeTextModelId)?.displayName || '未知模型';
  const getImageModelName = () => settings.models.find(m => m.id === settings.activeImageModelId)?.displayName || '未知模型';

  const handleGenerateOutlines = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setStep(1);
    setProgressText('正在请求后端生成大纲...');
    setOutlines([]);

    try {
      const results = await service.generateOutlinesStream(topic, (chunk) => {
        if (chunk.length < 50) setProgressText('正在接收流式数据...');
      });
      setOutlines(results);

      // 在大纲生成后保存历史记录
      const historyId = currentHistoryId || generateUUID();
      setCurrentHistoryId(historyId);

      const historyPost: GeneratedPost = {
        id: historyId,
        topic,
        status: 'outline',
        outlines: results,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveHistory(historyPost);
    } catch (e) {
      alert("生成大纲失败，请检查后端连接或重试。");
      setStep(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOutline = async (outline: Outline) => {
    setSelectedOutline(outline);
    setIsGenerating(true);
    setStep(2);
    setProgressText('正在后端生成图片与文案...');

    try {
      const { imageUrl, caption } = await service.generateImageAndCaption(outline);

      const historyId = currentHistoryId || generateUUID();
      const newPost: GeneratedPost = {
        id: historyId,
        topic,
        status: 'completed',
        outlines,
        selectedOutline: outline,
        imageUrl,
        fullCaption: caption,
        createdAt: currentHistoryId ? finalPost?.createdAt || Date.now() : Date.now(),
        updatedAt: Date.now()
      };

      setFinalPost(newPost);
      setCurrentHistoryId(historyId);
      await saveHistory(newPost);
    } catch (e) {
      console.error(e);
      alert("生成最终图文失败，请检查后端服务。");
      setStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setStep(0);
    setTopic('');
    setOutlines([]);
    setSelectedOutline(null);
    setFinalPost(null);
    setCurrentHistoryId(null);
  };

  const handleCopyCaption = async () => {
    if (!finalPost?.fullCaption) return;

    try {
      await navigator.clipboard.writeText(finalPost.fullCaption);
      alert('文案已复制到剪贴板！');
    } catch (e) {
      console.error('复制失败:', e);
      alert('复制失败，请手动复制');
    }
  };

  const handleDownloadImage = async () => {
    if (!finalPost?.imageUrl) return;

    try {
      // 如果是data URL（base64），直接下载
      if (finalPost.imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = finalPost.imageUrl;
        link.download = `rednote-${Date.now()}.png`;
        link.click();
        return;
      }

      // 如果是普通URL，需要先fetch再下载
      const response = await fetch(finalPost.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rednote-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('下载失败:', e);
      // 如果fetch失败，尝试在新窗口打开
      window.open(finalPost.imageUrl, '_blank');
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (isGenerating) return;
    
    // Logic to allow jumping back/forward only if data exists
    if (targetStep === 0) {
        setStep(0);
    } else if (targetStep === 1 && outlines.length > 0) {
        setStep(1);
    } else if (targetStep === 2 && finalPost) {
        setStep(2);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">以此为题创作</h1>
        <p className="text-gray-500 mt-2">一键生成爆款小红书图文。</p>
      </div>

      {/* Interactive Progress Stepper */}
      <div className="flex items-center mb-10 select-none">
        <div 
            onClick={() => handleStepClick(0)}
            className={`flex items-center cursor-pointer transition-colors ${step === 0 ? 'text-xhs-red font-bold' : 'text-gray-500 hover:text-gray-800'}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm border ${step === 0 ? 'bg-xhs-red text-white border-xhs-red' : 'bg-white border-gray-300'}`}>
                <PenTool size={14} />
            </div>
            选题
        </div>
        
        <div className={`flex-1 h-px mx-4 ${step > 0 ? 'bg-xhs-red' : 'bg-gray-200'}`}></div>
        
        <div 
            onClick={() => handleStepClick(1)}
            className={`flex items-center transition-colors ${step === 1 ? 'text-xhs-red font-bold' : outlines.length > 0 ? 'text-gray-500 cursor-pointer hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm border ${step === 1 ? 'bg-xhs-red text-white border-xhs-red' : outlines.length > 0 ? 'bg-white border-gray-300 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-300'}`}>
                <LayoutList size={14} />
            </div>
            大纲
        </div>

        <div className={`flex-1 h-px mx-4 ${step > 1 ? 'bg-xhs-red' : 'bg-gray-200'}`}></div>

        <div 
            onClick={() => handleStepClick(2)}
            className={`flex items-center transition-colors ${step === 2 ? 'text-xhs-red font-bold' : finalPost ? 'text-gray-500 cursor-pointer hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm border ${step === 2 ? 'bg-xhs-red text-white border-xhs-red' : finalPost ? 'bg-white border-gray-300 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-300'}`}>
                <CheckCircle size={14} />
            </div>
            成品
        </div>
      </div>

      {/* Step 0: Input */}
      {step === 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            请输入笔记主题
          </label>
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：油皮夏季护肤指南"
              className="w-full p-4 pr-12 text-lg border-2 border-gray-100 rounded-xl focus:border-xhs-red focus:ring-0 outline-none transition-all placeholder-gray-300"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateOutlines()}
            />
            <button
              onClick={handleGenerateOutlines}
              disabled={!topic.trim() || isGenerating}
              className="absolute right-2 top-2 bottom-2 bg-xhs-red hover:bg-red-600 text-white rounded-lg px-6 font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </button>
          </div>
          
          <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {["春日穿搭", "上海探店", "减脂餐", "猫咪搞笑瞬间"].map(t => (
              <button key={t} onClick={() => setTopic(t)} className="whitespace-nowrap px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors">
                {t}
              </button>
            ))}
          </div>

          {outlines.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                  <button onClick={() => setStep(1)} className="text-gray-500 hover:text-xhs-red text-sm flex items-center">
                      <span className="mr-2">恢复上次生成的大纲</span>
                      <ArrowRight size={14} />
                  </button>
              </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 border-4 border-red-100 border-t-xhs-red rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800">{progressText}</h3>
            <p className="text-gray-500 mt-2 text-sm">
                正在请求后端 <b>{settings.backendUrl}</b>
            </p>
        </div>
      )}

      {/* Step 1: Outline Selection */}
      {!isGenerating && step === 1 && outlines.length > 0 && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-gray-900">选择一个大纲</h2>
                <p className="text-sm text-gray-500 mt-1">共生成 {outlines.length} 个创意方向</p>
             </div>
             <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-xhs-red flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                <ArrowLeft size={14} className="mr-1"/> 修改选题
             </button>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
             {outlines.map((outline) => (
               <div 
                key={outline.id} 
                onClick={() => handleSelectOutline(outline)}
                className="group cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-xhs-red hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full"
               >
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-xhs-red opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">{outline.emoji}</div>
                 <h3 className="font-bold text-lg mb-2 text-gray-800 leading-tight">{outline.title}</h3>
                 <p className="text-sm text-gray-500 mb-4 line-clamp-4 flex-grow">{outline.content}</p>
                 <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                    {outline.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-red-50 text-xhs-red px-2 py-1 rounded-md">#{tag}</span>
                    ))}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Step 2: Final Result */}
      {!isGenerating && step === 2 && finalPost && (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
             <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle size={18} />
                <span className="font-medium text-sm">生成完成</span>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center shadow-sm">
                    <ArrowLeft size={16} className="mr-2"/> 重选大纲
                </button>
                <button onClick={reset} className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-lg shadow-gray-200">
                    开始新创作
                </button>
             </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                {/* Mobile Preview Look */}
                <div className="border border-gray-200 rounded-[2rem] overflow-hidden bg-gray-50 max-w-xs mx-auto md:mx-0 shadow-lg relative aspect-[9/16]">
                    {/* Header */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between text-white drop-shadow-md">
                        <span className="text-xs font-medium">小红书</span>
                    </div>

                    {/* Image */}
                    <div className="h-2/3 w-full bg-gray-200 relative group">
                        {finalPost.imageUrl ? (
                             <img src={finalPost.imageUrl} alt="Generated" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ImageIcon size={48} />
                            </div>
                        )}
                         <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            AI 生成
                        </div>
                    </div>
                    
                    {/* Content Preview */}
                    <div className="p-4 bg-white h-1/3 overflow-y-auto absolute bottom-0 w-full rounded-t-2xl">
                        <h3 className="font-bold text-gray-900 mb-2 leading-snug">{finalPost.selectedOutline?.title || ''}</h3>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">AI</div>
                            <span className="text-xs text-gray-500">RedNote 助手</span>
                            <span className="text-xs text-gray-300 ml-auto">刚刚</span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-line text-ellipsis leading-relaxed">
                            {finalPost.fullCaption}
                        </p>
                    </div>
                </div>

                {/* Editor / Actions */}
                <div className="flex flex-col h-full">
                    <div className="flex-1 mb-6">
                        <label className="text-sm font-bold text-gray-700 mb-2 block">生成的文案</label>
                        <textarea 
                            readOnly 
                            value={finalPost.fullCaption} 
                            className="w-full h-full min-h-[300px] p-4 text-sm bg-gray-50 rounded-xl border-none resize-none focus:ring-0 text-gray-600 font-mono leading-relaxed"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleCopyCaption} className="flex-1 py-3 bg-red-50 text-xhs-red font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center">
                            复制文案
                        </button>
                        <button onClick={handleDownloadImage} className="flex-1 py-3 bg-red-50 text-xhs-red font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center">
                            下载图片
                        </button>
                    </div>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Generator;
