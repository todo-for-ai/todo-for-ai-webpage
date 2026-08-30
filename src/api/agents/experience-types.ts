/**
 * Agent API — experience/knowledge-related type definitions.
 *
 * Experiences, knowledge entries, decay analysis, confidence distribution,
 * and cross-project authorization types.
 */

// ── Experiences stats ────────────────────────────────────────────────

export interface ExperiencesStats {
  total: number
  by_domain: Record<string, number>
  by_task_type: Record<string, number>
  by_experience_type: Record<string, number>
  shared: number
  total_reuses: number
  avg_confidence: number | null
  by_confidence_bucket: Record<string, number>
  top_reused: ExperiencesTopReusedItem[]
  by_domain_tasktype: Record<string, Record<string, number>>
  by_domain_reuses: Record<string, number>
  by_task_type_reuses: Record<string, number>
  by_experience_type_reuses: Record<string, number>
}

export interface ExperiencesTopReusedItem {
  id: number
  domain: string
  task_type: string | null
  experience_type: string
  times_reused: number
  confidence: number | null
  key_learnings: string
}

export interface ExperiencesLowConfidenceItem {
  id: number
  agent_id: number
  domain: string
  task_type: string | null
  experience_type: string
  confidence: number | null
  times_reused: number
  key_learnings: string
}

export interface ExperiencesLowConfidence {
  max_confidence: number
  items: ExperiencesLowConfidenceItem[]
}

export interface ExperiencesScatterPoint {
  id: number
  domain: string
  task_type: string
  experience_type: string
  times_reused: number
  confidence: number | null
}

export interface ExperiencesScatter {
  points: ExperiencesScatterPoint[]
  max_reuses: number
}

export interface ExperiencesReuseTrendBucket {
  date: string
  reused: number
  reuse_count: number
  avg_confidence: number
  decayed: number
}

export interface ExperiencesReuseTrend {
  trend: ExperiencesReuseTrendBucket[]
  total_reused: number
  total_reuse_count: number
  decayed_count: number
  total_experiences: number
}

export interface ExperiencesConfidenceDecayForecast {
  trend: { date: string; avg_confidence: number }[]
  forecast: { date: string; predicted_confidence: number }[]
  slope: number
  r_squared: number
  days_to_decay: number | null
}

export interface ExperiencesDecayByDomainItem {
  domain: string
  total: number
  active: number
  decayed: number
  avg_confidence: number
  reuses: number
}

export interface ExperiencesDecayByDomain {
  domains: ExperiencesDecayByDomainItem[]
  total_active: number
  total_decayed: number
}

export interface ExperiencesDecayByTaskTypeItem {
  task_type: string
  total: number
  active: number
  decayed: number
  avg_confidence: number
  reuses: number
}

export interface ExperiencesDecayByTaskType {
  task_types: ExperiencesDecayByTaskTypeItem[]
  total_active: number
  total_decayed: number
}

export interface ExperiencesConfidenceBin {
  label: string
  range_low: number
  range_high: number
  count: number
  percentage: number
  avg_reuses: number
}

export interface ExperiencesConfidenceDistribution {
  bins: ExperiencesConfidenceBin[]
  total: number
}

export interface ExperiencesSourceItem {
  source: string
  count: number
  percentage: number
  avg_confidence: number
  avg_reuses: number
}

export interface ExperiencesSourceDistribution {
  sources: ExperiencesSourceItem[]
  total: number
}

export interface ExperiencesPropagationChainItem {
  source_agent_id: number
  source_agent_name: string
  shared_count: number
  total_reuses: number
  top_domains: string[]
  top_experiences: { id: number; domain: string | null; experience_type: string; times_reused: number; confidence: number | null }[]
}

export interface ExperiencesPropagationChain {
  chains: ExperiencesPropagationChainItem[]
  total_shared: number
  total_propagated: number
}

export interface SkillCoverageAgent {
  agent_id: number
  name: string
  scores: number[]
  total_experiences: number
}

export interface ExperiencesSkillCoverageRadar {
  agents: SkillCoverageAgent[]
  domain_labels: string[]
  max_count: number
}

// ── Experiences decay alerts ─────────────────────────────────────────

export interface ExperiencesDecayAlert {
  agent_id: number
  agent_name: string
  older_avg_confidence: number
  newer_avg_confidence: number
  drop: number
  older_count: number
  newer_count: number
  current_confidence: number
  recommendation: 'review_recent_experiences' | 'monitor'
}

export interface AgentExperiencesDecayAlerts {
  alerts: ExperiencesDecayAlert[]
  total_alerts: number
  days: number
  min_drop: number
}

// ── Cross-project authorization ──────────────────────────────────────

export interface CrossProjectAuthEfficiency {
  authorization_id: number
  agent_id: number
  agent_name: string
  host_project_id: number
  host_project_name: string
  tasks_completed_in_host: number
  is_active: boolean
  expires_at: string | null
  utilized: boolean
}

export interface AgentCrossProjectEfficiency {
  authorizations: CrossProjectAuthEfficiency[]
  total_authorizations: number
  active_count: number
  utilized_count: number
  idle_count: number
  utilization_rate: number
  days: number
}
