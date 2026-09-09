/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client/index.js'

/** 工作区运行时/编排设置（api-server services/workspace_runtime_policy.py） */
export interface WorkspaceRuntimeSettings {
  max_pods: number
  idle_timeout_minutes: number
  /** 同时干活的 Agent 数上限；0=不限 */
  max_concurrent_agents: number
}

export interface WorkspaceRuntimeSettingsResponse {
  settings: WorkspaceRuntimeSettings
  orchestration: {
    /** 当前「正在干活」的 distinct Agent 数（未过期活跃租约去重） */
    active_agents: number
  }
}

export interface WorkspaceRuntimeSettingsUpdateInput {
  max_pods?: number
  idle_timeout_minutes?: number
  max_concurrent_agents?: number
}

class RuntimeSettingsApi {
  async get(workspaceId: number): Promise<WorkspaceRuntimeSettingsResponse> {
    return await apiClient.get<WorkspaceRuntimeSettingsResponse>(
      `/workspaces/${workspaceId}/runtime/settings`
    )
  }

  async update(
    workspaceId: number,
    input: WorkspaceRuntimeSettingsUpdateInput
  ): Promise<WorkspaceRuntimeSettingsResponse> {
    return await apiClient.put<WorkspaceRuntimeSettingsResponse>(
      `/workspaces/${workspaceId}/runtime/settings`,
      input
    )
  }
}

export const runtimeSettingsApi = new RuntimeSettingsApi()
