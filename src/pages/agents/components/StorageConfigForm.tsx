import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Alert,
  message,
} from 'antd'
import type { StorageConfig, StorageProvider } from '../../../api/storage/types'
import { STORAGE_PROVIDER_OPTIONS } from '../../../api/storage/types'
import { useTranslation } from '../../../i18n/hooks/useTranslation'

interface StorageConfigFormProps {
  mode: 'create' | 'edit'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workspaceId: number
  config?: StorageConfig | null
  onCancel: () => void
  onSubmit: (values: {
    provider: StorageProvider
    is_active: boolean
    local_base_path?: string
    local_base_url?: string
    access_key_id?: string
    access_key_secret?: string
    bucket_name?: string
    region?: string
    endpoint?: string
    custom_domain?: string
  }) => Promise<void>
  loading?: boolean
}

interface FormValues {
  provider: StorageProvider
  is_active: boolean
  local_base_path?: string
  local_base_url?: string
  access_key_id?: string
  access_key_secret?: string
  bucket_name?: string
  region?: string
  endpoint?: string
  custom_domain?: string
}

export function StorageConfigForm({
  mode,
  workspaceId,
  config,
  onCancel,
  onSubmit,
  loading = false,
}: StorageConfigFormProps) {
  const { tc } = useTranslation()
  const [form] = Form.useForm<FormValues>()
  const [provider, setProvider] = useState<StorageProvider>('local')

  const providerOptions = STORAGE_PROVIDER_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        provider: config.provider,
        is_active: config.is_active,
        local_base_path: config.local_base_path,
        local_base_url: config.local_base_url,
        access_key_id: config.access_key_id,
        access_key_secret: config.access_key_secret,
        bucket_name: config.bucket_name,
        region: config.region,
        endpoint: config.endpoint,
        custom_domain: config.custom_domain,
      })
      setProvider(config.provider)
    } else {
      form.setFieldsValue({
        provider: 'local',
        is_active: false,
      })
      setProvider('local')
    }
  }, [config, form])

  const handleProviderChange = (value: StorageProvider) => {
    setProvider(value)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await onSubmit(values)
    } catch (error: any) {
      if (error?.errorFields) {
        message.error(tc('form.validation.error'))
      }
    }
  }

  // 根据存储类型渲染不同配置字段
  const renderConfigFields = () => {
    switch (provider) {
      case 'local':
        return (
          <>
            <Form.Item
              name="local_base_path"
              label={tc('storage:form.fields.localBasePath')}
              rules={[{ required: true, message: tc('storage:form.validation.localBasePathRequired') }]}
            >
              <Input placeholder="/data/uploads" />
            </Form.Item>
            <Form.Item
              name="local_base_url"
              label={tc('storage:form.fields.localBaseUrl')}
              rules={[{ required: true, message: tc('storage:form.validation.localBaseUrlRequired') }]}
            >
              <Input placeholder="https://example.com/uploads" />
            </Form.Item>
          </>
        )

      case 'oss':
      case 'cos':
      case 's3':
        return (
          <>
            <Form.Item
              name="access_key_id"
              label={tc('storage:form.fields.accessKeyId')}
              rules={[{ required: true, message: tc('storage:form.validation.accessKeyIdRequired') }]}
            >
              <Input placeholder="Access Key ID" />
            </Form.Item>
            <Form.Item
              name="access_key_secret"
              label={tc('storage:form.fields.accessKeySecret')}
              rules={[{ required: true, message: tc('storage:form.validation.accessKeySecretRequired') }]}
            >
              <Input.Password placeholder="Access Key Secret" />
            </Form.Item>
            <Form.Item
              name="bucket_name"
              label={tc('storage:form.fields.bucketName')}
              rules={[{ required: true, message: tc('storage:form.validation.bucketNameRequired') }]}
            >
              <Input placeholder="bucket-name" />
            </Form.Item>
            <Form.Item
              name="region"
              label={tc('storage:form.fields.region')}
              rules={[{ required: true, message: tc('storage:form.validation.regionRequired') }]}
            >
              <Input placeholder={provider === 'oss' ? 'oss-cn-hangzhou' : provider === 'cos' ? 'ap-beijing' : 'us-east-1'} />
            </Form.Item>
            <Form.Item
              name="endpoint"
              label={tc('storage:form.fields.endpoint')}
            >
              <Input placeholder={provider === 'oss' ? 'https://oss-cn-hangzhou.aliyuncs.com' : ''} />
            </Form.Item>
            <Form.Item
              name="custom_domain"
              label={tc('storage:form.fields.customDomain')}
            >
              <Input placeholder="https://cdn.example.com" />
            </Form.Item>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Card
      title={mode === 'create' ? tc('storage:form.title.create') : tc('storage:form.title.edit')}
      loading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="provider"
          label={tc('storage:form.fields.provider')}
          rules={[{ required: true }]}
        >
          <Select
            options={providerOptions}
            onChange={handleProviderChange}
            disabled={mode === 'edit'}
          />
        </Form.Item>

        <Form.Item
          name="is_active"
          label={tc('storage:form.fields.isActive')}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Alert
          message={tc('storage:form.hint.activate.title')}
          description={tc('storage:form.hint.activate.description')}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {renderConfigFields()}

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space>
            <Button onClick={onCancel}>
              {tc('actions.cancel')}
            </Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              {mode === 'create' ? tc('actions.create') : tc('actions.save')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
