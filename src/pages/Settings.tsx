import { useEffect, useMemo, useState } from 'react'
import { Typography, Card, Form, Button, Select, message, Checkbox, Switch } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { apiClient } from '../api'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { useLanguage } from '../contexts/LanguageContext'
import type { SupportedLanguage } from '../i18n'
import { useAuthStore } from '../stores/useAuthStore'
import NotificationChannelManager from '../components/NotificationChannelManager'
import { useNotificationCatalog } from '../modules/notifications'

const { Title, Paragraph } = Typography
const { Option } = Select

const Settings = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const { user } = useAuthStore()
  const { items: eventCatalog } = useNotificationCatalog()

  // 使用i18n翻译
  const { tp, tc, pageTitle, pageSubtitle } = usePageTranslation('settings')
  const { language, setLanguage, isLoading: languageLoading } = useLanguage()

  // 设置网页标题
  useEffect(() => {
    document.title = `${pageTitle} - Todo for AI`

    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'Todo for AI'
    }
  }, [pageTitle])

  // 加载用户设置
  useEffect(() => {
    loadUserSettings()
  }, [])

  const inAppEventOptions = useMemo(
    () => eventCatalog.filter((item) => item.supports_in_app).map((item) => ({
      label: `${item.title}（${item.event_type}）`,
      value: item.event_type,
    })),
    [eventCatalog],
  )

  const loadUserSettings = async () => {
    try {
      const response = await apiClient.get('/user-settings')
      const notificationPreferences = (response as any).settings_data?.notification_preferences || {}
      setSettings(response as any)
      form.setFieldsValue({
        language: (response as any).language || language,
        in_app_enabled: notificationPreferences.in_app_enabled !== false,
        disabled_events: notificationPreferences.disabled_events || [],
      })
    } catch (error) {
      console.error('Failed to load user settings:', error)
      // 设置默认值为当前语言
      form.setFieldsValue({
        language: language,
        in_app_enabled: true,
        disabled_events: [],
      })
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      // 如果语言发生变化，使用语言上下文来更新
      if (values.language !== language) {
        await setLanguage(values.language as SupportedLanguage)
      }

      await apiClient.put('/user-settings', {
        language: values.language,
        settings_data: {
          notification_preferences: {
            in_app_enabled: values.in_app_enabled !== false,
            disabled_events: values.disabled_events || [],
          },
        },
      })

      message.success(tp('messages.saveSuccess'))
      setSettings({ ...settings, ...values })
    } catch (error) {
      console.error('Failed to save settings:', error)
      message.error(tp('messages.saveError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          {pageTitle}
        </Title>
        <Paragraph className="page-description">
          {pageSubtitle}
        </Paragraph>
      </div>

      <Card title={tp('sections.general')}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            language: language,
          }}
        >
          <Form.Item
            label={tp('language.title')}
            name="language"
            help={tp('language.description')}
          >
            <Select style={{ width: 200 }} loading={languageLoading}>
              <Option value="zh-CN">{tp('language.options.zh-CN')}</Option>
              <Option value="en">{tp('language.options.en')}</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading || languageLoading}
            >
              {tc('actions.save')}
            </Button>
          </Form.Item>

          <Card title="站内通知偏好" style={{ marginTop: 16 }}>
            <Form.Item
              label="启用站内通知"
              name="in_app_enabled"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="关闭以下事件"
              name="disabled_events"
              extra="勾选后表示这些事件不会出现在你的站内通知中心。"
            >
              <Checkbox.Group options={inAppEventOptions} />
            </Form.Item>
          </Card>
        </Form>
      </Card>

      {user?.id ? (
        <div style={{ marginTop: 16 }}>
          <NotificationChannelManager
            scopeType="user"
            scopeId={user.id}
            title="个人外部通知渠道"
            description="把属于你的通知同步到个人飞书、企业微信、钉钉或通用 Webhook。"
          />
        </div>
      ) : null}
    </div>
  )
}

export default Settings
