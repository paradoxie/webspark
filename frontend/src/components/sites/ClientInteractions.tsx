'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ClientInteractionsProps {
  websiteId: number
  initialLikeCount: number
  initialIsLiked: boolean
  initialIsBookmarked: boolean
  viewCount: number
  sourceUrl?: string
}

export default function ClientInteractions({
  websiteId,
  initialLikeCount,
  initialIsLiked,
  initialIsBookmarked,
  viewCount,
  sourceUrl
}: ClientInteractionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [likePending, setLikePending] = useState(false)
  const [bookmarkPending, setBookmarkPending] = useState(false)

  const handleLike = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=' + window.location.pathname)
      return
    }

    if (likePending) return
    setLikePending(true)

    try {
      const response = await fetch(`/api/websites/${websiteId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        const newIsLiked = result.data.action === 'like'
        setIsLiked(newIsLiked)
        setLikeCount(result.data.likeCount || (newIsLiked ? likeCount + 1 : likeCount - 1))
        toast.success(newIsLiked ? '点赞成功！' : '已取消点赞')
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLikePending(false)
    }
  }

  const handleBookmark = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=' + window.location.pathname)
      return
    }

    if (bookmarkPending) return
    setBookmarkPending(true)

    try {
      const response = await fetch(`/api/websites/${websiteId}/bookmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        const newIsBookmarked = result.data.action === 'bookmark'
        setIsBookmarked(newIsBookmarked)
        toast.success(newIsBookmarked ? '收藏成功！' : '已取消收藏')
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setBookmarkPending(false)
    }
  }

  return (
    <div className="p-6 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={likePending}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              isLiked
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill={isLiked ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
            <span>{likeCount}</span>
          </button>
          
          <button
            onClick={handleBookmark}
            disabled={bookmarkPending}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              isBookmarked
                ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill={isBookmarked ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
              />
            </svg>
            <span>收藏</span>
          </button>

          <div className="flex items-center space-x-1 text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{viewCount}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {sourceUrl && (
            <Link
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}