'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { Send, Edit2, Trash2, Save, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import debounce from 'lodash/debounce'

interface Comment {
  id: number
  content: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: number
    name: string
    avatar: string
    username: string
  }
  likeCount: number
  likedByUser?: boolean
  replies?: Comment[]
}

interface CommentEnhancedProps {
  websiteId: number
  comments: Comment[]
  onCommentAdded?: (comment: Comment) => void
  onCommentUpdated?: (comment: Comment) => void
  onCommentDeleted?: (commentId: number) => void
}

export default function CommentEnhanced({
  websiteId,
  comments: initialComments,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}: CommentEnhancedProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const commentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastCommentIdRef = useRef<number | null>(null)

  // 从localStorage加载草稿
  useEffect(() => {
    const draftKey = `comment-draft-${websiteId}`
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft) {
      setContent(savedDraft)
    }
  }, [websiteId])

  // 自动保存草稿
  const saveDraft = useCallback(
    debounce((text: string) => {
      const draftKey = `comment-draft-${websiteId}`
      if (text.trim()) {
        localStorage.setItem(draftKey, text)
      } else {
        localStorage.removeItem(draftKey)
      }
    }, 500),
    [websiteId]
  )

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    saveDraft(newContent)
  }

  // 自动调整文本框高度
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  // 滚动到指定评论
  const scrollToComment = (commentId: number, highlight = true) => {
    const element = commentRefs.current[commentId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      if (highlight) {
        // 添加高亮效果
        element.classList.add('comment-highlight')
        setTimeout(() => {
          element.classList.remove('comment-highlight')
        }, 3000)
      }
    }
  }

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('请先登录')
      return
    }

    if (!content.trim()) {
      toast.error('评论内容不能为空')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/websites/${websiteId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ content: content.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      const { data } = await response.json()
      
      // 添加新评论到列表
      const newComment = {
        ...data,
        author: {
          id: session.user.id,
          name: session.user.name,
          avatar: session.user.image,
          username: session.user.username
        }
      }
      
      setComments([newComment, ...comments])
      setContent('')
      
      // 清除草稿
      localStorage.removeItem(`comment-draft-${websiteId}`)
      
      // 记录新评论ID
      lastCommentIdRef.current = newComment.id
      
      toast.success('评论发布成功')
      
      if (onCommentAdded) {
        onCommentAdded(newComment)
      }

      // 延迟滚动到新评论
      setTimeout(() => {
        scrollToComment(newComment.id, true)
      }, 100)
    } catch (error) {
      toast.error('评论发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 编辑评论
  const handleEdit = async (commentId: number) => {
    if (!editContent.trim()) {
      toast.error('评论内容不能为空')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const { data } = await response.json()
      
      // 更新评论列表
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, content: data.content, updatedAt: data.updatedAt } : c
      ))
      
      setEditingId(null)
      setEditContent('')
      
      toast.success('评论已更新')
      
      if (onCommentUpdated) {
        onCommentUpdated(data)
      }

      // 滚动到编辑的评论
      scrollToComment(commentId, true)
    } catch (error) {
      toast.error('更新失败')
    }
  }

  // 删除评论
  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      // 从列表中移除
      setComments(comments.filter(c => c.id !== commentId))
      
      toast.success('评论已删除')
      
      if (onCommentDeleted) {
        onCommentDeleted(commentId)
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 点赞评论
  const handleLike = async (commentId: number) => {
    if (!session) {
      toast.error('请先登录')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to like comment')
      }

      const { data } = await response.json()
      
      // 更新点赞状态
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, likedByUser: data.liked, likeCount: data.likeCount }
          : c
      ))
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 提交评论
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        if (textareaRef.current === document.activeElement) {
          e.preventDefault()
          handleSubmit(e as any)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [content, session])

  return (
    <div className="space-y-6">
      {/* 评论输入框 */}
      {session ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <img
              src={session.user.image || '/default-avatar.png'}
              alt={session.user.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onInput={(e) => adjustTextareaHeight(e.currentTarget)}
                placeholder="写下你的评论..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
                         dark:bg-slate-700 dark:text-white min-h-[100px]"
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-slate-500">
                  {content.length > 0 && `${content.length} 字`}
                  {content.length > 0 && ' • '}
                  Ctrl + Enter 发送
                </span>
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                           hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-slate-600 dark:text-slate-300">
            请先<a href="/auth/signin" className="text-blue-500 hover:underline">登录</a>后再发表评论
          </p>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            暂无评论，来做第一个评论的人吧！
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              ref={(el) => { commentRefs.current[comment.id] = el }}
              className="comment-item p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm
                       transition-all duration-300"
            >
              <div className="flex gap-3">
                <img
                  src={comment.author.avatar || '/default-avatar.png'}
                  alt={comment.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <a 
                        href={`/users/${comment.author.username}`}
                        className="font-semibold hover:underline"
                      >
                        {comment.author.name}
                      </a>
                      <p className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: zhCN
                        })}
                        {comment.updatedAt !== comment.createdAt && ' (已编辑)'}
                      </p>
                    </div>
                    
                    {session?.user.id === comment.author.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(comment.id)
                            setEditContent(comment.content)
                          }}
                          className="text-slate-500 hover:text-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-slate-500 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onInput={(e) => adjustTextareaHeight(e.currentTarget)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 
                                 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none
                                 dark:bg-slate-700"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(comment.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white
                                   rounded text-sm hover:bg-blue-600"
                        >
                          <Save className="w-3 h-3" />
                          保存
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditContent('')
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-700
                                   rounded text-sm hover:bg-slate-300 dark:bg-slate-600 
                                   dark:text-slate-200"
                        >
                          <X className="w-3 h-3" />
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1 text-sm transition-colors
                                    ${comment.likedByUser 
                                      ? 'text-red-500' 
                                      : 'text-slate-500 hover:text-red-500'}`}
                        >
                          <span className={comment.likedByUser ? 'animate-bounce-once' : ''}>
                            ❤️
                          </span>
                          {comment.likeCount > 0 && comment.likeCount}
                        </button>
                        
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-sm text-slate-500 hover:text-blue-500"
                        >
                          回复
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .comment-highlight {
          animation: highlight 3s ease-out;
        }
        
        @keyframes highlight {
          0% {
            background-color: rgb(59 130 246 / 0.2);
            transform: scale(1.02);
          }
          100% {
            background-color: transparent;
            transform: scale(1);
          }
        }
        
        .animate-bounce-once {
          animation: bounce 0.5s ease-out;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-25%);
          }
        }
      `}</style>
    </div>
  )
}

