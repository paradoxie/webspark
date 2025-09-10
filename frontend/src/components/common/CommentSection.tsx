'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    username: string;
    name: string | null;
    avatar: string | null;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  websiteId: number;
}

export default function CommentSection({ websiteId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [websiteId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/website/${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('评论加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error('请先登录后再评论');
      return;
    }

    if (!newComment.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          websiteId
        }),
      });

      if (response.ok) {
        toast.success('评论发表成功！');
        setNewComment('');
        fetchComments(); // 重新加载评论
      } else {
        throw new Error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('评论发表失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!session) {
      toast.error('请先登录后再回复');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('请输入回复内容');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          websiteId,
          parentId
        }),
      });

      if (response.ok) {
        toast.success('回复发表成功！');
        setReplyContent('');
        setReplyingTo(null);
        fetchComments(); // 重新加载评论
      } else {
        throw new Error('Failed to submit reply');
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
      toast.error('回复发表失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">评论</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
        💬 评论 
        <span className="ml-2 text-sm font-normal text-slate-500">({comments.length})</span>
      </h3>

      {/* 评论表单 */}
      {session ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex space-x-3">
            <img
              src={session.user?.image || '/default-avatar.png'}
              alt={session.user?.name || '用户'}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '发表中...' : '发表评论'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-slate-50 rounded-lg text-center">
          <p className="text-slate-600">
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">
              登录
            </Link>
            {' '}后参与评论讨论
          </p>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">💭</div>
            <h4 className="text-lg font-medium text-slate-900 mb-2">还没有评论</h4>
            <p className="text-slate-600">成为第一个评论的人吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* 主评论 */}
              <div className="flex space-x-3">
                <img
                  src={comment.author.avatar || '/default-avatar.png'}
                  alt={comment.author.name || comment.author.username}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
                <div className="flex-1">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-slate-900">
                        {comment.author.name || comment.author.username}
                      </h4>
                      <span className="text-sm text-slate-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center mt-2 space-x-4">
                    {session && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-sm text-slate-500 hover:text-blue-600 font-medium"
                      >
                        回复
                      </button>
                    )}
                  </div>

                  {/* 回复表单 */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 ml-4">
                      <div className="flex space-x-3">
                        <img
                          src={session?.user?.image || '/default-avatar.png'}
                          alt={session?.user?.name || '用户'}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        />
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`回复 @${comment.author.name || comment.author.username}...`}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex justify-end mt-2 space-x-2">
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                              className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={submitting || !replyContent.trim()}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {submitting ? '回复中...' : '回复'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 回复列表 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-4 space-y-3 border-l-2 border-slate-200 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-3">
                          <img
                            src={reply.author.avatar || '/default-avatar.png'}
                            alt={reply.author.name || reply.author.username}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          />
                          <div className="flex-1">
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="text-sm font-medium text-slate-900">
                                  {reply.author.name || reply.author.username}
                                </h5>
                                <span className="text-xs text-slate-500">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}