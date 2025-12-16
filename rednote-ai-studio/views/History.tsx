import React, { useEffect, useState } from 'react';
import { getHistory, deleteHistory } from '../services/db';
import { GeneratedPost } from '../types';
import { Calendar, Trash2, FileText, CheckCircle2 } from 'lucide-react';

interface HistoryProps {
  onRestorePost: (post: GeneratedPost) => void;
}

const History: React.FC<HistoryProps> = ({ onRestorePost }) => {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 防止触发卡片点击
    if (confirm('确定要删除这条历史记录吗？')) {
      try {
        await deleteHistory(id);
        setPosts(posts.filter(p => p.id !== id));
      } catch (e) {
        console.error(e);
        alert('删除失败');
      }
    }
  };

  const handleRestore = (post: GeneratedPost) => {
    onRestorePost(post);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">正在加载历史记录...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">创作历史</h1>
        <div className="text-sm text-gray-500">已保存 {posts.length} 条记录</div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">暂无历史记录</h3>
          <p className="text-gray-500">快去创作你的第一篇笔记吧。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => handleRestore(post)}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col group hover:border-xhs-red"
            >
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.topic} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText size={48} />
                    </div>
                )}
                <div className="absolute top-3 right-3">
                  {post.status === 'completed' ? (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} /> 已完成
                    </span>
                  ) : (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <FileText size={12} /> 大纲
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-red-50 text-xhs-red px-2 py-1 rounded">
                      {post.selectedOutline?.emoji || post.outlines[0]?.emoji} {post.selectedOutline?.tags[0] || post.outlines[0]?.tags[0]}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">
                  {post.selectedOutline?.title || post.outlines[0]?.title || post.topic}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-grow">
                  {post.fullCaption || post.outlines[0]?.content || '点击继续编辑'}
                </p>
                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {post.status === 'completed' ? '点击查看详情' : '点击继续创作'}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, post.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;