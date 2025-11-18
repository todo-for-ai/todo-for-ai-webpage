import React, { useEffect } from 'react'
import { Card, Button, Typography, Space, Divider, Alert } from 'antd'
import { GithubOutlined, GoogleOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/useAuthStore'
import { useTranslation } from '../i18n/hooks/useTranslation'
import LanguageSwitch from '../components/LanguageSwitch'
import WeChatGroup from '../components/WeChatGroup/WeChatGroup'
import TelegramGroup from '../components/TelegramGroup/TelegramGroup'
import { Footer } from '../components/Footer'
import GitHubBadge from '../components/GitHubBadge/GitHubBadge'
import { analytics } from '../utils/analytics'
import './Login.css'

const { Title, Paragraph } = Typography

const Login: React.FC = () => {
  const { loginWithGitHub, loginWithGoogle, loginWithGuest, isLoading, error, isAuthenticated } = useAuthStore()
  const { t } = useTranslation('login')

  useEffect(() => {
    // 如果已经登录，重定向到主页
    if (isAuthenticated) {
      window.location.href = '/todo-for-ai/pages'
    }
  }, [isAuthenticated])

  // 设置网页标题
  useEffect(() => {
    document.title = t('pageTitle')

    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'Todo for AI'
    }
  }, [t])

  const handleGitHubLogin = () => {
    analytics.auth.login('github')
    loginWithGitHub('/todo-for-ai/pages')
  }

  const handleGoogleLogin = () => {
    analytics.auth.login('google')
    loginWithGoogle('/todo-for-ai/pages')
  }

  const handleGuestLogin = () => {
    analytics.auth.login('guest')
    loginWithGuest('/todo-for-ai/pages')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="login-container" style={{ flex: 1 }}>
        {/* 语言切换按钮 */}
        <div className="login-language-switch">
          <LanguageSwitch size="small" />
        </div>

        <Card
          className="login-card"
          styles={{ body: { padding: '24px 20px' } }}
        >
          <div className="login-header">
            <Title level={2} className="login-title">
              {t('title')}
            </Title>
            <Paragraph className="login-subtitle">
              {t('subtitle')} · <a
                href="https://site.todo4ai.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="login-learn-more-inline"
              >
                {t('learnMore.link')}
              </a>
            </Paragraph>

            {/* GitHub徽标 */}
            <div className="login-github-badge">
              <GitHubBadge
                variant="button"
                size="middle"
                showStars={true}
                showForks={false}
                owner="todo-for-ai"
                repo="todo-for-ai"
              />
            </div>
          </div>

          {error && (
            <Alert
              message={t('loginFailed')}
              description={error}
              type="error"
              showIcon
              className="login-error"
            />
          )}

          <Space direction="vertical" size="middle" className="login-methods">
            <div>
              <Title level={4} className="login-methods-title">
                {t('chooseLoginMethod')}
              </Title>

              <Space direction="vertical" size="small" className="login-buttons">
                <Button
                  type="primary"
                  size="large"
                  icon={<GithubOutlined />}
                  loading={isLoading}
                  onClick={handleGitHubLogin}
                  className="login-button-github"
                >
                  {t('loginWithGitHub')}
                </Button>

                <Button
                  size="large"
                  icon={<GoogleOutlined />}
                  loading={isLoading}
                  onClick={handleGoogleLogin}
                  className="login-button-google"
                >
                  {t('loginWithGmail')}
                </Button>

                <Button
                  size="large"
                  icon={<UserOutlined />}
                  loading={isLoading}
                  onClick={handleGuestLogin}
                  className="login-button-guest"
                >
                  游客模式登录
                </Button>
              </Space>
            </div>

            <Divider className="login-divider">
              <span className="login-divider-text">{t('supportedMethods')}</span>
            </Divider>

            <div className="login-supported-methods">
              <Space size="large">
                <div className="login-method-icon">
                  <GithubOutlined className="login-method-icon-github" />
                  <div className="login-method-label">GitHub</div>
                </div>
                <div className="login-method-icon">
                  <GoogleOutlined className="login-method-icon-google" />
                  <div className="login-method-label">Gmail</div>
                </div>
                <div className="login-method-icon">
                  <UserOutlined className="login-method-icon-guest" />
                  <div className="login-method-label">Guest</div>
                </div>
              </Space>
            </div>

            <div className="login-agreement">
              <Paragraph className="login-agreement-text">
                {t('agreement.text')}
                <a
                  href="/todo-for-ai/pages/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-agreement-link"
                >
                  {t('agreement.terms')}
                </a>
                {t('agreement.and')}
                <a
                  href="/todo-for-ai/pages/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-agreement-link"
                >
                  {t('agreement.privacy')}
                </a>
              </Paragraph>
            </div>


          </Space>
        </Card>

        {/* 微信AI交流群 - 只在中文环境下显示 */}
        <WeChatGroup />

        {/* Telegram AI交流群 - 只在英文环境下显示 */}
        <TelegramGroup />
      </div>

      {/* 页脚 */}
      <Footer />
    </div>
  )
}

export default Login
