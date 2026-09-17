import React from 'react'
import {
  Button, Collapse, Divider, Input, InputNumber, Popconfirm, Radio, Select, Spin, Switch, Tag, Tooltip,
} from 'antd'
import { CaretRightOutlined, DeleteOutlined } from '@ant-design/icons'
import type { CreateWorkflowStepData, WorkflowIntegrationConfig, WorkflowStepTestRunResult } from '../../../api/agents'
import type { CanvasStep } from './canvasModel'
import { CAPABILITY_OPTIONS, INTEGRATION_PROVIDERS } from './canvasModel'

const { TextArea } = Input

interface StepConfigPanelProps {
  step: CanvasStep
  stepKeys: string[]
  agents: { id: number; name: string }[]
  workflows: { id: number; name: string }[]
  onChange: (patch: Partial<CreateWorkflowStepData>) => void
  onRemoveDependency: (dep: string) => void
  onRemove: () => void
  onTestRun?: (stepKey: string) => Promise<WorkflowStepTestRunResult>
}

const CONDITION_OPERATORS = [
  { value: 'succeeded', label: '成功' },
  { value: 'failed', label: '失败' },
  { value: 'skipped', label: '被跳过' },
  { value: 'completed', label: '已完成（成功/失败/跳过）' },
  { value: 'output_equals', label: '输出等于…' },
  { value: 'output_contains', label: '输出包含…' },
  { value: 'output_not_contains', label: '输出不包含…' },
  { value: 'status_equals', label: '状态等于…' },
]

const labelStyle: React.CSSProperties = { fontSize: 12, color: '#8c8c8c', margin: '8px 0 4px' }

const StepConfigPanel: React.FC<StepConfigPanelProps> = ({
  step, stepKeys, agents, workflows, onChange, onRemoveDependency, onRemove, onTestRun,
}) => {
  const [testRunning, setTestRunning] = React.useState(false)
  const [testResult, setTestResult] = React.useState<WorkflowStepTestRunResult | null>(null)
  const integration = step.integration_config ?? null
  const inputsText = integration?.inputs ? JSON.stringify(integration.inputs, null, 2) : ''

  const patchIntegration = (patch: Partial<WorkflowIntegrationConfig>) => {
    onChange({ integration_config: { ...(integration ?? {}), ...patch } as WorkflowIntegrationConfig })
  }

  const handleProvider = (provider: WorkflowIntegrationConfig['provider']) => {
    const next: WorkflowIntegrationConfig = { ...(integration ?? {}), provider }
    if (provider === 'coze' && !next.workflow_id) next.workflow_id = ''
    onChange({ integration_config: next })
  }

  const toggleIntegration = (enabled: boolean) => {
    if (!enabled) {
      onChange({ integration_config: null })
      return
    }
    onChange({ integration_config: { provider: 'dify', inputs: {} } })
  }

  const handleInputsText = (text: string) => {
    if (!text.trim()) {
      patchIntegration({ inputs: {} })
      return
    }
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        patchIntegration({ inputs: parsed })
      }
    } catch {
      // 输入过程中的临时非法 JSON 不打断编辑
    }
  }

  return (
    <div style={{ padding: '12px 14px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>步骤配置</div>

      <div style={labelStyle}>step_key（唯一标识，不可改）</div>
      <Input value={step.step_key} disabled style={{ fontFamily: 'monospace' }} />

      <div style={labelStyle}>名称</div>
      <Input value={step.name} onChange={e => onChange({ name: e.target.value })} placeholder="步骤显示名" />

      <div style={labelStyle}>描述（将作为该步 Agent 任务的指令正文）</div>
      <TextArea rows={3} value={step.description} onChange={e => onChange({ description: e.target.value })} />

      <div style={labelStyle}>上游依赖（画布连线维护，可在此移除）</div>
      <div>
        {(step.depends_on ?? []).length === 0 && <span style={{ color: '#bfbfbf', fontSize: 12 }}>无（入口步骤）</span>}
        {(step.depends_on ?? []).map(dep => (
          <Tag key={dep} closable onClose={() => onRemoveDependency(dep)} color="blue">{dep}</Tag>
        ))}
      </div>

      <div style={labelStyle}>指定 Agent（留空则按能力自动选择）</div>
      <Select
        allowClear style={{ width: '100%' }} placeholder="自动匹配"
        value={step.agent_id ?? undefined}
        options={agents.map(a => ({ value: a.id, label: `#${a.id} ${a.name}` }))}
        onChange={v => onChange({ agent_id: v ?? undefined })}
      />

      <div style={labelStyle}>要求能力</div>
      <Select
        mode="multiple" style={{ width: '100%' }} placeholder="如：代码审查、测试"
        value={step.required_capabilities ?? []}
        options={CAPABILITY_OPTIONS}
        onChange={v => onChange({ required_capabilities: v })}
      />

      <div style={labelStyle}>失败策略 / 超时 / 重试</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Select
          style={{ width: '40%' }} value={step.on_failure ?? 'abort'}
          options={[
            { value: 'abort', label: '中止工作流' },
            { value: 'skip', label: '跳过下游' },
            { value: 'continue', label: '忽略继续' },
          ]}
          onChange={v => onChange({ on_failure: v })}
        />
        <Tooltip title="超时秒数，0 = 不限">
          <InputNumber style={{ width: '30%' }} min={0} value={step.timeout_seconds ?? 0}
            onChange={v => onChange({ timeout_seconds: v ?? 0 })} addonAfter="s" />
        </Tooltip>
        <InputNumber style={{ width: '30%' }} min={0} max={10} value={step.retry_count ?? 0}
          onChange={v => onChange({ retry_count: v ?? 0 })} addonBefore="重试" />
      </div>

      <div style={labelStyle}>子工作流（该步改为启动另一个工作流）</div>
      <Select
        allowClear style={{ width: '100%' }} placeholder="无"
        value={step.sub_workflow_id ?? undefined}
        options={workflows.filter(w => w.name !== undefined).map(w => ({ value: w.id, label: `#${w.id} ${w.name}` }))}
        onChange={v => onChange({ sub_workflow_id: v ?? null })}
      />

      <Divider style={{ margin: '12px 0 4px' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600 }}>外部平台连接器</span>
        <Switch size="small" checked={Boolean(integration?.provider)} onChange={toggleIntegration} />
      </div>
      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
        启用后该步骤改为调用 Dify / Coze 的工作流 API，不再派发本平台 Agent
      </div>

      {integration?.provider && (
        <Collapse
          size="small"
          items={[{
            key: 'integ',
            label: `${INTEGRATION_PROVIDERS.find(p => p.value === integration.provider)?.label} 连接器配置`,
            children: (
              <>
                <Radio.Group
                  size="small" value={integration.provider}
                  onChange={e => handleProvider(e.target.value)}
                  options={INTEGRATION_PROVIDERS.map(p => ({ value: p.value, label: p.label }))}
                  optionType="button"
                />
                <div style={{ fontSize: 11, color: '#8c8c8c', margin: '6px 0' }}>
                  {INTEGRATION_PROVIDERS.find(p => p.value === integration.provider)?.docs}
                </div>

                <div style={labelStyle}>API 地址（留空用官方默认）</div>
                <Input
                  placeholder={integration.provider === 'dify' ? 'https://api.dify.ai/v1' : 'https://api.coze.cn'}
                  value={integration.base_url ?? ''}
                  onChange={e => patchIntegration({ base_url: e.target.value })}
                />

                <div style={labelStyle}>
                  API Key{integration.api_key_set ? '（已配置，留空保持不变）' : ''}
                </div>
                <Input.Password
                  placeholder={integration.api_key_set ? '••••••••（保持已配置的 Key）' : integration.provider === 'dify' ? 'app-...' : 'pat_...'}
                  value={integration.api_key && !integration.api_key_set ? integration.api_key : ''}
                  onChange={e => patchIntegration({ api_key: e.target.value })}
                  autoComplete="new-password"
                />

                {integration.provider === 'coze' && (
                  <>
                    <div style={labelStyle}>工作流 ID（coze 必填）</div>
                    <Input
                      placeholder="7xxxxxxx…" value={integration.workflow_id ?? ''}
                      onChange={e => patchIntegration({ workflow_id: e.target.value })}
                    />
                  </>
                )}

                <div style={labelStyle}>输入参数（JSON 对象，值支持 {'{{step_result_x}}'} 等占位符）</div>
                <TextArea
                  rows={4} style={{ fontFamily: 'monospace', fontSize: 12 }}
                  value={inputsText}
                  onChange={e => handleInputsText(e.target.value)}
                  placeholder={'{\n  "query": "{{step_result_research}}",\n  "topic": "{{context.topic}}"\n}'}
                />
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                  占位符：{'{{step_result_上游key}}'} 上游输出 · {'{{context.名}}'} 运行参数 · {'{{root_task_title}}'} · {'{{run_id}}'}
                </div>

                <div style={labelStyle}>连接器超时秒数（默认 100）</div>
                <InputNumber
                  style={{ width: '100%' }} min={1} max={600}
                  value={integration.timeout_seconds}
                  onChange={v => patchIntegration({ timeout_seconds: v ?? undefined })}
                />
              </>
            ),
          }]}
        />
      )}

      <Divider style={{ margin: '12px 0 4px' }} />
      <div style={labelStyle}>条件执行（可选，不满足则跳过本步）</div>
      {step.condition ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <Select
              style={{ width: '45%' }} size="small" placeholder="上游步骤"
              value={step.condition.step_key}
              options={stepKeys.filter(k => k !== step.step_key).map(k => ({ value: k, label: k }))}
              onChange={v => onChange({ condition: { ...step.condition!, step_key: v } })}
            />
            <Select
              style={{ flex: 1 }} size="small" value={step.condition.operator}
              options={CONDITION_OPERATORS}
              onChange={v => onChange({ condition: { ...step.condition!, operator: v } })}
            />
          </div>
          {['output_equals', 'output_contains', 'output_not_contains', 'status_equals'].includes(step.condition.operator) && (
            <Input
              size="small" placeholder="比较值"
              value={String(step.condition.value ?? '')}
              onChange={e => onChange({ condition: { ...step.condition!, value: e.target.value } })}
            />
          )}
          <Button size="small" type="text" danger style={{ alignSelf: 'flex-start' }}
            onClick={() => onChange({ condition: null })}>移除条件</Button>
        </div>
      ) : (
        <Button size="small" onClick={() => {
          const dep = (step.depends_on ?? [])[0] ?? stepKeys.find(k => k !== step.step_key) ?? ''
          if (dep) onChange({ condition: { step_key: dep, operator: 'succeeded' } })
        }} disabled={stepKeys.length < 2}>添加条件</Button>
      )}

      <Divider style={{ margin: '12px 0 8px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Button
          size="small" type="primary" ghost icon={<CaretRightOutlined />}
          loading={testRunning}
          disabled={!onTestRun}
          onClick={async () => {
            if (!onTestRun) return
            setTestRunning(true)
            setTestResult(null)
            try {
              setTestResult(await onTestRun(step.step_key))
            } finally {
              setTestRunning(false)
            }
          }}
        >测试运行</Button>
        <Popconfirm title="确定删除该步骤？" onConfirm={onRemove}>
          <Button size="small" danger icon={<DeleteOutlined />}>删除步骤</Button>
        </Popconfirm>
      </div>
      {testRunning && <Spin size="small" />}
      {testResult && (
        <div style={{
          border: '1px solid #d9d9d9', borderRadius: 6, padding: 8,
          fontSize: 12, background: '#fff', maxHeight: 220, overflowY: 'auto',
        }}>
          {testResult.mode === 'agent_preview' ? (
            <>
              <div style={{ color: '#1677ff', marginBottom: 4 }}>
                预览 · 将派给 {testResult.agent ? `#${testResult.agent.id} ${testResult.agent.name}` : '（无可用 Agent）'}
              </div>
              <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {testResult.task_preview?.content || '（空内容）'}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: testResult.ok ? '#52c41a' : '#ff4d4f', marginBottom: 4 }}>
                {testResult.provider} 调用{testResult.ok ? '成功' : '失败'}{testResult.error ? `：${testResult.error}` : ''}
              </div>
              <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {testResult.output || '（无输出）'}
              </div>
            </>
          )}
          {testResult.note && <div style={{ color: '#8c8c8c', marginTop: 4 }}>{testResult.note}</div>}
        </div>
      )}
    </div>
  )
}

export default StepConfigPanel
