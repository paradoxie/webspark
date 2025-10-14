'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Heart, Bookmark, Share2, Check, Star, Trophy, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FeedbackProps {
  type: 'like' | 'bookmark' | 'share' | 'follow' | 'achievement'
  onAction?: () => Promise<void>
  isActive?: boolean
  count?: number
  message?: string
}

/**
 * 增强的交互反馈组件
 * 提供视觉和动画反馈，改善用户体验
 */
export function InteractiveFeedback({ 
  type, 
  onAction, 
  isActive = false, 
  count = 0,
  message
}: FeedbackProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [localCount, setLocalCount] = useState(count)
  const [localActive, setLocalActive] = useState(isActive)

  useEffect(() => {
    setLocalCount(count)
    setLocalActive(isActive)
  }, [count, isActive])

  const handleClick = async () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    
    // 乐观更新
    const newActive = !localActive
    setLocalActive(newActive)
    setLocalCount(prev => newActive ? prev + 1 : Math.max(0, prev - 1))
    
    // 触发动画效果
    if (newActive) {
      triggerSuccessAnimation(type)
    }
    
    try {
      if (onAction) {
        await onAction()
      }
      
      // 显示反馈消息
      if (message) {
        toast.success(message)
      } else {
        toast.success(getDefaultMessage(type, newActive))
      }
    } catch (error) {
      // 回滚乐观更新
      setLocalActive(!newActive)
      setLocalCount(count)
      toast.error('操作失败，请重试')
    } finally {
      setIsAnimating(false)
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'like':
        return <Heart className={`w-5 h-5 ${localActive ? 'fill-red-500 text-red-500' : ''}`} />
      case 'bookmark':
        return <Bookmark className={`w-5 h-5 ${localActive ? 'fill-blue-500 text-blue-500' : ''}`} />
      case 'share':
        return <Share2 className="w-5 h-5" />
      case 'follow':
        return localActive ? <Check className="w-5 h-5" /> : <span>关注</span>
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isAnimating}
      className={`
        relative inline-flex items-center gap-2 px-4 py-2 rounded-lg
        transition-all duration-200 transform
        ${localActive 
          ? 'bg-slate-100 dark:bg-slate-800 scale-105' 
          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
        }
        ${isAnimating ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
      `}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={localActive ? 'active' : 'inactive'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {getIcon()}
        </motion.div>
      </AnimatePresence>
      
      {localCount > 0 && (
        <motion.span
          key={localCount}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-sm font-medium"
        >
          {formatCount(localCount)}
        </motion.span>
      )}
      
      {/* 涟漪效果 */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: `radial-gradient(circle, ${
              type === 'like' ? 'rgba(239, 68, 68, 0.3)' :
              type === 'bookmark' ? 'rgba(59, 130, 246, 0.3)' :
              'rgba(156, 163, 175, 0.3)'
            } 0%, transparent 70%)`
          }}
        />
      )}
    </motion.button>
  )
}

/**
 * 成就解锁动画组件
 */
export function AchievementUnlock({ 
  title, 
  description, 
  icon = <Trophy className="w-12 h-12 text-yellow-500" /> 
}: {
  title: string
  description: string
  icon?: React.ReactNode
}) {
  useEffect(() => {
    // 触发烟花效果
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-20 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 max-w-sm"
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 0.5,
            repeat: 2,
            repeatType: 'reverse'
          }}
        >
          {icon}
        </motion.div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>
      </div>
      
      <motion.div
        className="absolute -top-2 -right-2"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
      </motion.div>
    </motion.div>
  )
}

/**
 * 加载状态骨架屏
 */
export function LoadingSkeleton({ 
  type = 'card' 
}: { 
  type?: 'card' | 'list' | 'detail' 
}) {
  const getSkeletonClass = () => {
    switch (type) {
      case 'card':
        return 'h-64 rounded-lg'
      case 'list':
        return 'h-20 rounded-md'
      case 'detail':
        return 'h-96 rounded-lg'
      default:
        return 'h-32 rounded-lg'
    }
  }

  return (
    <div className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${getSkeletonClass()}`}>
      <div className="h-full flex flex-col justify-between p-4">
        {type === 'card' && (
          <>
            <div className="h-32 bg-slate-300 dark:bg-slate-600 rounded-md" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4" />
              <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2" />
            </div>
          </>
        )}
        
        {type === 'list' && (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-2/3" />
              <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 实时输入验证反馈
 */
export function InputFeedback({ 
  isValid, 
  message, 
  show = true 
}: {
  isValid: boolean
  message: string
  show?: boolean
}) {
  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={`text-sm mt-1 flex items-center gap-1 ${
            isValid ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isValid ? (
            <Check className="w-3 h-3" />
          ) : (
            <span className="w-3 h-3 rounded-full bg-red-500" />
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 工具函数
function triggerSuccessAnimation(type: string) {
  switch (type) {
    case 'like':
      // 心形粒子效果
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ef4444', '#f87171', '#fca5a5']
      })
      break
    case 'bookmark':
      // 星星效果
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd']
      })
      break
    case 'achievement':
      // 彩虹烟花
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      break
  }
}

function getDefaultMessage(type: string, isActive: boolean): string {
  switch (type) {
    case 'like':
      return isActive ? '已点赞！' : '已取消点赞'
    case 'bookmark':
      return isActive ? '已收藏！' : '已取消收藏'
    case 'share':
      return '链接已复制到剪贴板'
    case 'follow':
      return isActive ? '关注成功！' : '已取消关注'
    default:
      return '操作成功'
  }
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
