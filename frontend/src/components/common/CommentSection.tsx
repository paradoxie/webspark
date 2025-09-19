'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Comment {
  id: number;
  content: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  parentId?: number | null;
  author: {
    id: number;
    username: string;
    name: string | null;
    avatar: string | null;
  };
  replies?: Comment[];
  isLiked?: boolean;
  _count?: {
    replies: number;
  };
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
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAllReplies, setShowAllReplies] = useState<Record<number, boolean>>({});

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

  const handleEditComment = async (commentId: number) => {
    if (!session) {
      toast.error('请先登录后再编辑');
      return;
    }

    if (!editContent.trim()) {
      toast.error('请输入编辑内容');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim()
        }),
      });

      if (response.ok) {
        toast.success('评论编辑成功！');
        setEditContent('');
        setEditingComment(null);
        fetchComments();
      } else {
        throw new Error('Failed to edit comment');
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
      toast.error('评论编辑失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!session) {
      toast.error('请先登录后再点赞');
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.action === 'like' ? '点赞成功！' : '取消点赞');
        fetchComments(); // 重新加载评论以更新点赞状态
      } else {
        throw new Error('Failed to like comment');
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
      toast.error('操作失败，请重试');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('评论删除成功！');
        fetchComments();
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('评论删除失败，请重试');
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
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-4">
                      {session && (
                        <>
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                              comment.isLiked
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-slate-500 hover:text-red-600'
                            }`}
                          >
                            <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                            <span>{comment.likeCount || 0}</span>
                          </button>
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
                          >
                            💬 回复
                          </button>
                        </>
                      )}
                      {!session && comment.likeCount > 0 && (
                        <span className="flex items-center space-x-1 text-sm text-slate-500">
                          <span>🤍</span>
                          <span>{comment.likeCount}</span>
                        </span>
                      )}
                      {comment.replies && comment.replies.length > 0 && (
                        <button
                          onClick={() => setShowAllReplies(prev => ({
                            ...prev,
                            [comment.id]: !prev[comment.id]
                          }))}
                          className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
                        >
                          {showAllReplies[comment.id] ? '收起' : `查看全部 ${comment.replies.length} 条回复`}
                        </button>
                      )}
                    </div>
                    {session && session.user && comment.author.username === (session.user as any).login && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="text-sm text-slate-500 hover:text-amber-600 transition-colors"
                        >
                          ✏️ 编辑
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 回复表单 */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 ml-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                              rows={3}
                              className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                            <div className="flex justify-end mt-3 space-x-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={submitting || !replyContent.trim()}
                                className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                {submitting ? '回复中...' : '发布回复'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 编辑评论表单 */}
                  {editingComment === comment.id && (
                    <div className="mt-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <div className="flex justify-end mt-3 space-x-2">
                          <button
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={submitting || !editContent.trim()}
                            className="px-4 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 transition-colors"
                          >
                            {submitting ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 回复列表 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className={`mt-4 transition-all duration-300 ${
                      showAllReplies[comment.id] || comment.replies.length <= 2 ? 'block' : 'hidden'
                    }`}>
                      <div className="ml-4 space-y-3 border-l-2 border-gradient-to-b from-blue-200 to-slate-200 pl-4">
                        {(showAllReplies[comment.id] ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
                          <div key={reply.id} className="space-y-2">
                            <div className="flex space-x-3">
                              <img
                                src={reply.author.avatar || '/default-avatar.png'}
                                alt={reply.author.name || reply.author.username}
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                              />
                              <div className="flex-1">
                                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-sm font-medium text-slate-900">
                                        {reply.author.name || reply.author.username}
                                      </h5>
                                      <span className="text-xs text-slate-500">
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    </div>
                                    {session && session.user && reply.author.username === (session.user as any).login && (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => {
                                            setEditingComment(reply.id);
                                            setEditContent(reply.content);
                                          }}
                                          className="text-xs text-slate-400 hover:text-amber-600 transition-colors"
                                        >
                                          编辑
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                          删除
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {editingComment === reply.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1 text-sm border border-amber-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      />
                                      <div className="flex justify-end space-x-1">
                                        <button
                                          onClick={() => {
                                            setEditingComment(null);
                                            setEditContent('');
                                          }}
                                          className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800"
                                        >
                                          取消
                                        </button>
                                        <button
                                          onClick={() => handleEditComment(reply.id)}
                                          disabled={submitting || !editContent.trim()}
                                          className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                                        >
                                          {submitting ? '保存中...' : '保存'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
                                  )}
                                </div>

                                {/* 回复点赞按钮 */}
                                <div className="mt-1 ml-1">
                                  {session ? (
                                    <button
                                      onClick={() => handleLikeComment(reply.id)}
                                      className={`flex items-center space-x-1 text-xs font-medium transition-colors ${
                                        reply.isLiked
                                          ? 'text-red-600 hover:text-red-700'
                                          : 'text-slate-400 hover:text-red-600'
                                      }`}
                                    >
                                      <span>{reply.isLiked ? '❤️' : '🤍'}</span>
                                      <span>{reply.likeCount || 0}</span>
                                    </button>
                                  ) : reply.likeCount > 0 && (
                                    <span className="flex items-center space-x-1 text-xs text-slate-400">
                                      <span>🤍</span>
                                      <span>{reply.likeCount}</span>
                                    </span>
                                  )}
                                </div>

                                {/* 嵌套回复 */}
                                {reply.replies && reply.replies.length > 0 && (
                                  <div className="ml-4 mt-2 space-y-2 border-l border-slate-200 pl-3">
                                    {reply.replies.map((nestedReply) => (
                                      <div key={nestedReply.id} className="flex space-x-2">
                                        <img
                                          src={nestedReply.author.avatar || '/default-avatar.png'}
                                          alt={nestedReply.author.name || nestedReply.author.username}
                                          className="w-6 h-6 rounded-full border border-white shadow-sm"
                                        />
                                        <div className="flex-1">
                                          <div className="bg-slate-50 rounded-md p-2">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <h6 className="text-xs font-medium text-slate-900">
                                                {nestedReply.author.name || nestedReply.author.username}
                                              </h6>
                                              <span className="text-xs text-slate-400">
                                                {formatDate(nestedReply.createdAt)}
                                              </span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                              {nestedReply.content}
                                            </p>
                                          </div>
                                          {/* 嵌套回复点赞按钮 */}
                                          <div className="mt-1">
                                            {session ? (
                                              <button
                                                onClick={() => handleLikeComment(nestedReply.id)}
                                                className={`flex items-center space-x-1 text-xs font-medium transition-colors ${
                                                  nestedReply.isLiked
                                                    ? 'text-red-600 hover:text-red-700'
                                                    : 'text-slate-400 hover:text-red-600'
                                                }`}
                                              >
                                                <span>{nestedReply.isLiked ? '❤️' : '🤍'}</span>
                                                <span>{nestedReply.likeCount || 0}</span>
                                              </button>
                                            ) : nestedReply.likeCount > 0 && (
                                              <span className="flex items-center space-x-1 text-xs text-slate-400">
                                                <span>🤍</span>
                                                <span>{nestedReply.likeCount}</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {!showAllReplies[comment.id] && comment.replies.length > 2 && (
                          <button
                            onClick={() => setShowAllReplies(prev => ({ ...prev, [comment.id]: true }))}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-11 transition-colors"
                          >
                            查看剩余 {comment.replies.length - 2} 条回复...
                          </button>
                        )}
                      </div>
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