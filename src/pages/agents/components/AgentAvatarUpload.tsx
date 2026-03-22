import { useState, useRef } from 'react'
import { Avatar, Button, message, Spin } from 'antd'
import { CameraOutlined, DeleteOutlined } from '@ant-design/icons'
import { storageConfigApi } from '../../../api/storage'
import { resolveUserAvatarSrc } from '../../../utils/defaultAvatars'
import { useTranslation } from '../../../i18n/hooks/useTranslation'
import './AgentAvatarUpload.css'

interface AgentAvatarUploadProps {
  value?: string
  onChange?: (url: string) => void
  workspaceId: number
  agentName?: string
  size?: number
  disabled?: boolean
}

const AgentAvatarUpload: React.FC<AgentAvatarUploadProps> = ({
  value,
  onChange,
  workspaceId,
  agentName = '',
  size = 80,
  disabled = false,
}) => {
  const { tc } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error(tc('agentAvatar.errors.onlyImage'))
      return false
    }

    // 验证文件大小 (最大 2MB)
    const maxSize = 2
    if (file.size / 1024 / 1024 > maxSize) {
      message.error(tc('agentAvatar.errors.maxSize', { size: maxSize }))
      return false
    }

    return true
  }

  // 上传文件
  const uploadFile = async (file: File) => {
    if (!workspaceId) {
      message.error(tc('agentAvatar.errors.workspaceRequired'))
      return
    }

    const isValid = await handleFileSelect(file)
    if (!isValid) return

    setUploading(true)
    try {
      const response = await storageConfigApi.uploadFile(
        workspaceId,
        file,
        'agents/avatars',
        (progress) => {
          console.log('Upload progress:', progress)
        }
      )

      if (response?.url) {
        onChange?.(response.url)
        message.success(tc('agentAvatar.messages.uploadSuccess'))
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      message.error(error?.message || tc('agentAvatar.messages.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  // 处理文件输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // 清空 input 值，允许重复选择同一文件
    e.target.value = ''
  }

  // 删除头像
  const handleDelete = () => {
    onChange?.('')
    message.success(tc('agentAvatar.messages.deleteSuccess'))
  }

  // 打开文件选择器
  const openFilePicker = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  // 获取头像显示内容
  const avatarSrc = value
    ? resolveUserAvatarSrc(value, agentName || 'agent')
    : undefined

  return (
    <div className="agent-avatar-upload">
      <div
        className="agent-avatar-upload__wrapper"
        style={{ width: size, height: size }}
      >
        <Avatar
          src={avatarSrc}
          size={size}
          className="agent-avatar-upload__avatar"
          style={{
            backgroundColor: '#f0f0f0',
            cursor: disabled ? 'default' : 'pointer',
            fontSize: size * 0.4,
          }}
        >
          {!avatarSrc && agentName ? agentName.charAt(0).toUpperCase() : null}
        </Avatar>

        {!disabled && (
          <>
            {/* 悬停遮罩 */}
            <div
              className="agent-avatar-upload__overlay"
              onClick={openFilePicker}
              style={{ width: size, height: size, borderRadius: size / 2 }}
            >
              <div className="agent-avatar-upload__overlay-content">
                {uploading ? (
                  <Spin size="small" />
                ) : (
                  <>
                    <CameraOutlined className="agent-avatar-upload__icon" />
                    <span className="agent-avatar-upload__text">
                      {tc('agentAvatar.uploadButton')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 删除按钮 */}
            {value && (
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="agent-avatar-upload__delete"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={uploading}
              />
            )}
          </>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {/* 提示文字 */}
      <div className="agent-avatar-upload__hint">
        <div>{tc('agentAvatar.hint.format')}</div>
        <div>{tc('agentAvatar.hint.size')}</div>
      </div>
    </div>
  )
}

export default AgentAvatarUpload
