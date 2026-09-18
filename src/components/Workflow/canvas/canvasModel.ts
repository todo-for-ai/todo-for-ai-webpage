import type {
  CreateWorkflowStepData,
  WorkflowIntegrationConfig,
  WorkflowItem,
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

/** 保存前校验：返回第一条错误信息，全部通过返回 null */
export const validateCanvasContent = (
  name: string,
  steps: Pick<CanvasStep, 'step_key' | 'integration_config' | 'depends_on'>[],
): string | null => {
  if (!name.trim()) return '工作流名称不能为空'
  const keys = steps.map(s => s.step_key.trim())
  if (keys.some(k => !k) || new Set(keys).size !== keys.length) return '步骤 key 必须非空且唯一'
  for (const s of steps) {
    const integ = s.integration_config
    if (integ?.provider) {
      if (!integ.api_key && !integ.api_key_set) return `步骤 ${s.step_key}：连接器缺少 API Key`
      if (integ.provider === 'coze' && !integ.workflow_id?.trim()) return `步骤 ${s.step_key}：Coze 需要填写工作流 ID`
    }
    for (const dep of s.depends_on ?? []) {
      if (!keys.includes(dep)) return `步骤 ${s.step_key} 依赖了不存在的步骤 ${dep}`
    }
  }
  return null
}

/** steps + 基本信息 → createWorkflow/updateWorkflow 的保存 payload（order 归一化、api_key 仅在新输入时提交） */
export const buildSavePayload = (
  name: string,
  description: string,
  maxParallel: number,
  definition: Record<string, unknown> | undefined,
  steps: CanvasStep[],
): {
  name: string
  description: string
  max_parallel_steps: number
  definition: Record<string, unknown>
  steps: CreateWorkflowStepData[]
} => ({
  name: name.trim(),
  description,
  max_parallel_steps: maxParallel,
  definition: withLayout(definition, steps),
  steps: steps.map((s, i) => {
    const { position, ...rest } = s
    void position
    const integ = rest.integration_config
    return {
      ...rest,
      order: i,
      step_key: s.step_key.trim(),
      integration_config: integ?.provider
        ? { ...integ, api_key: integ.api_key && !integ.api_key_set ? integ.api_key : undefined }
        : null,
    }
  }),
})

/** WorkflowItem → 画布 steps：按 order 排序、套用 definition.layout 坐标，无坐标时 dagre 自动排版 */
export const stepsFromWorkflow = (
  workflow: Pick<WorkflowItem, 'steps' | 'definition'>,
  autoLayoutFn: (steps: CanvasStep[]) => CanvasStep[],
): CanvasStep[] => {
  const layout = readLayout(workflow.definition)
  const base: CanvasStep[] = [...workflow.steps]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(s => ({
      step_key: s.step_key,
      name: s.name,
      description: s.description,
      order: s.order,
      required_capabilities: s.required_capabilities ?? [],
      agent_id: s.agent_id ?? undefined,
      task_template_id: s.task_template_id ?? undefined,
      depends_on: s.depends_on ?? [],
      condition: s.condition ?? null,
      sub_workflow_id: s.sub_workflow_id ?? undefined,
      integration_config: s.integration_config ?? null,
      timeout_seconds: s.timeout_seconds ?? 0,
      retry_count: s.retry_count ?? 0,
      on_failure: (s.on_failure as CanvasStep['on_failure']) ?? 'abort',
      position: layout[s.step_key] ?? { x: 60, y: 60 },
    }))
  const positioned = base.some(s => layout[s.step_key]) ? base : autoLayoutFn(base)
  return positioned.length > 0 ? positioned : [makeBlankStep(1, { x: 80, y: 120 })]
}
