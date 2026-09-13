// 沙箱抽屉类型定义（由 SandboxDrawer.tsx 原样迁出）。

export interface SandboxData {
  id: number
  name: string
  description?: string
  agent_id?: number
  security_level: 'strict' | 'moderate' | 'permissive'
  is_active: boolean
  allowed_tools?: string[]
  blocked_tools?: string[]
  allowed_network_hosts?: string[]
  fs_write_paths?: string[]
  fs_read_paths?: string[]
  timeout_seconds?: number
  max_memory_mb?: number
  max_cpu_seconds?: number
  max_output_tokens?: number
  stats?: {
    total_executions?: number
    violations?: number
  }
}

export interface SandboxTemplate {
  key: string
  name: string
  description?: string
  security_level: 'strict' | 'moderate' | 'permissive'
  timeout_seconds?: number
  max_memory_mb?: number
  allowed_tools?: string[]
  blocked_tools?: string[]
}

export interface SandboxExecution {
  id: number
  agent_id: number
  status: string
  tool_calls?: number
  network_calls?: number
  started_at?: string
  ended_at?: string
  peak_memory_mb?: number
  cpu_seconds?: number
  termination_reason?: string
  output_summary?: string
  violations?: Array<{
    violation_type: string
    blocked_at: string
    attempted_action: string
    detail?: string
  }>
}

export interface SandboxFormData {
  name: string
  description?: string
  agent_id?: number
  security_level: 'strict' | 'moderate' | 'permissive'
  allowed_tools: string[]
  blocked_tools: string[]
  allowed_network_hosts: string[]
  fs_write_paths: string[]
  fs_read_paths: string[]
  timeout_seconds: number
  max_memory_mb: number
  max_cpu_seconds: number
  max_output_tokens: number
}

export interface SandboxCheckFormData {
  sandbox_id: number
  action: 'tool' | 'network' | 'fs_write'
  target: string
}

export interface SandboxStartFormData {
  sandbox_id: number
  agent_id?: number
  run_id?: number
  step_run_id?: number
}

export interface SandboxViolationFormData {
  execution_id: number
  violation_type: string
  attempted_action: string
  detail: string
  terminate: boolean
}
