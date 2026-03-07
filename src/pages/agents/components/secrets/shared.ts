import type { AgentSecretScopeType, AgentSecretTargetSelector, AgentSecretType } from '../../../../api/agents'

export const secretTypeOptions: Array<{ label: string; value: AgentSecretType }> = [
  { label: 'API Key', value: 'api_key' },
  { label: 'OAuth Token', value: 'oauth_token' },
  { label: 'Session Cookie', value: 'session_cookie' },
  { label: 'Webhook Secret', value: 'webhook_secret' },
  { label: 'Custom', value: 'custom' },
]

export const scopeTypeOptions: Array<{ label: string; value: AgentSecretScopeType }> = [
  { label: 'Agent Private', value: 'agent_private' },
  { label: 'Project Shared', value: 'project_shared' },
  { label: 'Workspace Shared', value: 'workspace_shared' },
]

export const scopeColorMap: Record<string, string> = {
  agent_private: 'blue',
  project_shared: 'orange',
  workspace_shared: 'purple',
}

export const shareSelectorOptions: Array<{ label: string; value: AgentSecretTargetSelector }> = [
  { label: 'Manual Agent Select', value: 'manual' },
  { label: 'All Active Agents In Project', value: 'project_agents' },
  { label: 'All Active Agents In Workspace', value: 'workspace_active' },
]

export interface CreateSecretFormState {
  name: string
  value: string
  type: AgentSecretType
  scopeType: AgentSecretScopeType
  projectId: number | null
  description: string
}

export const defaultCreateSecretFormState: CreateSecretFormState = {
  name: '',
  value: '',
  type: 'api_key',
  scopeType: 'agent_private',
  projectId: null,
  description: '',
}

export interface RevealedSecretState {
  name: string
  value: string
}

export interface ShareSecretFormState {
  targetSelector: AgentSecretTargetSelector
  selectorProjectId: number | null
  agentIds: number[]
  reason: string
  expiresAt: string
}

export const defaultShareSecretFormState: ShareSecretFormState = {
  targetSelector: 'manual',
  selectorProjectId: null,
  agentIds: [],
  reason: '',
  expiresAt: '',
}
