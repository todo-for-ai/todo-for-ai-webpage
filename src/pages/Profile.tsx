import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Space,
  Divider,
  App,
  Row,
  Col,
  Modal,
  Pagination,
} from 'antd'
import {
  UserOutlined,
  KeyOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/useAuthStore'
import APITokenManager from '../components/APITokenManager'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { useSearchParams } from 'react-router-dom'
import {
  clearStoredAvatarToken,
  getBuiltinAvatarOptions,
  getStoredAvatarToken,
  pickRandomBuiltinAvatar,
  resolveUserAvatarSrc,
  setStoredAvatarToken,
} from '../utils/defaultAvatars'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const AVATAR_PAGE_SIZE = 60
const AVATAR_BORDER_STYLE = {
  border: '1px solid #d9d9d9',
  backgroundColor: '#fff',
}

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const { message: messageApi } = App.useApp()
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)
  const [avatarPage, setAvatarPage] = useState(1)
  const [localAvatarToken, setLocalAvatarToken] = useState<string | null>(null)
  const { tp } = usePageTranslation('profile')
  const [searchParams, setSearchParams] = useSearchParams()

  // 定义所有有效的标签页key
  const validTabs = ['profile', 'tokens']

  // 获取初始标签页，确保是有效的
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab')
    return validTabs.includes(tabParam || '') ? tabParam! : 'profile'
  }

  const [activeTab, setActiveTab] = useState(getInitialTab())
  useEffect(() => {
    if (!user?.id) {
      setLocalAvatarToken(null)
      return
    }
    setLocalAvatarToken(getStoredAvatarToken(user.id))
  }, [user?.id])

  const avatarIdentitySeed = user
    ? `${user.id}-${user.username || user.email || 'user'}`
    : 'guest-user'
  const preferenceAvatarToken = typeof user?.preferences?.avatar_token === 'string'
    ? user.preferences.avatar_token
    : null
  const currentAvatarValue = localAvatarToken || preferenceAvatarToken || user?.avatar_url
  const builtinAvatarOptions = useMemo(
    () => getBuiltinAvatarOptions(avatarIdentitySeed),
    [avatarIdentitySeed]
  )
  const avatarSrc = useMemo(
    () => resolveUserAvatarSrc(currentAvatarValue, avatarIdentitySeed),
    [currentAvatarValue, avatarIdentitySeed]
  )
  const avatarPageCount = Math.max(1, Math.ceil(builtinAvatarOptions.length / AVATAR_PAGE_SIZE))
  const avatarPreviewOptions = useMemo(
    () => builtinAvatarOptions.slice(0, 12),
    [builtinAvatarOptions]
  )
  const pagedAvatarOptions = useMemo(() => {
    const start = (avatarPage - 1) * AVATAR_PAGE_SIZE
    return builtinAvatarOptions.slice(start, start + AVATAR_PAGE_SIZE)
  }, [avatarPage, builtinAvatarOptions])

  useEffect(() => {
    if (avatarPage > avatarPageCount) {
      setAvatarPage(avatarPageCount)
    }
  }, [avatarPage, avatarPageCount])

  useEffect(() => {
    if (!isAvatarPickerOpen) {
      return
    }

    const selectedIndex = builtinAvatarOptions.findIndex((option) => option.token === currentAvatarValue)
    if (selectedIndex < 0) {
      return
    }

    const selectedPage = Math.floor(selectedIndex / AVATAR_PAGE_SIZE) + 1
    if (selectedPage !== avatarPage) {
      setAvatarPage(selectedPage)
    }
  }, [avatarPage, builtinAvatarOptions, currentAvatarValue, isAvatarPickerOpen])

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        full_name: user.full_name,
        nickname: user.nickname,
        bio: user.bio,
        timezone: user.timezone,
        locale: user.locale
      })
    }
  }, [user, form])

  // 监听URL参数变化，同步标签页状态
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    } else if (!tabParam && activeTab !== 'profile') {
      // 如果URL中没有tab参数，默认显示profile
      setActiveTab('profile')
    }
  }, [searchParams, activeTab, validTabs])

  // 设置网页标题
  useEffect(() => {
    document.title = tp('pageTitle')

    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'Todo for AI'
    }
  }, [tp])

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    // 更新URL参数以保持标签页状态
    const newSearchParams = new URLSearchParams(searchParams)
    if (key === 'profile') {
      // profile是默认标签页，不需要在URL中显示
      newSearchParams.delete('tab')
    } else {
      newSearchParams.set('tab', key)
    }
    setSearchParams(newSearchParams, { replace: true })
  }

  const handleUpdateProfile = async (values: any) => {
    try {
      setIsProfileSaving(true)
      await updateUser(values)
      messageApi.success(tp('messages.updateSuccess'))
      setIsEditing(false)
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || tp('messages.updateFailed'))
    } finally {
      setIsProfileSaving(false)
    }
  }

  const updateAvatarToken = useCallback(async (
    token: string,
    successMessageKey: string,
    failureMessageKey: string
  ): Promise<boolean> => {
    if (!user) {
      return false
    }

    const previousLocalToken = localAvatarToken

    try {
      setIsAvatarUpdating(true)
      if (user.id) {
        setStoredAvatarToken(user.id, token)
      }
      setLocalAvatarToken(token)

      await updateUser({
        preferences: {
          avatar_token: token,
        },
      })

      messageApi.success(tp(successMessageKey))
      return true
    } catch (error) {
      console.error('Failed to update avatar:', error)

      if (user.id) {
        if (previousLocalToken) {
          setStoredAvatarToken(user.id, previousLocalToken)
        } else {
          clearStoredAvatarToken(user.id)
        }
      }
      setLocalAvatarToken(previousLocalToken)

      messageApi.error(tp(failureMessageKey))
      return false
    } finally {
      setIsAvatarUpdating(false)
    }
  }, [clearStoredAvatarToken, localAvatarToken, messageApi, tp, updateUser, user])

  const handleRandomAvatar = useCallback(async () => {
    if (!user) {
      return
    }

    const selected = pickRandomBuiltinAvatar(builtinAvatarOptions, currentAvatarValue)
    if (!selected) {
      return
    }

    await updateAvatarToken(
      selected.token,
      'avatar.messages.randomSuccess',
      'avatar.messages.randomFailed'
    )
  }, [builtinAvatarOptions, currentAvatarValue, updateAvatarToken, user])

  const handleSelectAvatar = useCallback(async (token: string) => {
    if (token === currentAvatarValue) {
      setIsAvatarPickerOpen(false)
      return
    }

    const updated = await updateAvatarToken(
      token,
      'avatar.messages.selectSuccess',
      'avatar.messages.selectFailed'
    )
    if (updated) {
      setIsAvatarPickerOpen(false)
    }
  }, [currentAvatarValue, updateAvatarToken])

  if (!user) {
    return <div>{tp('messages.loading')}</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>{tp('title')}</Title>
        <Paragraph>{tp('subtitle')}</Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          {/* 用户信息卡片 */}
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
                    onClick={() => setIsAvatarPickerOpen(true)}
                    disabled={isProfileSaving || isAvatarUpdating}
                  >
                    {tp('avatar.selectButton')}
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRandomAvatar}
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
                    {tp('avatar.totalCount', { total: builtinAvatarOptions.length })}
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
        </Col>

        <Col xs={24} lg={16}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            size="large"
          >
            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  {tp('tabs.profile')}
                </span>
              }
              key="profile"
            >
              <Card
                title={tp('basicInfo.title')}
                extra={
                  <Button
                    type={isEditing ? "primary" : "default"}
                    icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
                    onClick={() => {
                      if (isEditing) {
                        form.submit()
                      } else {
                        setIsEditing(true)
                      }
                    }}
                    loading={isProfileSaving}
                  >
                    {isEditing ? tp('buttons.save') : tp('buttons.edit')}
                  </Button>
                }
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  disabled={!isEditing}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={tp('basicInfo.username')}
                        name="username"
                        rules={[
                          { required: true, message: tp('basicInfo.validation.usernameRequired') },
                          { min: 2, message: tp('basicInfo.validation.usernameMinLength') }
                        ]}
                      >
                        <Input placeholder={tp('basicInfo.placeholders.username')} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={tp('basicInfo.nickname')}
                        name="nickname"
                      >
                        <Input placeholder={tp('basicInfo.placeholders.nickname')} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={tp('basicInfo.fullName')}
                    name="full_name"
                  >
                    <Input placeholder={tp('basicInfo.placeholders.fullName')} />
                  </Form.Item>

                  <Form.Item
                    label={tp('basicInfo.bio')}
                    name="bio"
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder={tp('basicInfo.placeholders.bio')}
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={tp('basicInfo.timezone')}
                        name="timezone"
                      >
                        <Input placeholder={tp('basicInfo.placeholders.timezone')} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={tp('basicInfo.language')}
                        name="locale"
                      >
                        <Input placeholder={tp('basicInfo.placeholders.language')} />
                      </Form.Item>
                    </Col>
                  </Row>

                  {isEditing && (
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={isProfileSaving}>
                          {tp('buttons.saveChanges')}
                        </Button>
                        <Button onClick={() => setIsEditing(false)}>
                          {tp('buttons.cancel')}
                        </Button>
                      </Space>
                    </Form.Item>
                  )}
                </Form>
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <KeyOutlined />
                  {tp('tabs.tokens')}
                </span>
              }
              key="tokens"
            >
              <APITokenManager />
            </TabPane>


          </Tabs>
        </Col>
      </Row>

      <Modal
        title={tp('avatar.modalTitle')}
        open={isAvatarPickerOpen}
        onCancel={() => setIsAvatarPickerOpen(false)}
        footer={null}
        width={760}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <Text type="secondary">
              {tp('avatar.pageInfo', { current: avatarPage, total: avatarPageCount })}
            </Text>
            <Text type="secondary">
              {tp('avatar.totalCount', { total: builtinAvatarOptions.length })}
            </Text>
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
                  onClick={() => {
                    void handleSelectAvatar(option.token)
                  }}
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
              pageSize={AVATAR_PAGE_SIZE}
              total={builtinAvatarOptions.length}
              onChange={(page) => setAvatarPage(page)}
              showSizeChanger={false}
              size="small"
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default Profile
