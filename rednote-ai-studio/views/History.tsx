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
    e.stopPropagation();
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
        <h1 className="text-3xl font-bold text-xhs-text">创作历史</h1>
        <div className="text-sm text-xhs-secondary">已保存 {posts.length} 条记录</div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-xhs-surface rounded-2xl border border-dashed border-xhs-border">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-xhs-text">暂无历史记录</h3>
          <p className="text-xhs-secondary">快去创作你的第一篇笔记吧。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const title = post.selectedOutline?.title || post.outlines[0]?.title || post.topic;
            const preview = post.fullCaption || post.outlines[0]?.content || '点击继续编辑';

            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRestore(post);
              }
            };

            return (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => handleRestore(post)}
                onKeyDown={handleKeyDown}
                className="bg-xhs-surface rounded-2xl overflow-hidden shadow-soft border border-xhs-border hover:shadow-soft-md transition-all cursor-pointer flex flex-col group hover:border-xhs-red/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg"
                aria-label={`打开历史记录：${title}`}
              >
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.topic}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText size={48} aria-hidden="true" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    {post.status === 'completed' ? (
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-soft">
                        <CheckCircle2 size={12} aria-hidden="true" /> 已完成
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-soft">
                        <FileText size={12} aria-hidden="true" /> 大纲
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-red-50 text-xhs-red px-2 py-1 rounded">
                      {post.selectedOutline?.emoji || post.outlines[0]?.emoji}{' '}
                      {post.selectedOutline?.tags[0] || post.outlines[0]?.tags[0]}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-xhs-text mb-2 line-clamp-1">{title}</h3>
                  <p className="text-sm text-xhs-secondary line-clamp-3 mb-4 flex-grow">
                    {preview}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {post.status === 'completed' ? '点击查看详情' : '点击继续创作'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, post.id)}
                      className="text-gray-400 hover:text-xhs-red transition-colors rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg"
                      aria-label="删除历史记录"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
