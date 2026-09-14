import { useState, useCallback } from 'react'
import {
  type WorkflowStepStats, type WorkflowStepDurationHistogram,
  type WorkflowRunDurationPercentiles, type WorkflowStepFailureRate,
  type WorkflowStepCofailureMatrix, type WorkflowSuccessRateByWorkflow,
  type WorkflowStepRetryTopology, type WorkflowStepHourlyDistribution,
  type WorkflowStepDependencyBottleneck, type WorkflowSimilarityMatrix,
  type WorkflowStepBottleneckTimeline, type WorkflowStructuralComplexity,
  type WorkflowRunTrend, type WorkflowFailureCorrelation,
  type WorkflowFailureCorrelationByStep, type WorkflowFailedStepsByDuration,
  agentsApi,
} from '../../api/agents'

/**
 * 工作流步骤/运行分析域：17 个分析数据源的状态与扇出加载。
 * 从 useWorkflowsData 原样拆出；由 useWorkflowsData 在每次 loadRuns 成功后触发。
 */
export function useWorkflowAnalytics() {
  const [stepStats, setStepStats] = useState<WorkflowStepStats | null>(null)
  const [stepDurationHistogram, setStepDurationHistogram] = useState<WorkflowStepDurationHistogram | null>(null)
  const [runDurationPercentiles, setRunDurationPercentiles] = useState<WorkflowRunDurationPercentiles | null>(null)
  const [stepFailureRate, setStepFailureRate] = useState<WorkflowStepFailureRate | null>(null)
  const [stepCofailureMatrix, setStepCofailureMatrix] = useState<WorkflowStepCofailureMatrix | null>(null)
  const [successRateByWorkflow, setSuccessRateByWorkflow] = useState<WorkflowSuccessRateByWorkflow | null>(null)
  const [stepRetryTopology, setStepRetryTopology] = useState<WorkflowStepRetryTopology | null>(null)
  const [stepHourlyDistribution, setStepHourlyDistribution] = useState<WorkflowStepHourlyDistribution | null>(null)
  const [stepDependencyBottleneck, setStepDependencyBottleneck] = useState<WorkflowStepDependencyBottleneck | null>(null)
  const [similarityMatrix, setSimilarityMatrix] = useState<WorkflowSimilarityMatrix | null>(null)
  const [stepDurationHist, setStepDurationHist] = useState<WorkflowStepDurationHistogram | null>(null)
  const [stepBottleneckTl, setStepBottleneckTl] = useState<WorkflowStepBottleneckTimeline | null>(null)
  const [structuralComplexity, setStructuralComplexity] = useState<WorkflowStructuralComplexity | null>(null)
  const [runTrend, setRunTrend] = useState<WorkflowRunTrend | null>(null)
  const [failureCorrelation, setFailureCorrelation] = useState<WorkflowFailureCorrelation | null>(null)
  const [failureCorrelationByStep, setFailureCorrelationByStep] = useState<WorkflowFailureCorrelationByStep | null>(null)
  const [failedStepsByDuration, setFailedStepsByDuration] = useState<WorkflowFailedStepsByDuration | null>(null)

  // 各分析源独立容错（单个失败不影响其余）
  const fetchAnalytics = useCallback(async () => {
    agentsApi.getWorkflowStepStats(30).then(setStepStats).catch(() => {})
    agentsApi.getWorkflowStepDurationHistogram(10).then(setStepDurationHistogram).catch(() => {})
    agentsApi.getWorkflowRunDurationPercentiles(30).then(setRunDurationPercentiles).catch(() => {})
    agentsApi.getWorkflowStepFailureRate(30, 15).then(setStepFailureRate).catch(() => {})
    agentsApi.getWorkflowStepCofailureMatrix(30, 8).then(setStepCofailureMatrix).catch(() => {})
    agentsApi.getWorkflowSuccessRateByWorkflow(30, 10).then(setSuccessRateByWorkflow).catch(() => {})
    agentsApi.getWorkflowStepRetryTopology(30, 15).then(setStepRetryTopology).catch(() => {})
    agentsApi.getWorkflowStepHourlyDistribution(30, 10).then(setStepHourlyDistribution).catch(() => {})
    agentsApi.getWorkflowStepDependencyBottleneck(30, 10).then(setStepDependencyBottleneck).catch(() => {})
    agentsApi.getWorkflowSimilarityMatrix(30, 5, 20).then(setSimilarityMatrix).catch(() => {})
    agentsApi.getWorkflowStepDurationHistogram(10).then(setStepDurationHist).catch(() => {})
    agentsApi.getWorkflowStepBottleneckTimeline(30, 8).then(setStepBottleneckTl).catch(() => {})
    agentsApi.getWorkflowStructuralComplexity(20).then(setStructuralComplexity).catch(() => {})
    agentsApi.getWorkflowRunTrend(30).then(setRunTrend).catch(() => {})
    agentsApi.getWorkflowFailureCorrelation(30, 2).then(setFailureCorrelation).catch(() => {})
    agentsApi.getWorkflowFailureCorrelationByStep(30, 2).then(setFailureCorrelationByStep).catch(() => {})
    agentsApi.getWorkflowFailedStepsByDuration(30, 20).then(setFailedStepsByDuration).catch(() => {})
  }, [])

  return {
    stepStats, setStepStats,
    stepDurationHistogram, setStepDurationHistogram,
    runDurationPercentiles, setRunDurationPercentiles,
    stepFailureRate, setStepFailureRate,
    stepCofailureMatrix, setStepCofailureMatrix,
    successRateByWorkflow, setSuccessRateByWorkflow,
    stepRetryTopology, setStepRetryTopology,
    stepHourlyDistribution, setStepHourlyDistribution,
    stepDependencyBottleneck, setStepDependencyBottleneck,
    similarityMatrix, setSimilarityMatrix,
    stepDurationHist, setStepDurationHist,
    stepBottleneckTl, setStepBottleneckTl,
    structuralComplexity, setStructuralComplexity,
    runTrend, setRunTrend,
    failureCorrelation, setFailureCorrelation,
    failureCorrelationByStep, setFailureCorrelationByStep,
    failedStepsByDuration, setFailedStepsByDuration,
    fetchAnalytics,
  }
}
