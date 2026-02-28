import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, Download, FileText, Link2 } from 'lucide-react';

import { getHistoryById } from '../services/db';
import { CompletedContent, GeneratedPost } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { copyToClipboard, downloadImage } from '../utils/media';

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
        const found = postId ? await getHistoryById(postId) : null;
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

  const completedContents = post.completedContents || [];
  const hasCompletedContents = completedContents.length > 0;

  const latestCompleted = hasCompletedContents
    ? completedContents[completedContents.length - 1]
    : undefined;

  const previewImageUrl = latestCompleted?.imageUrl || post.imageUrl;
  const previewText =
    latestCompleted?.caption || post.fullCaption || post.outlines[0]?.content || '';

  const handleCopyShareLink = async () => {
    const ok = await copyToClipboard(window.location.href);
    alert(ok ? '链接已复制' : '复制失败');
  };

  const handleCopyCaption = async (caption: string) => {
    const ok = await copyToClipboard(caption);
    alert(ok ? '文案已复制到剪贴板！' : '复制失败，请手动复制');
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      await downloadImage(imageUrl);
    } catch (error) {
      console.error(error);
      alert('下载失败');
    }
  };

  const handleContinue = () => {
    onRestorePost(post);
  };

  const renderContentCard = (content: CompletedContent, index: number) => {
    return (
      <Card key={content.id} className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 shrink-0">
            <div className="w-full aspect-[9/16] bg-gray-100 rounded-2xl overflow-hidden border border-xhs-border">
              <img
                src={content.imageUrl}
                alt={content.outline.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-xhs-text">
                成品 {index + 1}
              </h3>
              <Badge variant="neutral" className="font-mono">
                {content.outline.emoji} {content.outline.title}
              </Badge>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(content.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="mt-4">
              <label className="text-sm font-bold text-xhs-text mb-2 block">
                文案
              </label>
              <textarea
                readOnly
                value={content.caption}
                className="w-full min-h-[220px] p-4 text-sm bg-gray-50 rounded-2xl border border-xhs-border resize-none text-xhs-text font-mono leading-relaxed"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => handleCopyCaption(content.caption)}
              >
                <Copy size={16} className="mr-2" aria-hidden="true" /> 复制文案
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDownloadImage(content.imageUrl)}
              >
                <Download size={16} className="mr-2" aria-hidden="true" /> 下载图片
              </Button>
              <Button variant="primary" onClick={handleContinue} className="shadow-soft">
                继续创作
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

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
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt={post.topic}
                    loading="lazy"
                    decoding="async"
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

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" onClick={handleContinue} className="shadow-soft">
                  继续创作
                </Button>
                <Button variant="secondary" onClick={handleCopyShareLink}>
                  <Link2 size={16} className="mr-2" aria-hidden="true" /> 复制分享链接
                </Button>
                <Button variant="secondary" onClick={() => window.location.hash = '#/history'}>
                  返回列表
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {hasCompletedContents ? (
          <div className="grid gap-6">
            <h2 className="text-lg font-bold text-xhs-text">成品画廊</h2>
            {completedContents.map((content, index) => renderContentCard(content, index))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default HistoryDetail;
