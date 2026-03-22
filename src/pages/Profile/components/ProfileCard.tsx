/**
 * 用户信息卡片组件
 */

import { Card, Avatar, Typography, Space, Divider, Button } from 'antd'
import {
  UserOutlined,
  AppstoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { resolveUserAvatarSrc } from '../../../utils/defaultAvatars'
import type { User } from '../../../stores/useAuthStore'
import type { BuiltinAvatarOption } from '../../../utils/defaultAvatars'

const { Title, Text } = Typography

const AVATAR_BORDER_STYLE = {
  border: '1px solid #d9d9d9',
  backgroundColor: '#fff',
}

interface ProfileCardProps {
  user: User
  avatarSrc: string
  currentAvatarValue: string | null | undefined
  avatarPreviewOptions: BuiltinAvatarOption[]
  avatarIdentitySeed: string
  builtinAvatarOptionsLength: number
  isProfileSaving: boolean
  isAvatarUpdating: boolean
  tp: (key: string, options?: Record<string, unknown>) => string
  onOpenAvatarPicker: () => void
  onRandomAvatar: () => void
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  avatarSrc,
  currentAvatarValue,
  avatarPreviewOptions,
  avatarIdentitySeed,
  builtinAvatarOptionsLength,
  isProfileSaving,
  isAvatarUpdating,
  tp,
  onOpenAvatarPicker,
  onRandomAvatar,
}) => {
  return (
    <Card>
      <div style={{ textAlign: 'center' }}>
        <Avatar
          size={120}
          src={avatarSrc}
          icon={<UserOutlined />}
          style={{ ...AVATAR_BORDER_STYLE, marginBottom: 16 }}
        />

        <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 12 }}>
          <Text strong>{tp('avatar.title')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {tp('avatar.description')}
          </Text>
          <Space wrap size={8} style={{ justifyContent: 'center' }}>
            <Button
              icon={<AppstoreOutlined />}
              onClick={onOpenAvatarPicker}
              disabled={isProfileSaving || isAvatarUpdating}
            >
              {tp('avatar.selectButton')}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={onRandomAvatar}
              loading={isAvatarUpdating}
              disabled={isProfileSaving || isAvatarUpdating}
            >
              {tp('avatar.randomButton')}
            </Button>
          </Space>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {tp('avatar.preview')}
            </Text>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {avatarPreviewOptions.map((option) => {
                const isSelected = option.token === currentAvatarValue
                return (
                  <Avatar
                    key={option.token}
                    size={28}
                    src={resolveUserAvatarSrc(option.token, avatarIdentitySeed)}
                    style={{
                      ...AVATAR_BORDER_STYLE,
                      ...(isSelected ? { boxShadow: '0 0 0 2px #1677ff' } : {}),
                    }}
                  />
                )
              })}
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              {tp('avatar.totalCount', { total: builtinAvatarOptionsLength })}
            </Text>
          </div>
        </Space>

        <Divider />

        <Title level={4} style={{ marginBottom: 8 }}>
          {user.full_name || user.nickname || user.username}
        </Title>
        <Text type="secondary">{user.email}</Text>

        <div style={{ marginTop: 16 }}>
          <Space direction="vertical" size="small">
            <Text>
              <strong>{tp('userInfo.role')}</strong>
              {user.role === 'admin' ? tp('userInfo.roles.admin') : tp('userInfo.roles.user')}
            </Text>
            <Text>
              <strong>{tp('userInfo.status')}</strong>
              {user.status === 'active' ? tp('userInfo.statuses.active') : tp('userInfo.statuses.inactive')}
            </Text>
            <Text>
              <strong>{tp('userInfo.registeredAt')}</strong>
              {new Date(user.created_at).toLocaleDateString()}
            </Text>
            {user.last_login_at && (
              <Text>
                <strong>{tp('userInfo.lastLogin')}</strong>
                {new Date(user.last_login_at).toLocaleString()}
              </Text>
            )}
          </Space>
        </div>
      </div>
    </Card>
  )
}
