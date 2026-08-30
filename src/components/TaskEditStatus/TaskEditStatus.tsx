import React, { useState, useEffect, useCallback } from 'react'
import { Checkbox, Typography, Space, Button } from 'antd'
import { SaveOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { usePageTranslation, useTranslation } from '../../i18n/hooks/useTranslation'
import './TaskEditStatus.css'

const { Text } = Typography

interface TaskEditStatusProps {
  // 当前编辑器内容
  currentContent: string
  // 服务器上的原始内容
  originalContent: string
  // 任务的最后更新时间
  lastSavedTime?: string
  // 保存回调
  onSave?: () => void
  // 自动保存回调
  onAutoSave?: () => void
  // 是否正在保存
  isSaving?: boolean
  // 是否启用（仅在编辑模式下显示）
  enabled?: boolean
}

const TaskEditStatus: React.FC<TaskEditStatusProps> = ({
  currentContent,
  originalContent,
  lastSavedTime,
  onSave,
  onAutoSave,
  isSaving = false,
  enabled = true
}) => {
  const { tp } = usePageTranslation('createTask')
  const { language } = useTranslation()
  
  // 自动保存开关状态（从localStorage读取）
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    return localStorage.getItem('taskEdit_autoSave') === 'true'
  })
  
  // 是否有未保存的更改
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // 上次检查时间
  const [lastCheckTime, setLastCheckTime] = useState(Date.now())
  
  // 检查是否有未保存的更改
  const checkUnsavedChanges = useCallback(() => {
    const hasChanges = currentContent !== originalContent
    setHasUnsavedChanges(hasChanges)
    setLastCheckTime(Date.now())
    return hasChanges
  }, [currentContent, originalContent])
  
  // 每5秒检查一次未保存的更改
  useEffect(() => {
    if (!enabled) return
    
    const interval = setInterval(() => {
      checkUnsavedChanges()
    }, 5000) // 5秒检查一次
    
    return () => clearInterval(interval)
  }, [checkUnsavedChanges, enabled])
  
  // 内容变化时立即检查
  useEffect(() => {
    if (enabled) {
      checkUnsavedChanges()
    }
  }, [currentContent, originalContent, enabled, checkUnsavedChanges])
  
  // 自动保存开关变化处理
  const handleAutoSaveChange = useCallback((checked: boolean) => {
    setAutoSaveEnabled(checked)
    localStorage.setItem('taskEdit_autoSave', checked.toString())
    
    // 如果开启自动保存且有未保存的更改，立即保存
    if (checked && hasUnsavedChanges && onAutoSave) {
      onAutoSave()
    }
  }, [hasUnsavedChanges, onAutoSave])
  
  // 格式化时间显示
  const formatTime = useCallback((timeString?: string) => {
    if (!timeString) return tp('editStatus.unknown')
    
    try {
      const date = new Date(timeString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      
      if (diffMinutes < 1) {
        return tp('editStatus.justNow')
      } else if (diffMinutes < 60) {
        return tp('editStatus.minutesAgo', { count: diffMinutes })
      } else if (diffMinutes < 24 * 60) {
        const diffHours = Math.floor(diffMinutes / 60)
        return tp('editStatus.hoursAgo', { count: diffHours })
      } else {
        return date.toLocaleString(language === 'zh-CN' ? 'zh-CN' : 'en-US', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch (error) {
      return tp('editStatus.unknown')
    }
  }, [language, tp])
  
  // 如果未启用，不显示任何内容
  if (!enabled) {
    return null
  }
  
  return (
    <div className="task-edit-status">
      <Space size="large" align="center">
        {/* 自动保存复选框 */}
        <Checkbox
          checked={autoSaveEnabled}
          onChange={(e) => handleAutoSaveChange(e.target.checked)}
          disabled={isSaving}
        >
          <Text strong>{tp('editStatus.autoSave')}</Text>
        </Checkbox>
        
        {/* 上次保存时间 */}
        <Space size="small" align="center">
          <ClockCircleOutlined style={{ color: '#666' }} />
          <Text type="secondary">
            {tp('editStatus.lastSaved')}: {formatTime(lastSavedTime)}
          </Text>
        </Space>
        
        {/* 未保存更改提示 */}
        {hasUnsavedChanges && (
          <Space size="small" align="center" className="unsaved-warning">
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <Text type="warning" strong>
              {tp('editStatus.unsavedWarning')}
            </Text>
            {onSave && (
              <Button
                type="link"
                size="small"
                icon={<SaveOutlined />}
                onClick={onSave}
                loading={isSaving}
                style={{ padding: '0 4px', height: 'auto' }}
              >
                {tp('editStatus.saveNow')}
              </Button>
            )}
          </Space>
        )}
        
        {/* 保存状态指示 */}
        {isSaving && (
          <Text type="secondary">
            {tp('editStatus.saving')}
          </Text>
        )}
      </Space>
    </div>
  )
}

export default TaskEditStatus
