import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import AuthAPI, { type UserProfilePayload } from '../api/auth'
import { LinkButton } from '../components/SmartLink'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { resolveUserAvatarSrc } from '../utils/defaultAvatars'
import { formatFullDateTime, formatRelativeTimeI18n } from '../utils/dateUtils'
import {
  roleColorMap,
  translateRoleLabel,
  translateStatusLabel,
} from './organizations/components/organizationViewShared'

const { Title, Paragraph, Text } = Typography

const USER_STATUS_COLOR_MAP: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  suspended: 'red',
}

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tp } = usePageTranslation('userProfile')
  const { tp: tpOrganizations } = usePageTranslation('organizations')

  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfilePayload | null>(null)

  const parsedUserId = Number(userId)
  const fromOrganizationId = Number(searchParams.get('organizationId') || '')

  useEffect(() => {
    if (!parsedUserId || Number.isNaN(parsedUserId)) {
      message.warning(tp('messages.invalidUserId'))
      navigate('/todo-for-ai/pages/organizations')
      return
    }

    const loadProfile = async () => {
      try {
        setLoading(true)
        const data = await AuthAPI.getUserProfile(parsedUserId)
        setProfile(data)
      } catch (error: any) {
        if (error?.status === 403) {
          message.error(tp('messages.noPermission'))
        } else if (error?.status === 404) {
          message.error(tp('messages.notFound'))
        } else {
          message.error(error?.message || tp('messages.loadFailed'))
        }
        navigate('/todo-for-ai/pages/organizations')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [navigate, parsedUserId, tp])

  const displayName = useMemo(() => {
    if (!profile) {
      return '-'
    }
    return profile.full_name || profile.nickname || profile.username || profile.name || `#${profile.id}`
  }, [profile])

  const avatarSeed = useMemo(() => {
    if (!profile) {
      return 'user-profile'
    }
    return `${profile.id}-${profile.username || profile.nickname || profile.full_name || 'user'}`
  }, [profile])

  const avatarSrc = useMemo(
    () => resolveUserAvatarSrc(profile?.avatar_url, avatarSeed),
    [avatarSeed, profile?.avatar_url]
  )

  const goBack = () => {
    if (fromOrganizationId && !Number.isNaN(fromOrganizationId)) {
      navigate(`/todo-for-ai/pages/organizations/${fromOrganizationId}?tab=members`)
      return
    }
    navigate('/todo-for-ai/pages/organizations')
  }

  if (loading && !profile) {
    return (
      <div className="page-container" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-container">
        <Empty description={tp('messages.notFound')} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <Title level={2} className="page-title">{tp('title')}</Title>
            <Paragraph className="page-description">{tp('subtitle')}</Paragraph>
          </div>
          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            {tp('actions.back')}
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space align="start" size={16} wrap style={{ width: '100%' }}>
          <Avatar size={96} src={avatarSrc} icon={<UserOutlined />} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <Space size={8} wrap style={{ marginBottom: 8 }}>
              <Title level={3} style={{ margin: 0 }}>{displayName}</Title>
              <Tag color={profile.is_self ? 'blue' : 'default'}>
                {profile.is_self ? tp('labels.self') : tp('labels.public')}
              </Tag>
              {profile.status ? (
                <Tag color={USER_STATUS_COLOR_MAP[profile.status] || 'default'}>
                  {tp(`status.${profile.status}`, { defaultValue: profile.status })}
                </Tag>
              ) : null}
            </Space>
            <Space size={12} wrap>
              <Text type="secondary">ID: {profile.id}</Text>
              {profile.username ? <Text type="secondary">@{profile.username}</Text> : null}
              {profile.locale ? <Text type="secondary">{tp('fields.locale')}: {profile.locale}</Text> : null}
              {profile.timezone ? <Text type="secondary">{tp('fields.timezone')}: {profile.timezone}</Text> : null}
            </Space>
            {profile.bio ? (
              <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>{profile.bio}</Paragraph>
            ) : (
              <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                {tp('fields.noBio')}
              </Text>
            )}
          </div>
        </Space>
      </Card>

      {profile.is_self ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={tp('selfView.title')}
          description={
            <Space direction="vertical" size={4}>
              <span>{tp('selfView.description')}</span>
              <LinkButton to="/todo-for-ai/pages/profile" type="link" icon={<EditOutlined />} style={{ padding: 0 }}>
                {tp('selfView.goProfile')}
              </LinkButton>
            </Space>
          }
        />
      ) : null}

      <Card title={tp('fields.title')} style={{ marginBottom: 16 }}>
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2 }}
          items={[
            {
              key: 'created_at',
              label: tp('fields.createdAt'),
              children: profile.created_at ? formatFullDateTime(profile.created_at) : '-',
            },
            {
              key: 'last_active_at',
              label: tp('fields.lastActiveAt'),
              children: profile.last_active_at ? formatRelativeTimeI18n(profile.last_active_at, tp) : '-',
            },
            {
              key: 'shared_count',
              label: tp('fields.sharedOrganizations'),
              children: profile.shared_organization_count ?? 0,
            },
            {
              key: 'view_mode',
              label: tp('fields.viewMode'),
              children: tp(`viewMode.${profile.view_mode}`, { defaultValue: profile.view_mode }),
            },
          ]}
        />
      </Card>

      <Card
        title={tp('sharedOrganizations.title')}
        extra={
          <Text type="secondary">
            {tp('sharedOrganizations.count', { count: profile.shared_organization_count || 0 })}
          </Text>
        }
      >
        {profile.shared_organizations?.length ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {profile.shared_organizations.map((org) => (
              <Card key={org.id} size="small" bodyStyle={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <TeamOutlined />
                      <LinkButton to={`/todo-for-ai/pages/organizations/${org.id}`} type="link" style={{ padding: 0, fontWeight: 600 }}>
                        {org.name}
                      </LinkButton>
                      <Tag color={org.status === 'active' ? 'green' : 'orange'} style={{ marginInlineEnd: 0 }}>
                        {translateStatusLabel(tpOrganizations, org.status)}
                      </Tag>
                    </div>
                    <Text type="secondary">{tp('sharedOrganizations.slug')}: {org.slug}</Text>
                  </div>
                  <div style={{ minWidth: 280 }}>
                    <div style={{ marginBottom: 6 }}>
                      <Text strong>{tp('sharedOrganizations.targetRoles')}</Text>
                    </div>
                    <Space size={[6, 6]} wrap style={{ marginBottom: 10 }}>
                      {(org.target_roles || []).length > 0 ? (
                        org.target_roles.map((roleKey) => (
                          <Tag key={`target-${org.id}-${roleKey}`} color={roleColorMap[roleKey] || 'default'}>
                            {translateRoleLabel(tpOrganizations, roleKey)}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">-</Text>
                      )}
                    </Space>

                    <div style={{ marginBottom: 6 }}>
                      <Text strong>{tp('sharedOrganizations.viewerRoles')}</Text>
                    </div>
                    <Space size={[6, 6]} wrap>
                      {(org.viewer_roles || []).length > 0 ? (
                        org.viewer_roles.map((roleKey) => (
                          <Tag key={`viewer-${org.id}-${roleKey}`} color={roleColorMap[roleKey] || 'default'}>
                            {translateRoleLabel(tpOrganizations, roleKey)}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">-</Text>
                      )}
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        ) : (
          <Empty description={tp('sharedOrganizations.empty')} />
        )}
      </Card>
    </div>
  )
}

export default UserProfilePage
