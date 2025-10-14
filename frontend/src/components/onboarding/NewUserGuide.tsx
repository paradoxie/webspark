'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface GuideStep {
  id: string
  title: string
  description: string
  target: string // CSS selector for the target element
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

const guideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到 WebSpark!',
    description: '让我们快速了解一下如何使用这个平台',
    target: 'body',
    position: 'top'
  },
  {
    id: 'browse',
    title: '浏览优秀作品',
    description: '在首页发现其他开发者的精彩作品，点击卡片查看详情',
    target: '.website-grid',
    position: 'top'
  },
  {
    id: 'search',
    title: '搜索与发现',
    description: '使用搜索功能快速找到感兴趣的作品或技术栈',
    target: '.search-form',
    position: 'bottom'
  },
  {
    id: 'submit',
    title: '提交你的作品',
    description: '点击"提交作品"按钮，分享你的创作给社区',
    target: '.submit-button',
    position: 'left'
  },
  {
    id: 'profile',
    title: '个人中心',
    description: '在这里管理你的作品、查看收藏和关注的创作者',
    target: '.user-menu',
    position: 'left'
  },
  {
    id: 'interact',
    title: '互动与交流',
    description: '给喜欢的作品点赞、收藏，或留下你的评论',
    target: '.interaction-buttons',
    position: 'top'
  }
]

export default function NewUserGuide() {
  const { data: session } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [skipGuide, setSkipGuide] = useState(false)

  useEffect(() => {
    // 检查用户是否是新用户
    if (session?.user) {
      const hasSeenGuide = localStorage.getItem('hasSeenGuide')
      const isNewUser = localStorage.getItem('isNewUser')
      
      if (isNewUser === 'true' && !hasSeenGuide) {
        setIsVisible(true)
      }
    }
  }, [session])

  useEffect(() => {
    if (isVisible && currentStep < guideSteps.length) {
      const step = guideSteps[currentStep]
      highlightElement(step.target)
    }
  }, [currentStep, isVisible])

  const highlightElement = (selector: string) => {
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('guide-highlight')
      
      return () => {
        element.classList.remove('guide-highlight')
      }
    }
  }

  const handleNext = () => {
    const currentStepId = guideSteps[currentStep].id
    setCompletedSteps([...completedSteps, currentStepId])
    
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeGuide()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    setSkipGuide(true)
    completeGuide()
  }

  const completeGuide = () => {
    localStorage.setItem('hasSeenGuide', 'true')
    localStorage.removeItem('isNewUser')
    setIsVisible(false)
    
    // 发送完成事件到后端
    if (!skipGuide) {
      fetch('/api/user/guide-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedSteps })
      })
    }
  }

  if (!isVisible) return null

  const step = guideSteps[currentStep]
  const progress = ((currentStep + 1) / guideSteps.length) * 100

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          onClick={handleSkip}
        />
        
        {/* 引导卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`absolute bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 max-w-md pointer-events-auto
            ${getPositionClasses(step.position, step.target)}`}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleSkip}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* 步骤内容 */}
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">{step.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {step.description}
            </p>
          </div>
          
          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>步骤 {currentStep + 1}/{guideSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-500"
              />
            </div>
          </div>
          
          {/* 导航按钮 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              跳过引导
            </button>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一步
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
              >
                {currentStep === guideSteps.length - 1 ? (
                  <>
                    完成
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* 指向箭头 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute w-0 h-0 pointer-events-none
            ${getArrowClasses(step.position)}`}
        />
      </div>
      
      <style jsx global>{`
        .guide-highlight {
          position: relative;
          z-index: 51;
          outline: 3px solid #3b82f6;
          outline-offset: 4px;
          border-radius: 8px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            outline-color: #3b82f6;
          }
          50% {
            outline-color: #60a5fa;
          }
        }
      `}</style>
    </AnimatePresence>
  )
}

function getPositionClasses(position: string, target: string): string {
  // 根据目标元素和位置计算引导卡片的位置
  // 这里简化处理，实际应该根据目标元素的位置动态计算
  switch (position) {
    case 'top':
      return 'top-20 left-1/2 -translate-x-1/2'
    case 'bottom':
      return 'bottom-20 left-1/2 -translate-x-1/2'
    case 'left':
      return 'top-1/2 left-20 -translate-y-1/2'
    case 'right':
      return 'top-1/2 right-20 -translate-y-1/2'
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  }
}

function getArrowClasses(position: string): string {
  // 根据位置返回箭头样式
  switch (position) {
    case 'top':
      return 'border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white dark:border-t-slate-800'
    case 'bottom':
      return 'border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white dark:border-b-slate-800'
    case 'left':
      return 'border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[10px] border-l-white dark:border-l-slate-800'
    case 'right':
      return 'border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white dark:border-r-slate-800'
    default:
      return ''
  }
}
