import type {
  CreateWorkflowStepData,
  WorkflowIntegrationConfig,
} from '../../../api/agents'

/** 画布中的步骤 = 定义字段 + 画布坐标（坐标持久化在 workflow.definition.layout） */
export type CanvasStep = CreateWorkflowStepData & {
  position: { x: number; y: number }
}

export const INTEGRATION_PROVIDERS: {
  value: WorkflowIntegrationConfig['provider'] | 'http'
  label: string
  color: string
  docs: string
}[] = [
  {
    value: 'dify',
    label: 'Dify',
    color: 'blue',
    docs: 'Dify 控制台 → 工作流 → API 访问（app- 开头 Key）',
  },
  {
    value: 'coze',
    label: 'Coze',
    color: 'cyan',
    docs: 'Coze 平台 → 工作体 → 发布为 API（PAT 令牌）',
  },
  {
    value: 'http',
    label: 'HTTP',
    color: 'green',
    docs: '调用任意公网 HTTP API（webhook/自动化入口），默认拦截内网地址',
  },
]

export const CAPABILITY_OPTIONS = [
  { value: 'code_review', label: '代码审查' },
  { value: 'testing', label: '测试' },
  { value: 'deployment', label: '部署' },
  { value: 'documentation', label: '文档' },
  { value: 'research', label: '研究' },
  { value: 'coordination', label: '协调' },
  { value: 'frontend', label: '前端' },
  { value: 'backend', label: '后端' },
  { value: 'devops', label: '运维' },
  { value: 'security', label: '安全' },
]

/** 空白新步骤（画布坐标由调用方给定） */
export const makeBlankStep = (index: number, position: { x: number; y: number }): CanvasStep => ({
  step_key: `step_${index}_${Math.random().toString(36).slice(2, 6)}`,
  name: `步骤 ${index}`,
  order: index,
  depends_on: [],
  required_capabilities: [],
  condition: null,
  on_failure: 'abort',
  timeout_seconds: 0,
  retry_count: 0,
  integration_config: null,
  position,
})

/** definition.layout 的存取（坐标随版本快照一起留存） */
export const readLayout = (definition: Record<string, unknown> | undefined) => {
  const layout = (definition?.layout ?? {}) as Record<string, { x: number; y: number }>
  return layout && typeof layout === 'object' ? layout : {}
}

export const withLayout = (
  definition: Record<string, unknown> | undefined,
  steps: CanvasStep[],
): Record<string, unknown> => ({
  ...(definition ?? {}),
  layout: Object.fromEntries(steps.map(s => [s.step_key, s.position])),
})
