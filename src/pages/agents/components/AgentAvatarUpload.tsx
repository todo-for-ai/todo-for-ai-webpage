/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useRef } from 'react'
import { Avatar, Button, message, Modal, Pagination, Select, Space, Spin } from 'antd'
import { CameraOutlined, DeleteOutlined, SmileOutlined } from '@ant-design/icons'
import { storageConfigApi } from '../../../api/storage'
import {
  AVATAR_CATEGORIES,
  getBuiltinAvatarOptions,
  resolveAgentAvatarSrc,
  resolveUserAvatarSrc,
} from '../../../utils/defaultAvatars'
import type { BuiltinAvatarOption } from '../../../utils/defaultAvatars'
import { useTranslation } from '../../../i18n/hooks/useTranslation'
import './AgentAvatarUpload.css'

interface AgentAvatarUploadProps {
  value?: string
  onChange?: (url: string) => void
  workspaceId: number
  agentName?: string
  agentId?: number
  size?: number
  disabled?: boolean
}

const AgentAvatarUpload: React.FC<AgentAvatarUploadProps> = ({
  value,
  onChange,
  workspaceId,
  agentName = '',
  agentId,
  size = 80,
  disabled = false,
}) => {
  const { tc } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryPage, setLibraryPage] = useState(1)
  const [libraryCategory, setLibraryCategory] = useState<string>('all')

  const LIBRARY_PAGE_SIZE = 60
  // 形象库：25 种风格 × 种子词 → 1000 个确定性别形象
  const libraryOptions = useMemo(
    () => getBuiltinAvatarOptions(`agent-${agentId ?? 0}-${agentName || 'draft'}`),
    [agentId, agentName],
  )
  const categoryOptions = useMemo(() => {
    if (libraryCategory === 'all') return libraryOptions
    return libraryOptions.filter((o) => o.category === libraryCategory)
  }, [libraryOptions, libraryCategory])
  const libraryPageCount = Math.max(1, Math.ceil(categoryOptions.length / LIBRARY_PAGE_SIZE))
  const pagedLibraryOptions = useMemo(
    () => categoryOptions.slice((libraryPage - 1) * LIBRARY_PAGE_SIZE, libraryPage * LIBRARY_PAGE_SIZE),
    [categoryOptions, libraryPage],
  )
  const safeLibraryPage = Math.min(libraryPage, libraryPageCount)

  const openLibrary = () => {
    setLibraryPage(1)
    setLibraryOpen(true)
  }
  const selectLibraryAvatar = (token: string) => {
    onChange?.(token)
    setLibraryOpen(false)
    message.success(tc('agentAvatar.messages.uploadSuccess'))
  }

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

  // 获取头像显示内容：未配置时展示按身份自动分配的形象（确定性，同一 Agent 永远同一张脸）
  const avatarSrc = value
    ? resolveUserAvatarSrc(value, agentName || 'agent')
    : resolveAgentAvatarSrc(undefined, agentName, agentId)

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

      {/* 操作区：形象库 / 上传 */}
      {!disabled && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <Button
            size="small"
            icon={<SmileOutlined />}
            onClick={openLibrary}
            disabled={uploading}
          >
            形象库
          </Button>
          <Button size="small" onClick={openFilePicker} disabled={uploading}>
            上传
          </Button>
          {value && (
            <Button
              size="small"
              type="text"
              danger
              onClick={handleDelete}
              disabled={uploading}
            >
              清除
            </Button>
          )}
        </div>
      )}

      {/* 形象库选择弹窗 */}
      <Modal
        title="选择 Agent 形象"
        open={libraryOpen}
        onCancel={() => setLibraryOpen(false)}
        footer={null}
        width={820}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Select
              value={libraryCategory}
              onChange={(v) => { setLibraryCategory(v); setLibraryPage(1) }}
              style={{ minWidth: 140 }}
              options={[
                { value: 'all', label: `全部（${libraryOptions.length}）` },
                ...AVATAR_CATEGORIES.map((c) => ({
                  value: c.key,
                  label: `${c.label}（${libraryOptions.filter((o) => o.category === c.key).length}）`,
                })),
              ]}
            />
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
              第 {safeLibraryPage}/{libraryPageCount} 页 · 共 {categoryOptions.length} 个
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
              gap: 10,
              maxHeight: 420,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {pagedLibraryOptions.map((option: BuiltinAvatarOption) => {
              const isSelected = option.token === value
              return (
                <button
                  key={option.token}
                  type="button"
                  title={option.label}
                  onClick={() => selectLibraryAvatar(option.token)}
                  style={{
                    border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    borderRadius: 6,
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Avatar
                    src={resolveUserAvatarSrc(option.token)}
                    size={56}
                    shape="square"
                  />
                </button>
              )
            })}
          </div>
          <Pagination
            current={safeLibraryPage}
            pageSize={LIBRARY_PAGE_SIZE}
            total={categoryOptions.length}
            onChange={(page) => setLibraryPage(page)}
            showSizeChanger={false}
            style={{ textAlign: 'right' }}
          />
        </Space>
      </Modal>

      {/* 提示文字 */}
      <div className="agent-avatar-upload__hint">
        <div>{tc('agentAvatar.hint.format')}</div>
        <div>{tc('agentAvatar.hint.size')}</div>
      </div>
    </div>
  )
}

export default AgentAvatarUpload
