/**
 * Profile 页面主入口
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Form, App, Tabs, Row, Col, Typography } from 'antd'
import { UserOutlined, KeyOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores'
import APITokenManager from '../components/APITokenManager'
import { useTranslation } from '../i18n/hooks/useTranslation'

import { useTabState, useProfileForm, useAvatar } from './Profile/hooks'

import { ProfileCard, ProfileEditForm, AvatarPicker } from './Profile/components'

const { Title, Paragraph } = Typography
const { TabPane } = Tabs

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const { message: messageApi } = App.useApp()
  const [form] = Form.useForm()
  const { t: tp } = useTranslation('profile')
  const [searchParams, setSearchParams] = useSearchParams()
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)

  const { activeTab, handleTabChange } = useTabState(searchParams, setSearchParams)

  const { isEditing, isProfileSaving, setIsEditing, handleUpdateProfile } = useProfileForm(
    user,
    form,
    updateUser,
    messageApi,
    tp
  )

  const preferenceAvatarToken =
    typeof user?.preferences?.avatar_token === 'string' ? user.preferences.avatar_token : null
  const currentAvatarValue = preferenceAvatarToken || user?.avatar_url

  const {
    avatarSrc,
    avatarPage,
    avatarPageCount,
    pagedAvatarOptions,
    avatarPreviewOptions,
    builtinAvatarOptions,
    avatarIdentitySeed,
    isAvatarUpdating,
    setAvatarPage,
    handleSelectAvatar,
    handleRandomAvatar,
  } = useAvatar(user, currentAvatarValue, messageApi, tp, updateUser)

  // 设置网页标题
  useEffect(() => {
    document.title = tp('pageTitle')
    return () => {
      document.title = 'Todo for AI'
    }
  }, [tp])

  const handleEditToggle = () => {
    if (isEditing) {
      form.submit()
    } else {
      setIsEditing(true)
    }
  }

  const handleAvatarSelect = async (token: string) => {
    const success = await handleSelectAvatar(token)
    if (success || token === currentAvatarValue) {
      setIsAvatarPickerOpen(false)
    }
  }

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
          <ProfileCard
            user={user}
            avatarSrc={avatarSrc}
            currentAvatarValue={currentAvatarValue}
            avatarPreviewOptions={avatarPreviewOptions}
            avatarIdentitySeed={avatarIdentitySeed}
            builtinAvatarOptionsLength={builtinAvatarOptions.length}
            isProfileSaving={isProfileSaving}
            isAvatarUpdating={isAvatarUpdating}
            tp={tp}
            onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
            onRandomAvatar={handleRandomAvatar}
          />
        </Col>

        <Col xs={24} lg={16}>
          <Tabs activeKey={activeTab} onChange={handleTabChange} size="large">
            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  {tp('tabs.profile')}
                </span>
              }
              key="profile"
            >
              <ProfileEditForm
                form={form}
                isEditing={isEditing}
                isProfileSaving={isProfileSaving}
                tp={tp}
                onEditToggle={handleEditToggle}
                onSubmit={handleUpdateProfile}
                onCancel={() => setIsEditing(false)}
              />
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

      <AvatarPicker
        open={isAvatarPickerOpen}
        avatarPage={avatarPage}
        avatarPageCount={avatarPageCount}
        pagedAvatarOptions={pagedAvatarOptions}
        builtinAvatarOptionsLength={builtinAvatarOptions.length}
        currentAvatarValue={currentAvatarValue}
        avatarIdentitySeed={avatarIdentitySeed}
        isProfileSaving={isProfileSaving}
        isAvatarUpdating={isAvatarUpdating}
        tp={tp}
        onClose={() => setIsAvatarPickerOpen(false)}
        onSelect={handleAvatarSelect}
        onPageChange={setAvatarPage}
      />
    </div>
  )
}

export default Profile
