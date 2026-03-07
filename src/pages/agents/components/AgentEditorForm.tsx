import { useEffect } from 'react'
import { Button, Card, Form, Input, InputNumber, Select, Space, Switch, Tabs, message } from 'antd'
import type { Agent, AgentStatus } from '../../../api/agents'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import type { AgentFormPayload, AgentFormValues } from './agentFormTypes'

interface WorkspaceOption {
  label: string
  value: number
}

interface AgentEditorFormProps {
  mode: 'create' | 'edit'
  title: string
  submitText: string
  loading?: boolean
  submitting?: boolean
  workspaces: WorkspaceOption[]
  workspaceId: number | null
  lockWorkspace?: boolean
  agent?: Agent | null
  onWorkspaceChange: (workspaceId: number) => void
  onCancel: () => void
  onSubmit: (payload: AgentFormPayload) => Promise<void>
}

function splitTags(raw?: string): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitProjectIds(raw?: string): number[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0)
}

function parseJsonField(rawValue: string | undefined, label: string): Record<string, any> {
  if (!rawValue || !rawValue.trim()) {
    return {}
  }

  const parsed = JSON.parse(rawValue)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${label} must be a JSON object`)
  }
  return parsed
}

function stringifyJson(value?: Record<string, any>) {
  return value && Object.keys(value).length > 0 ? JSON.stringify(value, null, 2) : ''
}

function toInitialValues(agent?: Agent | null): AgentFormValues {
  return {
    name: agent?.name || '',
    display_name: agent?.display_name || '',
    avatar_url: agent?.avatar_url || '',
    homepage_url: agent?.homepage_url || '',
    contact_email: agent?.contact_email || '',
    description: agent?.description || '',
    status: (agent?.status || 'active') as AgentStatus,
    capability_tags_text: (agent?.capability_tags || []).join(', '),
    allowed_project_ids_text: (agent?.allowed_project_ids || []).join(', '),
    llm_provider: agent?.llm_provider || '',
    llm_model: agent?.llm_model || '',
    temperature: agent?.temperature ?? 0.7,
    top_p: agent?.top_p ?? 1,
    max_output_tokens: agent?.max_output_tokens ?? undefined,
    context_window_tokens: agent?.context_window_tokens ?? undefined,
    reasoning_mode: agent?.reasoning_mode || 'balanced',
    max_concurrency: agent?.max_concurrency ?? 1,
    max_retry: agent?.max_retry ?? 2,
    timeout_seconds: agent?.timeout_seconds ?? 1800,
    heartbeat_interval_seconds: agent?.heartbeat_interval_seconds ?? 20,
    system_prompt: agent?.system_prompt || '',
    soul_markdown: agent?.soul_markdown || '',
    response_style_json: stringifyJson(agent?.response_style),
    tool_policy_json: stringifyJson(agent?.tool_policy),
    memory_policy_json: stringifyJson(agent?.memory_policy),
    handoff_policy_json: stringifyJson(agent?.handoff_policy),
    execution_mode: agent?.execution_mode || 'external_pull',
    runner_enabled: agent?.runner_enabled ?? false,
    sandbox_profile: agent?.sandbox_profile || 'standard',
    sandbox_policy_json: stringifyJson(agent?.sandbox_policy),
    change_summary: '',
  }
}

export function AgentEditorForm({
  mode,
  title,
  submitText,
  loading,
  submitting,
  workspaces,
  workspaceId,
  lockWorkspace,
  agent,
  onWorkspaceChange,
  onCancel,
  onSubmit,
}: AgentEditorFormProps) {
  const { tp } = usePageTranslation('agents')
  const [form] = Form.useForm<AgentFormValues>()

  const statusOptions = [
    { label: tp('form.status.active'), value: 'active' },
    { label: tp('form.status.inactive'), value: 'inactive' },
    { label: tp('form.status.revoked'), value: 'revoked' },
  ]

  const reasoningOptions = [
    { label: tp('form.reasoning.balanced'), value: 'balanced' },
    { label: tp('form.reasoning.fast'), value: 'fast' },
    { label: tp('form.reasoning.deep'), value: 'deep' },
  ]

  useEffect(() => {
    form.setFieldsValue(toInitialValues(agent))
  }, [form, agent])

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ marginBottom: 8 }}>{title}</h2>
            <div style={{ color: '#666' }}>{tp('form.description')}</div>
          </div>

          <Space>
            <Select
              placeholder={tp('form.workspace')}
              value={workspaceId || undefined}
              options={workspaces}
              style={{ minWidth: 260 }}
              onChange={onWorkspaceChange}
              disabled={lockWorkspace}
            />
            <Button onClick={onCancel}>{tp('form.cancel')}</Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!workspaceId}
              onClick={async () => {
                try {
                  const values = await form.validateFields()
                  await onSubmit({
                    name: values.name.trim(),
                    display_name: values.display_name?.trim(),
                    avatar_url: values.avatar_url?.trim(),
                    homepage_url: values.homepage_url?.trim(),
                    contact_email: values.contact_email?.trim(),
                    description: values.description?.trim(),
                    status: mode === 'edit' ? values.status : undefined,
                    capability_tags: splitTags(values.capability_tags_text),
                    allowed_project_ids: splitProjectIds(values.allowed_project_ids_text),
                    llm_provider: values.llm_provider?.trim(),
                    llm_model: values.llm_model?.trim(),
                    temperature: values.temperature,
                    top_p: values.top_p,
                    max_output_tokens: values.max_output_tokens,
                    context_window_tokens: values.context_window_tokens,
                    reasoning_mode: values.reasoning_mode,
                    max_concurrency: values.max_concurrency,
                    max_retry: values.max_retry,
                    timeout_seconds: values.timeout_seconds,
                    heartbeat_interval_seconds: values.heartbeat_interval_seconds,
                    system_prompt: values.system_prompt,
                    soul_markdown: values.soul_markdown,
                    response_style: parseJsonField(values.response_style_json, 'response_style'),
                    tool_policy: parseJsonField(values.tool_policy_json, 'tool_policy'),
                    memory_policy: parseJsonField(values.memory_policy_json, 'memory_policy'),
                    handoff_policy: parseJsonField(values.handoff_policy_json, 'handoff_policy'),
                    execution_mode: values.execution_mode,
                    runner_enabled: values.runner_enabled,
                    sandbox_profile: values.sandbox_profile?.trim(),
                    sandbox_policy: parseJsonField(values.sandbox_policy_json, 'sandbox_policy'),
                    change_summary: values.change_summary?.trim(),
                  })
                } catch (error: any) {
                  if (error instanceof Error) {
                    message.error(error.message)
                  }
                }
              }}
            >
              {submitText}
            </Button>
          </Space>
        </Space>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical">
          <Tabs
            items={[
              {
                key: 'basic',
                label: tp('form.tabs.basic'),
                children: (
                  <>
                    <Form.Item name="name" label={tp('form.fields.name')} rules={[{ required: true, message: tp('form.validation.nameRequired') }]}>
                      <Input placeholder="writer-agent-prod" maxLength={128} />
                    </Form.Item>

                    <Form.Item name="display_name" label={tp('form.fields.displayName')}>
                      <Input placeholder="Creative Writer Bot" maxLength={128} />
                    </Form.Item>

                    <Form.Item name="description" label={tp('form.fields.description')}>
                      <Input.TextArea rows={3} maxLength={500} />
                    </Form.Item>

                    <Form.Item name="avatar_url" label={tp('form.fields.avatarUrl')}>
                      <Input placeholder="https://..." maxLength={512} />
                    </Form.Item>

                    <Form.Item name="homepage_url" label={tp('form.fields.homepageUrl')}>
                      <Input placeholder="https://..." maxLength={512} />
                    </Form.Item>

                    <Form.Item name="contact_email" label={tp('form.fields.contactEmail')}>
                      <Input placeholder="agent@company.com" maxLength={255} />
                    </Form.Item>

                    <Form.Item name="status" label={tp('form.fields.status')}>
                      <Select options={statusOptions} />
                    </Form.Item>

                    <Form.Item name="capability_tags_text" label={tp('form.fields.capabilityTags')}>
                      <Input placeholder="write, review" />
                    </Form.Item>

                    <Form.Item name="allowed_project_ids_text" label={tp('form.fields.allowedProjectIds')}>
                      <Input placeholder="1, 2, 3" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'runtime',
                label: tp('form.tabs.runtime'),
                children: (
                  <>
                    <Form.Item name="llm_provider" label={tp('form.fields.llmProvider')}>
                      <Input placeholder="openai / anthropic / deepseek" maxLength={64} />
                    </Form.Item>

                    <Form.Item name="llm_model" label={tp('form.fields.llmModel')}>
                      <Input placeholder="gpt-5-mini" maxLength={128} />
                    </Form.Item>

                    <Form.Item name="reasoning_mode" label={tp('form.fields.reasoningMode')}>
                      <Select options={reasoningOptions} />
                    </Form.Item>

                    <Form.Item name="temperature" label={tp('form.fields.temperature')}>
                      <InputNumber min={0} max={2} step={0.05} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="top_p" label={tp('form.fields.topP')}>
                      <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="max_output_tokens" label={tp('form.fields.maxOutputTokens')}>
                      <InputNumber min={1} step={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="context_window_tokens" label={tp('form.fields.contextWindowTokens')}>
                      <InputNumber min={1} step={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="max_concurrency" label={tp('form.fields.maxConcurrency')}>
                      <InputNumber min={1} step={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="max_retry" label={tp('form.fields.maxRetry')}>
                      <InputNumber min={0} step={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="timeout_seconds" label={tp('form.fields.timeoutSeconds')}>
                      <InputNumber min={30} step={10} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="heartbeat_interval_seconds" label={tp('form.fields.heartbeatIntervalSeconds')}>
                      <InputNumber min={5} step={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="system_prompt" label={tp('form.fields.systemPrompt')}>
                      <Input.TextArea rows={5} />
                    </Form.Item>

                    <Form.Item name="response_style_json" label={tp('form.fields.responseStyle')}>
                      <Input.TextArea rows={5} placeholder='{"tone":"professional"}' />
                    </Form.Item>

                    <Form.Item name="tool_policy_json" label={tp('form.fields.toolPolicy')}>
                      <Input.TextArea rows={5} placeholder='{"allow": ["search", "shell"]}' />
                    </Form.Item>

                    <Form.Item name="memory_policy_json" label={tp('form.fields.memoryPolicy')}>
                      <Input.TextArea rows={5} placeholder='{"type": "short_term"}' />
                    </Form.Item>

                    <Form.Item name="handoff_policy_json" label={tp('form.fields.handoffPolicy')}>
                      <Input.TextArea rows={5} placeholder='{"allow_handoff": true}' />
                    </Form.Item>

                    <Form.Item name="execution_mode" label={tp('form.fields.executionMode')}>
                      <Select
                        options={[
                          { label: tp('detail.enums.executionMode.external_pull'), value: 'external_pull' },
                          { label: tp('detail.enums.executionMode.managed_runner'), value: 'managed_runner' },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item name="runner_enabled" label={tp('form.fields.runnerEnabled')} valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Form.Item name="sandbox_profile" label={tp('form.fields.sandboxProfile')}>
                      <Input placeholder="standard" maxLength={64} />
                    </Form.Item>

                    <Form.Item name="sandbox_policy_json" label={tp('form.fields.sandboxPolicy')}>
                      <Input.TextArea rows={5} placeholder='{"network_mode":"whitelist","allowed_domains":["api.openai.com"]}' />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'soul',
                label: tp('form.tabs.soul'),
                children: (
                  <>
                    <Form.Item name="soul_markdown" label={tp('form.fields.soulMarkdown')}>
                      <Input.TextArea rows={14} placeholder={'# SOUL\n\n## Identity\nYou are ...\n\n## Boundaries\n- ...'} />
                    </Form.Item>

                    <Form.Item name="change_summary" label={tp('form.fields.changeSummary')}>
                      <Input maxLength={255} />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Card>
    </div>
  )
}
