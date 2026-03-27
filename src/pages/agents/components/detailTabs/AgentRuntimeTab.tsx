import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  InfoCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { agentAutomationApi, type AgentRunnerConfig } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import type { Agent } from '../../../../api/agents'
import './AgentRuntimeTab.css'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface AgentRuntimeTabProps {
  workspaceId: number | null
  agent: Agent
  active: boolean
}

export function AgentRuntimeTab({ workspaceId, agent, active }: AgentRuntimeTabProps) {
  const { tp } = usePageTranslation('agents')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<AgentRunnerConfig | null>(null)
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)

  const loadConfig = useCallback(async () => {
    if (!workspaceId || !active) {
      return
    }
    try {
      setLoading(true)
      const data = await agentAutomationApi.getRunnerConfig(workspaceId, agent.id)
      setConfig(data)
      form.setFieldsValue({
        execution_mode: data.execution_mode,
        runner_enabled: data.runner_enabled,
        sandbox_profile: data.sandbox_profile,
        network_mode: data.sandbox_policy?.network_mode || 'whitelist',
        allowed_domains: data.sandbox_policy?.allowed_domains?.join('\n') || '',
      })
    } catch (error: any) {
      message.error(error?.message || tp('messages.loadFailed', { defaultValue: 'Failed to load runtime config' }))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agent.id, active, form, tp])

  useEffect(() => {
    if (active) {
      void loadConfig()
    }
  }, [active, loadConfig])

  const handleSave = useCallback(async () => {
    if (!workspaceId) {
      return
    }
    try {
      const values = await form.validateFields()
      setSaving(true)

      const allowedDomains = values.allowed_domains
        ? values.allowed_domains.split('\n').map((d: string) => d.trim()).filter(Boolean)
        : []

      await agentAutomationApi.updateRunnerConfig(workspaceId, agent.id, {
        execution_mode: values.execution_mode,
        runner_enabled: values.runner_enabled,
        sandbox_profile: values.sandbox_profile,
        sandbox_policy: {
          network_mode: values.network_mode,
          allowed_domains: allowedDomains,
        },
      })

      message.success(tp('messages.saveSuccess', { defaultValue: 'Runtime config saved successfully' }))
      setIsEditing(false)
      void loadConfig()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || tp('messages.saveFailed', { defaultValue: 'Failed to save runtime config' }))
    } finally {
      setSaving(false)
    }
  }, [workspaceId, agent.id, form, loadConfig, tp])

  // Field label with tooltip helper
  const FieldLabel = useCallback(({ translationKey, tooltipKey }: { translationKey: string; tooltipKey: string }) => {
    const label = tp(`detail.runtime.fields.${translationKey}.label`, { defaultValue: translationKey })
    const tooltip = tp(`detail.runtime.fields.${tooltipKey}.tooltip`, { defaultValue: '' })
    return (
      <Space size={4}>
        <span>{label}</span>
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
          </Tooltip>
        )}
      </Space>
    )
  }, [tp])

  // Execution mode options with descriptions
  const executionModeOptions = useMemo(() => [
    {
      value: 'external_pull',
      label: tp('detail.runtime.fields.executionMode.options.external_pull', { defaultValue: 'External Pull Mode' }),
      description: tp('detail.runtime.fields.executionMode.descriptions.external_pull', {
        defaultValue: 'Agent actively polls the platform API for tasks. Suitable for self-hosted agents.',
      }),
    },
    {
      value: 'managed_runner',
      label: tp('detail.runtime.fields.executionMode.options.managed_runner', { defaultValue: 'Managed Runner Mode' }),
      description: tp('detail.runtime.fields.executionMode.descriptions.managed_runner', {
        defaultValue: 'Platform pushes tasks to the agent via webhook. Requires the agent to be reachable from the internet.',
      }),
    },
  ], [tp])

  // Sandbox profile options with descriptions
  const sandboxProfileOptions = useMemo(() => [
    {
      value: 'strict',
      label: tp('detail.runtime.fields.sandboxProfile.options.strict', { defaultValue: 'Strict Isolation (nsjail)' }),
      description: tp('detail.runtime.fields.sandboxProfile.descriptions.strict', {
        defaultValue: 'Full system isolation using nsjail. Blocks all system calls except whitelisted ones. Recommended for untrusted code.',
      }),
    },
    {
      value: 'standard',
      label: tp('detail.runtime.fields.sandboxProfile.options.standard', { defaultValue: 'Standard (RestrictedPython)' }),
      description: tp('detail.runtime.fields.sandboxProfile.descriptions.standard', {
        defaultValue: 'Python-level restrictions using RestrictedPython. Prevents dangerous Python operations while maintaining performance.',
      }),
    },
    {
      value: 'permissive',
      label: tp('detail.runtime.fields.sandboxProfile.options.permissive', { defaultValue: 'Permissive (Basic)' }),
      description: tp('detail.runtime.fields.sandboxProfile.descriptions.permissive', {
        defaultValue: 'Minimal isolation. Only basic resource limits applied. Suitable for trusted internal scripts.',
      }),
    },
  ], [tp])

  // Network mode options with descriptions
  const networkModeOptions = useMemo(() => [
    {
      value: 'whitelist',
      label: tp('detail.runtime.fields.networkMode.options.whitelist', { defaultValue: 'Whitelist Mode' }),
      description: tp('detail.runtime.fields.networkMode.descriptions.whitelist', {
        defaultValue: 'Only allows connections to explicitly listed domains. Most secure option.',
      }),
    },
    {
      value: 'isolated',
      label: tp('detail.runtime.fields.networkMode.options.isolated', { defaultValue: 'Complete Isolation' }),
      description: tp('detail.runtime.fields.networkMode.descriptions.isolated', {
        defaultValue: 'Blocks all network access. Code cannot make any external connections.',
      }),
    },
    {
      value: 'full',
      label: tp('detail.runtime.fields.networkMode.options.full', { defaultValue: 'Full Access' }),
      description: tp('detail.runtime.fields.networkMode.descriptions.full', {
        defaultValue: 'Unrestricted network access. Use with caution.',
      }),
    },
  ], [tp])

  const statusBadge = useMemo(() => {
    if (!config) return null
    return config.runner_enabled ? (
      <Badge
        status="success"
        text={tp('detail.runtime.fields.runnerEnabled.enabled', { defaultValue: 'Enabled - Platform manages task execution' })}
      />
    ) : (
      <Badge
        status="default"
        text={tp('detail.runtime.fields.runnerEnabled.disabled', { defaultValue: 'Disabled - Self-managed execution' })}
      />
    )
  }, [config, tp])

  // Get display labels for view mode
  const getExecutionModeDisplay = useCallback((mode?: string) => {
    const option = executionModeOptions.find(o => o.value === mode)
    return option?.label || mode || '-'
  }, [executionModeOptions])

  const getSandboxProfileDisplay = useCallback((profile?: string) => {
    const option = sandboxProfileOptions.find(o => o.value === profile)
    return option?.label || profile || '-'
  }, [sandboxProfileOptions])

  const getNetworkModeDisplay = useCallback((mode?: string) => {
    const option = networkModeOptions.find(o => o.value === mode)
    return option?.label || mode || '-'
  }, [networkModeOptions])

  if (loading) {
    return (
      <div className="agent-runtime-tab__loading">
        <Space direction="vertical" align="center">
          <ReloadOutlined spin />
          <Text type="secondary">{tp('detail.runtime.loading', { defaultValue: 'Loading runtime configuration...' })}</Text>
        </Space>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="agent-runtime-tab__empty">
        <Text type="secondary">{tp('detail.runtime.notConfigured', { defaultValue: 'Runtime not configured' })}</Text>
      </div>
    )
  }

  return (
    <div className="agent-runtime-tab">
      <div className="agent-runtime-tab__header">
        <Space align="center" size={16}>
          <div className="agent-runtime-tab__icon-wrapper">
            <ThunderboltOutlined className="agent-runtime-tab__icon" />
          </div>
          <div>
            <Title level={4} className="agent-runtime-tab__title">
              {tp('detail.runtime.title', { defaultValue: 'Runtime Configuration' })}
            </Title>
            <Text type="secondary">
              {tp('detail.runtime.subtitle', { defaultValue: 'Configure how this agent executes tasks' })}
            </Text>
          </div>
        </Space>
        <Space>
          {isEditing ? (
            <>
              <Button onClick={() => { setIsEditing(false); void loadConfig() }}>
                {tp('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
              >
                {tp('actions.save', { defaultValue: 'Save' })}
              </Button>
            </>
          ) : (
            <Button type="primary" onClick={() => setIsEditing(true)}>
              {tp('actions.edit', { defaultValue: 'Edit' })}
            </Button>
          )}
        </Space>
      </div>

      {isEditing ? (
        <Form
          form={form}
          layout="vertical"
          className="agent-runtime-tab__form"
        >
          {/* Execution Settings Card */}
          <Card
            title={
              <Space>
                <span>{tp('detail.runtime.sections.execution', { defaultValue: 'Execution Settings' })}</span>
              </Space>
            }
            className="agent-runtime-tab__card"
          >
            {/* Execution Mode */}
            <Form.Item
              name="execution_mode"
              label={<FieldLabel translationKey="executionMode" tooltipKey="executionMode" />}
              rules={[{ required: true, message: 'Please select execution mode' }]}
            >
              <Radio.Group className="agent-runtime-tab__radio-group">
                <Space direction="vertical" size={16}>
                  {executionModeOptions.map(option => (
                    <Radio key={option.value} value={option.value} className="agent-runtime-tab__radio">
                      <div className="agent-runtime-tab__radio-content">
                        <div className="agent-runtime-tab__radio-label">{option.label}</div>
                        <div className="agent-runtime-tab__radio-description">{option.description}</div>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* Runner Enabled */}
            <Form.Item
              name="runner_enabled"
              label={<FieldLabel translationKey="runnerEnabled" tooltipKey="runnerEnabled" />}
              valuePropName="checked"
              className="agent-runtime-tab__switch-item"
            >
              <Switch
                checkedChildren={tp('detail.runtime.status.enabled', { defaultValue: 'Enabled' })}
                unCheckedChildren={tp('detail.runtime.status.disabled', { defaultValue: 'Disabled' })}
              />
            </Form.Item>
          </Card>

          {/* Sandbox Configuration Card */}
          <Card
            title={tp('detail.runtime.sections.sandbox', { defaultValue: 'Sandbox Configuration' })}
            className="agent-runtime-tab__card"
          >
            {/* Sandbox Profile */}
            <Form.Item
              name="sandbox_profile"
              label={<FieldLabel translationKey="sandboxProfile" tooltipKey="sandboxProfile" />}
              rules={[{ required: true }]}
            >
              <Select
                className="agent-runtime-tab__select"
                dropdownRender={menu => (
                  <div className="agent-runtime-tab__select-dropdown">
                    {sandboxProfileOptions.map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        <div className="agent-runtime-tab__select-option">
                          <div className="agent-runtime-tab__select-option-label">{option.label}</div>
                          <div className="agent-runtime-tab__select-option-desc">{option.description}</div>
                        </div>
                      </Select.Option>
                    ))}
                  </div>
                )}
              >
                {sandboxProfileOptions.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Network Mode */}
            <Form.Item
              name="network_mode"
              label={<FieldLabel translationKey="networkMode" tooltipKey="networkMode" />}
            >
              <Select className="agent-runtime-tab__select">
                {networkModeOptions.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    <Tooltip title={option.description} placement="right">
                      <span>{option.label}</span>
                    </Tooltip>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Allowed Domains */}
            <Form.Item
              name="allowed_domains"
              label={<FieldLabel translationKey="allowedDomains" tooltipKey="allowedDomains" />}
              extra={tp('detail.runtime.fields.allowedDomains.help', {
                defaultValue: 'Enter one domain per line. Used when Network Access is set to Whitelist Mode.',
              })}
            >
              <TextArea
                rows={5}
                placeholder={tp('detail.runtime.fields.allowedDomains.placeholder', {
                  defaultValue: 'example.com\napi.example.com',
                })}
                className="agent-runtime-tab__textarea"
              />
            </Form.Item>
          </Card>
        </Form>
      ) : (
        <div className="agent-runtime-tab__view">
          {/* Execution Settings View */}
          <Card
            title={tp('detail.runtime.sections.execution', { defaultValue: 'Execution Settings' })}
            className="agent-runtime-tab__card"
          >
            <Descriptions
              column={1}
              labelStyle={{ width: 180, fontWeight: 500 }}
              contentStyle={{ flex: 1 }}
            >
              <Descriptions.Item
                label={<FieldLabel translationKey="executionMode" tooltipKey="executionMode" />}
              >
                <div className="agent-runtime-tab__value-block">
                  <Tag color="blue" className="agent-runtime-tab__value-tag">
                    {getExecutionModeDisplay(config.execution_mode)}
                  </Tag>
                  <Paragraph className="agent-runtime-tab__value-description">
                    {executionModeOptions.find(o => o.value === config.execution_mode)?.description}
                  </Paragraph>
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label={<FieldLabel translationKey="runnerEnabled" tooltipKey="runnerEnabled" />}
              >
                {statusBadge}
              </Descriptions.Item>

              <Descriptions.Item
                label={<FieldLabel translationKey="configVersion" tooltipKey="configVersion" />}
              >
                <Tag className="agent-runtime-tab__version-tag">v{config.runner_config_version}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Sandbox Configuration View */}
          <Card
            title={tp('detail.runtime.sections.sandbox', { defaultValue: 'Sandbox Configuration' })}
            className="agent-runtime-tab__card"
          >
            <Descriptions
              column={1}
              labelStyle={{ width: 180, fontWeight: 500 }}
              contentStyle={{ flex: 1 }}
            >
              <Descriptions.Item
                label={<FieldLabel translationKey="sandboxProfile" tooltipKey="sandboxProfile" />}
              >
                <div className="agent-runtime-tab__value-block">
                  <Tag
                    color={config.sandbox_profile === 'strict' ? 'red' : config.sandbox_profile === 'standard' ? 'orange' : 'green'}
                    className="agent-runtime-tab__value-tag"
                  >
                    {getSandboxProfileDisplay(config.sandbox_profile)}
                  </Tag>
                  <Paragraph className="agent-runtime-tab__value-description">
                    {sandboxProfileOptions.find(o => o.value === config.sandbox_profile)?.description}
                  </Paragraph>
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label={<FieldLabel translationKey="networkMode" tooltipKey="networkMode" />}
              >
                <div className="agent-runtime-tab__value-block">
                  <Tag
                    color={config.sandbox_policy?.network_mode === 'whitelist' ? 'blue' : config.sandbox_policy?.network_mode === 'isolated' ? 'green' : 'orange'}
                    className="agent-runtime-tab__value-tag"
                  >
                    {getNetworkModeDisplay(config.sandbox_policy?.network_mode)}
                  </Tag>
                  <Paragraph className="agent-runtime-tab__value-description">
                    {networkModeOptions.find(o => o.value === config.sandbox_policy?.network_mode)?.description}
                  </Paragraph>
                </div>
              </Descriptions.Item>
            </Descriptions>

            {/* Allowed Domains */}
            {config.sandbox_policy?.allowed_domains && config.sandbox_policy.allowed_domains.length > 0 && (
              <div className="agent-runtime-tab__domains-section">
                <div className="agent-runtime-tab__domains-header">
                  <FieldLabel translationKey="allowedDomains" tooltipKey="allowedDomains" />
                  <span className="agent-runtime-tab__domains-count">
                    ({config.sandbox_policy.allowed_domains.length})
                  </span>
                </div>
                <div className="agent-runtime-tab__domains-list">
                  {config.sandbox_policy.allowed_domains.map((domain, index) => (
                    <Tag key={index} className="agent-runtime-tab__domain-tag">{domain}</Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default AgentRuntimeTab
