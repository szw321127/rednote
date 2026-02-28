import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';

import { getHistory } from '../services/db';
import { GeneratedPost } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface HistoryDetailProps {
  onRestorePost: (post: GeneratedPost) => void;
}

const HistoryDetail: React.FC<HistoryDetailProps> = ({ onRestorePost }) => {
  const { postId } = useParams<{ postId: string }>();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<GeneratedPost | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const items = await getHistory();
        const found = items.find((item) => item.id === postId) ?? null;
        if (!cancelled) {
          setPost(found);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setPost(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const title = useMemo(() => {
    if (!post) return '';
    return post.selectedOutline?.title || post.outlines[0]?.title || post.topic;
  }, [post]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">正在加载详情...</div>;
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/history"
            className="inline-flex items-center text-sm text-xhs-secondary hover:text-xhs-text"
          >
            <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> 返回历史
          </Link>
        </div>

        <Card className="text-center py-20 border-dashed">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-xhs-text">记录不存在或已被删除</h3>
          <p className="text-xhs-secondary">请返回历史列表重新选择。</p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => window.location.hash = '#/history'}>
              返回历史列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusBadge =
    post.status === 'completed' ? (
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
    );

  const previewText = post.fullCaption || post.outlines[0]?.content || '';

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center text-sm text-xhs-secondary hover:text-xhs-text"
        >
          <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> 返回历史
        </Link>

        <div className="flex items-center gap-3">
          {statusBadge}
          <span className="text-xs text-gray-400">
            {new Date(post.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-full md:w-64 shrink-0">
              <div className="w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-xhs-border">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.topic}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <FileText size={48} aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-xhs-text truncate">{title}</h1>
                <Badge className="bg-red-50 text-xhs-red border-transparent rounded-lg">
                  {post.selectedOutline?.emoji || post.outlines[0]?.emoji}{' '}
                  {post.selectedOutline?.tags[0] || post.outlines[0]?.tags[0]}
                </Badge>
              </div>

              <p className="text-sm text-xhs-secondary mt-2">
                主题：<span className="text-xhs-text">{post.topic}</span>
              </p>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => onRestorePost(post)}
                  className="shadow-soft"
                >
                  继续创作
                </Button>
                <Button variant="secondary" onClick={() => window.location.hash = '#/history'}>
                  返回列表
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-xhs-text mb-4">内容预览</h2>
          {previewText ? (
            <pre className="whitespace-pre-wrap text-sm text-xhs-text bg-gray-50 border border-xhs-border rounded-2xl p-4">
              {previewText}
            </pre>
          ) : (
            <p className="text-sm text-gray-400">暂无可预览内容</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HistoryDetail;
