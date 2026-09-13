import { useState } from 'react'
import type { AgentCapabilitySupplyDemand, AgentCrossProjectEfficiency, AgentExperiencesDecayAlerts, AgentIdleRanking, AgentRunResourceTrend, AgentSkillMatching, AgentSpecializationEvolution, AgentTaskHandoffStats, AgentWorkloadForecast, KnowledgePropagationNetwork, ProtocolDecisionLatency, TaskAllocationFairness } from '../../../api/agents'
import type { TaskCommentSentimentTrend, TaskDependencyChainAnalysis, TaskReworkAnalysis } from '../../../api/tasks'

/**
 * 深度分析数据集：一批由子卡片自行拉取后回写的 state（数据在卡片组件内加载，
 * 本 hook 只持有数据与 setter）。从 useDashboardData 原样拆出。
 */
export function useAdvancedAnalytics() {
  const [taskAllocationFairness, setTaskAllocationFairness] = useState<TaskAllocationFairness | null>(null)
  const [agentRunResourceTrend, setAgentRunResourceTrend] = useState<AgentRunResourceTrend | null>(null)
  const [depChain, setDepChain] = useState<TaskDependencyChainAnalysis | null>(null)
  const [skillMatching, setSkillMatching] = useState<AgentSkillMatching | null>(null)
  const [commentSentiment, setCommentSentiment] = useState<TaskCommentSentimentTrend | null>(null)
  const [reworkAnalysis, setReworkAnalysis] = useState<TaskReworkAnalysis | null>(null)
  const [handoffStats, setHandoffStats] = useState<AgentTaskHandoffStats | null>(null)
  const [workloadForecast, setWorkloadForecast] = useState<AgentWorkloadForecast | null>(null)
  const [specializationEvo, setSpecializationEvo] = useState<AgentSpecializationEvolution | null>(null)
  const [decayAlerts, setDecayAlerts] = useState<AgentExperiencesDecayAlerts | null>(null)
  const [crossProjEff, setCrossProjEff] = useState<AgentCrossProjectEfficiency | null>(null)
  const [capSupplyDemand, setCapSupplyDemand] = useState<AgentCapabilitySupplyDemand | null>(null)
  const [idleRanking, setIdleRanking] = useState<AgentIdleRanking | null>(null)
  const [propagationNet, setPropagationNet] = useState<KnowledgePropagationNetwork | null>(null)
  const [protocolLatency, setProtocolLatency] = useState<ProtocolDecisionLatency | null>(null)

  return {
    taskAllocationFairness,
    setTaskAllocationFairness,
    agentRunResourceTrend,
    setAgentRunResourceTrend,
    depChain,
    setDepChain,
    skillMatching,
    setSkillMatching,
    commentSentiment,
    setCommentSentiment,
    reworkAnalysis,
    setReworkAnalysis,
    handoffStats,
    setHandoffStats,
    workloadForecast,
    setWorkloadForecast,
    specializationEvo,
    setSpecializationEvo,
    decayAlerts,
    setDecayAlerts,
    crossProjEff,
    setCrossProjEff,
    capSupplyDemand,
    setCapSupplyDemand,
    idleRanking,
    setIdleRanking,
    propagationNet,
    setPropagationNet,
    protocolLatency,
    setProtocolLatency,
  }
}
