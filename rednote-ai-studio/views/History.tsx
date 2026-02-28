import React, { useEffect, useState } from 'react';
import { getHistory, deleteHistory } from '../services/db';
import { GeneratedPost } from '../types';
import { Calendar, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { useNavigate } from 'react-router-dom';

interface HistoryProps {
  onRestorePost: (post: GeneratedPost) => void;
}

const History: React.FC<HistoryProps> = ({ onRestorePost }) => {
  const navigate = useNavigate();
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

  const handleNavigateToDetail = (post: GeneratedPost) => {
    navigate(`/history/${post.id}`);
  };

  const handleRestore = (e: React.MouseEvent, post: GeneratedPost) => {
    e.stopPropagation();
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
        <Card className="text-center py-20 border-dashed">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-xhs-text">暂无历史记录</h3>
          <p className="text-xhs-secondary">快去创作你的第一篇笔记吧。</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const title = post.selectedOutline?.title || post.outlines[0]?.title || post.topic;
            const latestCompleted = post.completedContents?.[post.completedContents.length - 1];
            const previewImageUrl = latestCompleted?.imageUrl || post.imageUrl;
            const preview =
              latestCompleted?.caption
              || post.fullCaption
              || post.outlines[0]?.content
              || '点击查看详情';

            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNavigateToDetail(post);
              }
            };

            return (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNavigateToDetail(post)}
                onKeyDown={handleKeyDown}
                className="bg-xhs-surface rounded-2xl overflow-hidden shadow-soft border border-xhs-border hover:shadow-soft-md transition-all cursor-pointer flex flex-col group hover:border-xhs-red/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg"
                aria-label={`打开历史记录：${title}`}
              >
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={post.topic}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText size={48} aria-hidden="true" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    {post.status === 'completed' ? (
                      <Badge
                        variant="success"
                        className="bg-green-600 text-white border-transparent shadow-soft"
                      >
                        <CheckCircle2 size={12} aria-hidden="true" /> 已完成
                      </Badge>
                    ) : (
                      <Badge
                        variant="info"
                        className="bg-blue-600 text-white border-transparent shadow-soft"
                      >
                        <FileText size={12} aria-hidden="true" /> 大纲
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-50 text-xhs-red border-transparent rounded-lg">
                      {post.selectedOutline?.emoji || post.outlines[0]?.emoji}{' '}
                      {post.selectedOutline?.tags[0] || post.outlines[0]?.tags[0]}
                    </Badge>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-xhs-text mb-2 line-clamp-1">{title}</h3>
                  <p className="text-sm text-xhs-secondary line-clamp-3 mb-4 flex-grow">
                    {preview}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-400">点击查看详情</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleRestore(e, post)}
                        className="text-xhs-red bg-red-50 enabled:hover:bg-red-100 focus-visible:ring-offset-xhs-bg"
                      >
                        继续创作
                      </Button>
                      <IconButton
                        ariaLabel="删除历史记录"
                        variant="danger"
                        onClick={(e) => handleDelete(e, post.id)}
                        className="rounded-lg focus-visible:ring-offset-xhs-bg"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </IconButton>
                    </div>
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
