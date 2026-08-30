/**
 * Workflow 页面组件导出
 *
 * 从 Workflows.tsx 拆分出的独立组件。
 */
export { default as WorkflowFormModal } from './WorkflowFormModal'
export { default as WorkflowRunConsole } from './WorkflowRunConsole'
export { default as WorkflowAnalyticsCards } from './WorkflowAnalyticsCards'
export { default as ScheduledTriggersCard } from './ScheduledTriggersCard'
export { default as WorkflowRunsCard } from './WorkflowRunsCard'
export { default as WorkflowTemplatesCard } from './WorkflowTemplatesCard'

// Analytics cards
export {
  StepExecutionStatsCard,
  StepDurationHistogramCard,
  RunDurationPercentilesCard,
  StepFailureRateCard,
  StepCofailureMatrixCard,
  WorkflowSuccessRateCard,
  StepRetryTopologyCard,
  StepHourlyDistributionCard,
  StepDependencyBottleneckCard,
  WorkflowSimilarityMatrixCard,
  StepDurationHistCard,
  StepBottleneckTimelineCard,
  StructuralComplexityCard,
} from './index'