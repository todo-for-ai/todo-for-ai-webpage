/**
 * Workflow 分析卡片集合
 *
 * 组合所有工作流分析子卡片。
 */
import React from 'react'
import {
  type WorkflowStepStats,
  type WorkflowStepDurationHistogram,
  type WorkflowRunDurationPercentiles,
  type WorkflowStepFailureRate,
  type WorkflowStepCofailureMatrix,
  type WorkflowSuccessRateByWorkflow,
  type WorkflowStepRetryTopology,
  type WorkflowStepHourlyDistribution,
  type WorkflowStepDependencyBottleneck,
  type WorkflowSimilarityMatrix,
  type WorkflowRunTrend,
  type WorkflowFailureCorrelation,
  type WorkflowFailureCorrelationByStep,
  type WorkflowFailedStepsByDuration,
  type WorkflowStepBottleneckTimeline,
  type WorkflowStructuralComplexity,
} from '../../api/agents'
import {
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

interface WorkflowAnalyticsCardsProps {
  stepStats: WorkflowStepStats | null
  stepDurationHistogram: WorkflowStepDurationHistogram | null
  runDurationPercentiles: WorkflowRunDurationPercentiles | null
  stepFailureRate: WorkflowStepFailureRate | null
  stepCofailureMatrix: WorkflowStepCofailureMatrix | null
  successRateByWorkflow: WorkflowSuccessRateByWorkflow | null
  stepRetryTopology: WorkflowStepRetryTopology | null
  stepHourlyDistribution: WorkflowStepHourlyDistribution | null
  stepDependencyBottleneck: WorkflowStepDependencyBottleneck | null
  similarityMatrix: WorkflowSimilarityMatrix | null
  stepDurationHist: WorkflowStepDurationHistogram | null
  stepBottleneckTl: WorkflowStepBottleneckTimeline | null
  structuralComplexity: WorkflowStructuralComplexity | null
  runTrend: WorkflowRunTrend | null
  failureCorrelation: WorkflowFailureCorrelation | null
  failureCorrelationByStep: WorkflowFailureCorrelationByStep | null
  failedStepsByDuration: WorkflowFailedStepsByDuration | null
}

const WorkflowAnalyticsCards: React.FC<WorkflowAnalyticsCardsProps> = ({
  stepStats,
  stepDurationHistogram,
  runDurationPercentiles,
  stepFailureRate,
  stepCofailureMatrix,
  successRateByWorkflow,
  stepRetryTopology,
  stepHourlyDistribution,
  stepDependencyBottleneck,
  similarityMatrix,
  stepDurationHist,
  stepBottleneckTl,
  structuralComplexity,
  runTrend,
  failureCorrelation,
  failureCorrelationByStep,
  failedStepsByDuration,
}) => {
  return (
    <>
      <StepExecutionStatsCard
        stepStats={stepStats}
        runTrend={runTrend}
        failureCorrelation={failureCorrelation}
        failureCorrelationByStep={failureCorrelationByStep}
        failedStepsByDuration={failedStepsByDuration}
      />
      <StepDurationHistogramCard stepDurationHistogram={stepDurationHistogram} />
      <RunDurationPercentilesCard runDurationPercentiles={runDurationPercentiles} />
      <StepFailureRateCard stepFailureRate={stepFailureRate} />
      <StepCofailureMatrixCard stepCofailureMatrix={stepCofailureMatrix} />
      <WorkflowSuccessRateCard successRateByWorkflow={successRateByWorkflow} />
      <StepRetryTopologyCard stepRetryTopology={stepRetryTopology} />
      <StepHourlyDistributionCard stepHourlyDistribution={stepHourlyDistribution} />
      <StepDependencyBottleneckCard stepDependencyBottleneck={stepDependencyBottleneck} />
      <WorkflowSimilarityMatrixCard similarityMatrix={similarityMatrix} />
      <StepDurationHistCard stepDurationHist={stepDurationHist} />
      <StepBottleneckTimelineCard stepBottleneckTl={stepBottleneckTl} />
      <StructuralComplexityCard structuralComplexity={structuralComplexity} />
    </>
  )
}

export default WorkflowAnalyticsCards
