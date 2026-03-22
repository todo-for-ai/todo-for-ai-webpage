/**
 * 头像选择弹窗组件
 */

import { Modal, Space, Pagination, Avatar } from 'antd'
import { resolveUserAvatarSrc } from '../../../utils/defaultAvatars'
import type { BuiltinAvatarOption } from '../../../utils/defaultAvatars'

const AVATAR_BORDER_STYLE = {
  border: '1px solid #d9d9d9',
  backgroundColor: '#fff',
}

interface AvatarPickerProps {
  open: boolean
  avatarPage: number
  avatarPageCount: number
  pagedAvatarOptions: BuiltinAvatarOption[]
  builtinAvatarOptionsLength: number
  currentAvatarValue: string | null | undefined
  avatarIdentitySeed: string
  isProfileSaving: boolean
  isAvatarUpdating: boolean
  tp: (key: string, options?: Record<string, unknown>) => string
  onClose: () => void
  onSelect: (token: string) => void
  onPageChange: (page: number) => void
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  open,
  avatarPage,
  avatarPageCount,
  pagedAvatarOptions,
  builtinAvatarOptionsLength,
  currentAvatarValue,
  avatarIdentitySeed,
  isProfileSaving,
  isAvatarUpdating,
  tp,
  onClose,
  onSelect,
  onPageChange,
}) => {
  return (
    <Modal
      title={tp('avatar.modalTitle')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#8c8c8c' }}>
            {tp('avatar.pageInfo', { current: avatarPage, total: avatarPageCount })}
          </span>
          <span style={{ color: '#8c8c8c' }}>
            {tp('avatar.totalCount', { total: builtinAvatarOptionsLength })}
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
          {pagedAvatarOptions.map((option) => {
            const isSelected = option.token === currentAvatarValue
            return (
              <button
                key={option.token}
                type="button"
                title={option.label}
                onClick={() => onSelect(option.token)}
                disabled={isProfileSaving || isAvatarUpdating}
                style={{
                  width: '100%',
                  minHeight: 68,
                  borderRadius: 10,
                  border: isSelected ? '2px solid #1677ff' : '1px solid #d9d9d9',
                  background: isSelected ? '#e6f4ff' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                  cursor: isProfileSaving || isAvatarUpdating ? 'not-allowed' : 'pointer',
                }}
              >
                <Avatar
                  size={44}
                  src={resolveUserAvatarSrc(option.token, avatarIdentitySeed)}
                  style={AVATAR_BORDER_STYLE}
                />
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={avatarPage}
            pageSize={60}
            total={builtinAvatarOptionsLength}
            onChange={onPageChange}
            showSizeChanger={false}
            size="small"
          />
        </div>
      </Space>
    </Modal>
  )
}
