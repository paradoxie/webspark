'use client'

import { useState } from 'react'
import { AlertTriangle, Info, AlertCircle, XCircle } from 'lucide-react'

export type ConfirmDialogType = 'info' | 'warning' | 'danger' | 'critical'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  type?: ConfirmDialogType
  confirmText?: string
  cancelText?: string
  confirmButtonText?: string
  requireConfirmText?: boolean // 要求输入确认文字
  confirmTextPlaceholder?: string
  showDetails?: boolean
  details?: string | React.ReactNode
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = '确认',
  cancelText = '取消',
  confirmButtonText,
  requireConfirmText = false,
  confirmTextPlaceholder,
  showDetails = false,
  details
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (requireConfirmText && inputValue !== confirmText) {
      return
    }

    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Confirm action failed:', error)
    } finally {
      setLoading(false)
      setInputValue('')
    }
  }

  const handleClose = () => {
    if (!loading) {
      setInputValue('')
      onClose()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-orange-500" />
      case 'critical':
        return <XCircle className="w-6 h-6 text-red-500" />
    }
  }

  const getButtonStyle = () => {
    switch (type) {
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'danger':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'critical':
        return 'bg-red-500 hover:bg-red-600'
    }
  }

  const isConfirmDisabled = loading || (requireConfirmText && inputValue !== confirmText)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* 背景遮罩 */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* 对话框 */}
        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* 图标和标题 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {message}
              </p>

              {/* 详情面板 */}
              {showDetails && details && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {showDetailsPanel ? '隐藏详情' : '查看详情'}
                  </button>
                  {showDetailsPanel && (
                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
                      {details}
                    </div>
                  )}
                </div>
              )}

              {/* 确认输入框 */}
              {requireConfirmText && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    请输入 <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{confirmText}</span> 以确认操作
                  </label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={confirmTextPlaceholder || `输入 ${confirmText}`}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             dark:bg-slate-700 dark:text-white"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
                       bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600
                       rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       ${getButtonStyle()}`}
            >
              {loading ? '处理中...' : (confirmButtonText || confirmText)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

