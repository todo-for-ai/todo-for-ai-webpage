import { useEffect, useState } from 'react'
import { Card, Form, Input, Select, Button, message, InputNumber, Space, Alert, Typography } from 'antd'
import { SaveOutlined, ApiOutlined, ExperimentOutlined } from '@ant-design/icons'
import { apiClient } from '../api'
import { useAuthStore } from '../stores/useAuthStore'

const { Title, Paragraph } = Typography
const { Option } = Select

// LLM 提供商选项
const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', description: 'OpenAI GPT 系列模型' },
  { value: 'azure', label: 'Azure OpenAI', description: '微软 Azure OpenAI 服务' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude 系列模型' },
  { value: 'ollama', label: 'Ollama', description: '本地部署的开源模型' },
  { value: 'custom', label: '自定义', description: '兼容 OpenAI API 格式的自定义服务' },
]

// 默认模型选项
const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  azure: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  ollama: ['llama2', 'mistral', 'codellama'],
  custom: ['custom-model'],
}

// 默认 API Base URL
const DEFAULT_API_BASE: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  azure: 'https://<your-resource>.openai.azure.com/openai',
  anthropic: 'https://api.anthropic.com/v1',
  ollama: 'http://localhost:11434',
  custom: 'http://localhost:8000/v1',
}

interface LLMConfig {
  provider: string
  api_base: string
  api_key: string
  model: string
  temperature: number
  max_tokens: number
  timeout: number
}

interface AdminLLMConfigProps {
  isAdmin: boolean
}

const AdminLLMConfig: React.FC<AdminLLMConfigProps> = ({ isAdmin }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [config, setConfig] = useState<LLMConfig | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const { user } = useAuthStore()

  // 加载配置
  useEffect(() => {
    if (isAdmin) {
      loadConfig()
    }
  }, [isAdmin])

  const loadConfig = async () => {
    try {
      const response = await apiClient.get('/system-settings/llm-config')
      const configData = response as LLMConfig
      setConfig(configData)
      form.setFieldsValue(configData)
    } catch (error) {
      console.error('Failed to load LLM config:', error)
      message.error('加载大模型配置失败')
    }
  }

  const handleSave = async (values: LLMConfig) => {
    if (!isAdmin) {
      message.error('需要管理员权限')
      return
    }

    setLoading(true)
    try {
      await apiClient.put('/system-settings/llm-config', values)
      message.success('大模型配置已保存')
      setConfig(values)
      setTestResult(null)
    } catch (error: any) {
      console.error('Failed to save LLM config:', error)
      message.error(error?.message || '保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!isAdmin) {
      message.error('需要管理员权限')
      return
    }

    const values = form.getFieldsValue()
    if (!values.api_base || !values.api_key) {
      message.error('请先填写 API Base URL 和 API Key')
      return
    }

    setTestLoading(true)
    setTestResult(null)
    try {
      const response = await apiClient.post('/system-settings/test-llm', values)
      setTestResult({
        success: true,
        message: response?.message || '连接测试成功',
      })
      message.success('连接测试成功')
    } catch (error: any) {
      console.error('Test failed:', error)
      setTestResult({
        success: false,
        message: error?.message || '连接测试失败',
      })
      message.error(error?.message || '连接测试失败')
    } finally {
      setTestLoading(false)
    }
  }

  const handleProviderChange = (provider: string) => {
    form.setFieldsValue({
      api_base: DEFAULT_API_BASE[provider] || '',
      model: DEFAULT_MODELS[provider]?.[0] || '',
    })
  }

  if (!isAdmin) {
    return (
      <Card>
        <Alert
          type="warning"
          message="需要管理员权限"
          description="大模型 API 配置仅管理员可访问和修改。"
        />
      </Card>
    )
  }

  return (
    <Card
      title={
        <Space>
          <ApiOutlined />
          <span>大模型 API 配置</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<ExperimentOutlined />}
            onClick={handleTest}
            loading={testLoading}
          >
            测试连接
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            保存配置
          </Button>
        </Space>
      }
    >
      <Paragraph type="secondary">
        配置平台使用的 AI 大模型 API。所有 AI 功能（包括 Agent 运行、智能任务处理等）都将基于此配置。
      </Paragraph>

      {testResult && (
        <Alert
          style={{ marginBottom: 16 }}
          type={testResult.success ? 'success' : 'error'}
          message={testResult.success ? '连接测试成功' : '连接测试失败'}
          description={testResult.message}
          closable
          onClose={() => setTestResult(null)}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          provider: 'openai',
          temperature: 0.7,
          max_tokens: 2000,
          timeout: 60,
        }}
      >
        <Form.Item
          label="提供商"
          name="provider"
          rules={[{ required: true, message: '请选择提供商' }]}
        >
          <Select onChange={handleProviderChange}>
            {LLM_PROVIDERS.map((p) => (
              <Option key={p.value} value={p.value}>
                {p.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="API Base URL"
          name="api_base"
          rules={[{ required: true, message: '请输入 API Base URL' }]}
          help="大模型 API 的基础 URL"
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          label="API Key"
          name="api_key"
          rules={[{ required: true, message: '请输入 API Key' }]}
          help="访问大模型 API 的密钥"
        >
          <Input.Password placeholder="sk-..." />
        </Form.Item>

        <Form.Item
          label="模型"
          name="model"
          rules={[{ required: true, message: '请输入模型名称' }]}
          help="使用的模型名称"
        >
          <Input placeholder="gpt-4" />
        </Form.Item>

        <Form.Item
          label="Temperature"
          name="temperature"
          rules={[
            { required: true, message: '请输入 temperature' },
            { type: 'number', min: 0, max: 2, message: '范围 0-2' },
          ]}
          help="控制输出的随机性（0-2，越高越随机）"
        >
          <InputNumber
            min={0}
            max={2}
            step={0.1}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item
          label="Max Tokens"
          name="max_tokens"
          rules={[
            { required: true, message: '请输入 max_tokens' },
            { type: 'number', min: 100, max: 8000, message: '范围 100-8000' },
          ]}
          help="单次请求最大 token 数"
        >
          <InputNumber
            min={100}
            max={8000}
            step={100}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item
          label="Timeout (秒)"
          name="timeout"
          rules={[
            { required: true, message: '请输入 timeout' },
            { type: 'number', min: 10, max: 300, message: '范围 10-300' },
          ]}
          help="API 请求超时时间"
        >
          <InputNumber
            min={10}
            max={300}
            step={10}
            style={{ width: 200 }}
          />
        </Form.Item>
      </Form>

      <Alert
        style={{ marginTop: 24 }}
        type="info"
        message="配置说明"
        description={
          <ul>
            <li>修改配置后，所有 Agent 将在下次运行时使用新的 API 配置</li>
            <li>建议先点击"测试连接"验证配置是否正确</li>
            <li>API Key 将安全存储，仅管理员可见</li>
            <li>使用 Ollama 本地部署时，API Key 可为空</li>
          </ul>
        }
      />
    </Card>
  )
}

export default AdminLLMConfig
