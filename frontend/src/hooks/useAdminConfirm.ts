import { useState, useCallback } from 'react'
import { ConfirmDialogType } from '../components/admin/ConfirmDialog'

interface ConfirmOptions {
  title: string
  message: string
  type?: ConfirmDialogType
  confirmText?: string
  cancelText?: string
  confirmButtonText?: string
  requireConfirmText?: boolean
  confirmTextPlaceholder?: string
  showDetails?: boolean
  details?: string | React.ReactNode
}

interface AdminAction {
  id: string
  name: string
  description?: string
  danger: boolean
  requireConfirm: boolean
  confirmOptions?: ConfirmOptions
}

// 预定义的管理员操作
export const ADMIN_ACTIONS: Record<string, AdminAction> = {
  DELETE_WEBSITE: {
    id: 'DELETE_WEBSITE',
    name: '删除网站',
    description: '永久删除网站及其所有相关数据',
    danger: true,
    requireConfirm: true,
    confirmOptions: {
      title: '删除网站',
      message: '此操作将永久删除该网站及其所有相关数据（评论、点赞、浏览记录等），且无法恢复。',
      type: 'critical',
      confirmText: '永久删除',
      requireConfirmText: true,
      confirmButtonText: '我确认要删除'
    }
  },
  
  BATCH_DELETE_WEBSITES: {
    id: 'BATCH_DELETE_WEBSITES',
    name: '批量删除网站',
    description: '批量删除多个网站',
    danger: true,
    requireConfirm: true,
    confirmOptions: {
      title: '批量删除网站',
      message: '此操作将永久删除所选的所有网站，且无法恢复。',
      type: 'critical',
      confirmText: '批量删除',
      requireConfirmText: true,
      showDetails: true
    }
  },

  BAN_USER: {
    id: 'BAN_USER',
    name: '封禁用户',
    description: '封禁用户账号',
    danger: true,
    requireConfirm: true,
    confirmOptions: {
      title: '封禁用户',
      message: '封禁后，该用户将无法登录和使用任何功能。',
      type: 'danger',
      confirmText: '确认封禁',
      requireConfirmText: true
    }
  },

  DELETE_USER: {
    id: 'DELETE_USER',
    name: '删除用户',
    description: '永久删除用户账号',
    danger: true,
    requireConfirm: true,
    confirmOptions: {
      title: '删除用户账号',
      message: '此操作将永久删除用户账号及其所有数据，包括提交的网站、评论、点赞等，且无法恢复。',
      type: 'critical',
      confirmText: '删除账号',
      requireConfirmText: true,
      confirmButtonText: '永久删除账号'
    }
  },

  REJECT_WEBSITE: {
    id: 'REJECT_WEBSITE',
    name: '拒绝网站',
    description: '拒绝网站审核',
    danger: false,
    requireConfirm: true,
    confirmOptions: {
      title: '拒绝网站',
      message: '确定要拒绝这个网站吗？请确保已经填写了拒绝理由。',
      type: 'warning',
      confirmText: '确认拒绝'
    }
  },

  BATCH_APPROVE: {
    id: 'BATCH_APPROVE',
    name: '批量通过',
    description: '批量通过网站审核',
    danger: false,
    requireConfirm: true,
    confirmOptions: {
      title: '批量通过审核',
      message: '确定要通过所选的所有网站吗？',
      type: 'info',
      confirmText: '确认通过',
      showDetails: true
    }
  },

  CLEAR_CACHE: {
    id: 'CLEAR_CACHE',
    name: '清除缓存',
    description: '清除系统缓存',
    danger: false,
    requireConfirm: true,
    confirmOptions: {
      title: '清除系统缓存',
      message: '清除缓存后，系统性能可能会暂时下降，直到缓存重新建立。',
      type: 'warning',
      confirmText: '清除缓存'
    }
  },

  RESET_RECOMMENDATIONS: {
    id: 'RESET_RECOMMENDATIONS',
    name: '重置推荐算法',
    description: '重置推荐系统',
    danger: true,
    requireConfirm: true,
    confirmOptions: {
      title: '重置推荐算法',
      message: '此操作将清除所有用户的个性化推荐数据，系统将重新学习用户偏好。',
      type: 'danger',
      confirmText: '重置',
      requireConfirmText: true
    }
  },

  EXPORT_DATA: {
    id: 'EXPORT_DATA',
    name: '导出数据',
    description: '导出系统数据',
    danger: false,
    requireConfirm: false
  },

  SEND_NOTIFICATION: {
    id: 'SEND_NOTIFICATION',
    name: '发送通知',
    description: '向用户发送系统通知',
    danger: false,
    requireConfirm: true,
    confirmOptions: {
      title: '发送系统通知',
      message: '确定要向所有用户发送此通知吗？',
      type: 'info',
      confirmText: '发送通知'
    }
  }
}

export function useAdminConfirm() {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    onConfirm: () => void | Promise<void>
  }>({
    isOpen: false,
    options: {
      title: '',
      message: ''
    },
    onConfirm: () => {}
  })

  const requireConfirm = useCallback((
    action: AdminAction | string,
    onConfirm: () => void | Promise<void>,
    customOptions?: Partial<ConfirmOptions>
  ) => {
    let actionConfig: AdminAction
    
    if (typeof action === 'string') {
      actionConfig = ADMIN_ACTIONS[action]
      if (!actionConfig) {
        console.error(`Unknown admin action: ${action}`)
        return
      }
    } else {
      actionConfig = action
    }

    if (!actionConfig.requireConfirm) {
      // 不需要确认，直接执行
      onConfirm()
      return
    }

    const options = {
      ...actionConfig.confirmOptions!,
      ...customOptions
    }

    setConfirmDialog({
      isOpen: true,
      options,
      onConfirm
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({
      ...prev,
      isOpen: false
    }))
  }, [])

  return {
    confirmDialog: {
      ...confirmDialog,
      onClose: closeConfirm
    },
    requireConfirm
  }
}

