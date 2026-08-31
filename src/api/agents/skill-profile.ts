/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '../client/index.js'

export interface SkillProfileSkill {
  name: string
  kind: 'domain' | 'task_type' | 'capability'
  count: number
  success_rate: number | null
}

export interface AgentSkillProfile {
  skills: SkillProfileSkill[]
  assignments: { completed: number; failed: number }
  experience_count: number
  generated_at: string
}

export interface SkillProfileResponse {
  agent_id: number
  profile: AgentSkillProfile | null
  updated_at: string | null
  stale: boolean | null
}

export const skillProfileApi = {
  async get(agentId: number): Promise<SkillProfileResponse> {
    return await apiClient.get<SkillProfileResponse>(`/agents/${agentId}/skill-profile`)
  },

  async rebuild(agentId: number): Promise<{ agent_id: number; profile: AgentSkillProfile }> {
    return await apiClient.post(`/agents/${agentId}/skill-profile/rebuild`)
  },
}
