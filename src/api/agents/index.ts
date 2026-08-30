/**
 * Agent API — main entry point (re-export shim for backward compatibility).
 *
 * This file provides the `agentsApi` singleton and re-exports all types
 * from submodules. The implementation is split across method modules
 * using the mixin pattern.
 */
import { apiClient } from '../client/index.js'

// ── Re-export all types ──────────────────────────────────────────────
export type {
  AgentStatus,
  AgentKind,
  TaskAssignmentState,
  Pagination,
  Agent,
  TaskAssignment,
  AgentRun,
  TaskEvent,
  PostableTaskEventType,
  PostTaskEventData,
  AgentInboxResult,
  NotificationItem,
  ListNotificationsResult,
  SharedContextEntry,
  RunLogLevel,
  RunLogEntry,
  HandoffTaskData,
  HandoffTaskResult,
  DispatchTasksData,
  DispatchPolicy,
  DispatchAssignment,
  DispatchTasksResult,
  DispatchPreviewCandidate,
  DispatchPreviewAssignment,
  DispatchPreviewTaskCandidates,
  DispatchPreviewUnmatchedTask,
  DispatchPreviewResult,
  ReviewQueueAction,
  ReviewQueueItem,
  ListResult,
  PaginatedResponse,
  AgentQueryParams,
  AssignmentQueryParams,
  TaskAssignmentQueryParams,
  CreateAgentData,
  UpdateAgentData,
  ClaimTaskData,
  ClaimTaskResult,
  UpdateAssignmentData,
} from './types'

export type {
  WorkflowStepItem,
  WorkflowItem,
  CreateWorkflowStepData,
  CreateWorkflowData,
  WorkflowStepRunItem,
  WorkflowRunItem,
  RunLogItem,
  WorkflowRunConsoleStep,
  WorkflowRunConsoleSummary,
  WorkflowRunConsoleResult,
  WorkflowStepStat,
  WorkflowStepStats,
  WorkflowStepDurationHistogramItem,
  WorkflowStepDurationHistogram,
  WorkflowRunDurationBucket,
  WorkflowRunDurationPercentiles,
  WorkflowStepFailureRateItem,
  WorkflowStepFailureRate,
  WorkflowStepCofailureKey,
  WorkflowStepCofailureMatrix,
  WorkflowStepRetryItem,
  WorkflowStepRetryTopology,
  WorkflowStepHourlyItem,
  WorkflowStepHourlyDistribution,
  WorkflowFailedStepByDuration,
  WorkflowFailedStepsByDuration,
  WorkflowRunTrendBucket,
  WorkflowRunTrend,
  WorkflowSuccessRateItem,
  WorkflowSuccessRateByWorkflow,
  WorkflowFailureCorrelationAgent,
  WorkflowFailureCorrelation,
  WorkflowFailureCorrelationByStepItem,
  WorkflowFailureCorrelationByStep,
  WorkflowStepBottleneckStep,
  WorkflowStepBottleneckAllStep,
  WorkflowStepBottleneckWorkflow,
  WorkflowStepDependencyBottleneck,
  WorkflowSimilarityPair,
  WorkflowSimilarityWorkflow,
  WorkflowSimilarityMatrix,
  StepDurationBucket,
  StepDurationHistogramStep,
  StepDurationHistogramResult,
  StepBottleneckTimelineStep,
  WorkflowStepBottleneckTimeline,
  WorkflowStructuralComplexityItem,
  WorkflowStructuralComplexity,
} from './workflow-types'

export type {
  AgentProductivityItem,
  AgentProductivity,
  AgentProductivityTrendBucket,
  AgentProductivityTrend,
  AgentProductivityAlertItem,
  AgentProductivityAlerts,
  AgentRunResourceUsageItem,
  AgentRunResourceUsage,
  AgentProductivityWeeklyItem,
  AgentProductivityWeeklyComparison,
  AgentProductivityByKindItem,
  AgentProductivityByKind,
  AgentProductivityHourlyHeatmapAgent,
  AgentProductivityHourlyHeatmap,
  AgentProductivityCalendarHeatmap,
  AgentFailureReasonItem,
  AgentFailureReasons,
  FailureErrorPatternAgent,
  FailureErrorPattern,
  AgentFailureErrorPatterns,
  CapabilityGapItem,
  CapabilityOverclaimItem,
  CapabilityMatchedItem,
  CapabilityGapAgent,
  AgentCapabilityGapAnalysis,
  CapabilityStatus,
  CapabilitySupplyDemandItem,
  AgentCapabilitySupplyDemand,
  AgentCollaborator,
  AgentCollaboratorsResult,
  CollaborationGraphNode,
  CollaborationGraphEdge,
  CollaborationGraph,
  CollaborationTimelineEdge,
  CollaborationTimelineSnapshot,
  CollaborationGraphTimeline,
  TaskAllocationFairnessAgent,
  TaskAllocationLorenzPoint,
  TaskAllocationFairness,
  AgentTaskHandoffPair,
  AgentTaskHandoffStats,
  SkillMatchCandidate,
  SkillMatchingTask,
  AgentSkillMatching,
  ChannelActivityItem,
  ChannelActivityTrend,
  WorkloadForecastAgent,
  AgentWorkloadForecast,
  AgentRunResourceTrendAgent,
  AgentRunResourceTrend,
  KnowledgePropagationNode,
  KnowledgePropagationEdge,
  KnowledgePropagationNetwork,
  ProtocolLatencyType,
  ProtocolDecisionLatency,
  SpecializationEvolutionAgent,
  AgentSpecializationEvolution,
  AgentHealthSubScores,
  AgentHealthItem,
  AgentHealth,
  AgentHealthTrendBucket,
  AgentHealthTrend,
  HealthStateTransitionFlow,
  AgentHealthStateTransitions,
  AgentHealthAlertItem,
  AgentHealthAlerts,
  HealthWeights,
  AgentIdleStage,
  AgentIdleItem,
  AgentIdleRanking,
} from './analytics-types'

export type {
  ExperiencesStats,
  ExperiencesTopReusedItem,
  ExperiencesLowConfidenceItem,
  ExperiencesLowConfidence,
  ExperiencesScatterPoint,
  ExperiencesScatter,
  ExperiencesReuseTrendBucket,
  ExperiencesReuseTrend,
  ExperiencesConfidenceDecayForecast,
  ExperiencesDecayByDomainItem,
  ExperiencesDecayByDomain,
  ExperiencesDecayByTaskTypeItem,
  ExperiencesDecayByTaskType,
  ExperiencesConfidenceBin,
  ExperiencesConfidenceDistribution,
  ExperiencesSourceItem,
  ExperiencesSourceDistribution,
  ExperiencesPropagationChainItem,
  ExperiencesPropagationChain,
  SkillCoverageAgent,
  ExperiencesSkillCoverageRadar,
  ExperiencesDecayAlert,
  AgentExperiencesDecayAlerts,
  CrossProjectAuthEfficiency,
  AgentCrossProjectEfficiency,
} from './experience-types'

export type {
  SandboxExecutionItem,
  SandboxViolationTrendBucket,
  SandboxViolationTrend,
  SandboxViolationByAgentItem,
  SandboxViolationsByAgent,
  SandboxTemplateUsageItem,
  SandboxTemplateUsage,
  ConflictItem,
  ConflictsDashboard,
  ConflictsTrendBucket,
  ConflictsTrend,
  ConflictByAgentItem,
  ConflictsByAgent,
  ConflictStrategyStat,
  ConflictsStrategyStats,
  ConflictsSandboxCorrelationTypeItem,
  ConflictsSandboxCorrelationAgent,
  ConflictsSandboxCorrelation,
  SecurityEventItem,
  SecurityDailyTrendDay,
  SecurityDailyTrend,
  SecurityByAgentItem,
  SecurityByAgent,
  OrchestrationResult,
  OrchestratorLastRun,
  OrchestratorStatus,
  OrchestrationRunItem,
  OrchestratorHistoryResult,
  OrchestratorDailyTrendDay,
  OrchestratorDailyTrend,
  ReputationHistoryPoint,
  ReputationHistory,
} from './sandbox-conflict-types'

// ── Import method factories ──────────────────────────────────────────
import { createCoreMethods, type CoreMethods } from './core-methods'
import { createWorkflowMethods, type WorkflowMethods } from './workflow-methods'
import { createAnalyticsMethods, type AnalyticsMethods } from './analytics-methods'
import { createExperienceMethods, type ExperienceMethods } from './experience-methods'
import { createSandboxConflictMethods, type SandboxConflictMethods } from './sandbox-conflict-methods'
import { createMessagingMethods, type MessagingMethods } from './messaging-methods'
import { createMaintenanceMethods, type MaintenanceMethods } from './maintenance-methods'

// ── Composed API type ────────────────────────────────────────────────

/**
 * Combined AgentsApi interface with all method categories.
 */
export interface AgentsApi
  extends CoreMethods,
    WorkflowMethods,
    AnalyticsMethods,
    ExperienceMethods,
    SandboxConflictMethods,
    MessagingMethods,
    MaintenanceMethods {}

/**
 * AgentsApi class - aggregates all method modules.
 */
class AgentsApiImpl implements AgentsApi {
  private core: CoreMethods
  private workflow: WorkflowMethods
  private analytics: AnalyticsMethods
  private experience: ExperienceMethods
  private sandboxConflict: SandboxConflictMethods
  private messaging: MessagingMethods
  private maintenance: MaintenanceMethods

  constructor() {
    this.core = createCoreMethods(apiClient)
    this.workflow = createWorkflowMethods(apiClient)
    this.analytics = createAnalyticsMethods(apiClient)
    this.experience = createExperienceMethods(apiClient)
    this.sandboxConflict = createSandboxConflictMethods(apiClient)
    this.messaging = createMessagingMethods(apiClient)
    this.maintenance = createMaintenanceMethods(apiClient)
  }

  // CoreMethods
  getAgents = (params?) => this.core.getAgents(params)
  getReviewQueue = (params?) => this.core.getReviewQueue(params)
  getAgent = (id) => this.core.getAgent(id)
  createAgent = (data) => this.core.createAgent(data)
  updateAgent = (id, data) => this.core.updateAgent(id, data)
  heartbeatAgent = (id, status?) => this.core.heartbeatAgent(id, status)
  getAgentAssignments = (id, params?) => this.core.getAgentAssignments(id, params)
  claimTask = (id, data?) => this.core.claimTask(id, data)
  updateAssignment = (agentId, assignmentId, data) => this.core.updateAssignment(agentId, assignmentId, data)
  getTaskAssignments = (taskId, params?) => this.core.getTaskAssignments(taskId, params)
  updateTaskAssignment = (taskId, assignmentId, data) => this.core.updateTaskAssignment(taskId, assignmentId, data)
  getTaskEvents = (taskId, params?) => this.core.getTaskEvents(taskId, params)
  postTaskEvent = (taskId, data) => this.core.postTaskEvent(taskId, data)
  handoffTask = (taskId, data) => this.core.handoffTask(taskId, data)
  dispatchTasks = (agentId, data?) => this.core.dispatchTasks(agentId, data)
  getDispatchPolicy = (agentId) => this.core.getDispatchPolicy(agentId)
  updateDispatchPolicy = (agentId, policy) => this.core.updateDispatchPolicy(agentId, policy)
  previewDispatchTasks = (agentId, data?) => this.core.previewDispatchTasks(agentId, data)
  getAgentInbox = (agentId, params?) => this.core.getAgentInbox(agentId, params)
  getNotifications = (params?) => this.core.getNotifications(params)
  markNotificationsRead = (data) => this.core.markNotificationsRead(data)
  getSharedContext = (taskId, key?) => this.core.getSharedContext(taskId, key)
  setSharedContext = (taskId, data) => this.core.setSharedContext(taskId, data)
  deleteSharedContext = (taskId, entryId) => this.core.deleteSharedContext(taskId, entryId)
  getRunLogs = (runId, params?) => this.core.getRunLogs(runId, params)
  getTaskTemplates = () => this.core.getTaskTemplates()
  createTaskTemplate = (data) => this.core.createTaskTemplate(data)
  deleteTaskTemplate = (id) => this.core.deleteTaskTemplate(id)
  instantiateTaskTemplate = (templateId, data) => this.core.instantiateTaskTemplate(templateId, data)

  // WorkflowMethods
  getWorkflows = (params?) => this.workflow.getWorkflows(params)
  getWorkflow = (id) => this.workflow.getWorkflow(id)
  createWorkflow = (data) => this.workflow.createWorkflow(data)
  updateWorkflow = (id, data) => this.workflow.updateWorkflow(id, data)
  deleteWorkflow = (id) => this.workflow.deleteWorkflow(id)
  launchWorkflow = (workflowId, data) => this.workflow.launchWorkflow(workflowId, data)
  getWorkflowRuns = (params?) => this.workflow.getWorkflowRuns(params)
  getWorkflowStepStats = (limit?) => this.workflow.getWorkflowStepStats(limit)
  getWorkflowStepDurationHistogram = (limit?) => this.workflow.getWorkflowStepDurationHistogram(limit)
  getWorkflowRunDurationPercentiles = (days?) => this.workflow.getWorkflowRunDurationPercentiles(days)
  getWorkflowStepFailureRate = (days?, limit?) => this.workflow.getWorkflowStepFailureRate(days, limit)
  getWorkflowStepCofailureMatrix = (days?, limit?) => this.workflow.getWorkflowStepCofailureMatrix(days, limit)
  getWorkflowStepRetryTopology = (days?, limit?) => this.workflow.getWorkflowStepRetryTopology(days, limit)
  getWorkflowStepHourlyDistribution = (days?, limit?) => this.workflow.getWorkflowStepHourlyDistribution(days, limit)
  getWorkflowFailedStepsByDuration = (days?, limit?) => this.workflow.getWorkflowFailedStepsByDuration(days, limit)
  getWorkflowRunTrend = (days?) => this.workflow.getWorkflowRunTrend(days)
  getWorkflowSuccessRateByWorkflow = (days?, limit?) => this.workflow.getWorkflowSuccessRateByWorkflow(days, limit)
  getWorkflowFailureCorrelation = (days?, windowHours?) => this.workflow.getWorkflowFailureCorrelation(days, windowHours)
  getWorkflowFailureCorrelationByStep = (days?, windowHours?) => this.workflow.getWorkflowFailureCorrelationByStep(days, windowHours)
  getWorkflowRun = (runId) => this.workflow.getWorkflowRun(runId)
  getWorkflowRunConsole = (runId, params?) => this.workflow.getWorkflowRunConsole(runId, params)
  cancelWorkflowRun = (runId) => this.workflow.cancelWorkflowRun(runId)
  pauseWorkflowRun = (runId) => this.workflow.pauseWorkflowRun(runId)
  resumeWorkflowRun = (runId) => this.workflow.resumeWorkflowRun(runId)
  retryWorkflowRun = (runId) => this.workflow.retryWorkflowRun(runId)
  completeWorkflowStep = (runId, stepKey, data) => this.workflow.completeWorkflowStep(runId, stepKey, data)
  getWorkflowTriggers = (params?) => this.workflow.getWorkflowTriggers(params)
  createWorkflowTrigger = (data) => this.workflow.createWorkflowTrigger(data)
  updateWorkflowTrigger = (triggerId, data) => this.workflow.updateWorkflowTrigger(triggerId, data)
  deleteWorkflowTrigger = (triggerId) => this.workflow.deleteWorkflowTrigger(triggerId)
  fireDueTriggers = () => this.workflow.fireDueTriggers()
  getWorkflowTemplates = (params?) => this.workflow.getWorkflowTemplates(params)
  getWorkflowTemplate = (templateKey) => this.workflow.getWorkflowTemplate(templateKey)
  instantiateWorkflowTemplate = (templateKey, data?) => this.workflow.instantiateWorkflowTemplate(templateKey, data)
  listWorkflowVersions = (workflowId) => this.workflow.listWorkflowVersions(workflowId)
  getWorkflowVersion = (workflowId, versionNumber) => this.workflow.getWorkflowVersion(workflowId, versionNumber)
  rollbackWorkflow = (workflowId, version) => this.workflow.rollbackWorkflow(workflowId, version)
  diffWorkflowVersions = (workflowId, v1, v2) => this.workflow.diffWorkflowVersions(workflowId, v1, v2)
  getWorkflowStepDependencyBottleneck = (days?, limit?) => this.workflow.getWorkflowStepDependencyBottleneck(days, limit)
  getWorkflowSimilarityMatrix = (days?, limit?, maxRuns?) => this.workflow.getWorkflowSimilarityMatrix(days, limit, maxRuns)
  getStepDurationHistogram = (days?) => this.workflow.getStepDurationHistogram(days)
  getWorkflowStepBottleneckTimeline = (days?, limit?) => this.workflow.getWorkflowStepBottleneckTimeline(days, limit)
  getWorkflowStructuralComplexity = (limit?) => this.workflow.getWorkflowStructuralComplexity(limit)

  // AnalyticsMethods
  getAgentProductivity = (days?, limit?) => this.analytics.getAgentProductivity(days, limit)
  getAgentRunResourceUsage = (days?, limit?) => this.analytics.getAgentRunResourceUsage(days, limit)
  getAgentProductivityWeeklyComparison = (limit?) => this.analytics.getAgentProductivityWeeklyComparison(limit)
  getAgentProductivityTrend = (days?) => this.analytics.getAgentProductivityTrend(days)
  getAgentProductivityAlerts = () => this.analytics.getAgentProductivityAlerts()
  getAgentProductivityByKind = (days?) => this.analytics.getAgentProductivityByKind(days)
  getAgentProductivityHourlyHeatmap = (days?, limit?) => this.analytics.getAgentProductivityHourlyHeatmap(days, limit)
  getAgentProductivityCalendarHeatmap = (days?, limit?) => this.analytics.getAgentProductivityCalendarHeatmap(days, limit)
  getAgentFailureReasons = (days?, limit?) => this.analytics.getAgentFailureReasons(days, limit)
  getAgentFailureErrorPatterns = (days?, limit?, prefixLen?) => this.analytics.getAgentFailureErrorPatterns(days, limit, prefixLen)
  getAgentCapabilityGapAnalysis = (limit?, minConfidence?) => this.analytics.getAgentCapabilityGapAnalysis(limit, minConfidence)
  getCollaborationGraphTimeline = (days?, bucket?, limit?) => this.analytics.getCollaborationGraphTimeline(days, bucket, limit)
  getTaskAllocationFairness = (days?) => this.analytics.getTaskAllocationFairness(days)
  getAgentRunResourceTrend = (days?, limit?) => this.analytics.getAgentRunResourceTrend(days, limit)
  getAgentSkillMatching = (limit?) => this.analytics.getAgentSkillMatching(limit)
  getAgentTaskHandoffStats = (days?, limit?) => this.analytics.getAgentTaskHandoffStats(days, limit)
  getChannelActivityTrend = (days?, limit?) => this.analytics.getChannelActivityTrend(days, limit)
  getAgentWorkloadForecast = (days?, horizon?, limit?) => this.analytics.getAgentWorkloadForecast(days, horizon, limit)
  getKnowledgePropagationNetwork = (days?, limit?) => this.analytics.getKnowledgePropagationNetwork(days, limit)
  getProtocolDecisionLatency = (days?) => this.analytics.getProtocolDecisionLatency(days)
  getAgentSpecializationEvolution = (weeks?, limit?) => this.analytics.getAgentSpecializationEvolution(weeks, limit)
  getAgentCrossProjectEfficiency = (days?, limit?) => this.analytics.getAgentCrossProjectEfficiency(days, limit)
  getAgentCapabilitySupplyDemand = (limit?) => this.analytics.getAgentCapabilitySupplyDemand(limit)
  getAgentIdleRanking = (limit?) => this.analytics.getAgentIdleRanking(limit)
  getConflictsSandboxCorrelation = (days?, windowHours?) => this.analytics.getConflictsSandboxCorrelation(days, windowHours)
  getAgentHealth = (days?) => this.analytics.getAgentHealth(days)
  getAgentHealthTrend = (days?, agentId?) => this.analytics.getAgentHealthTrend(days, agentId)
  getAgentHealthStateTransitions = (days?) => this.analytics.getAgentHealthStateTransitions(days)
  getAgentHealthAlerts = (weights?) => this.analytics.getAgentHealthAlerts(weights)
  getAgentCollaborators = (agentId, params?) => this.analytics.getAgentCollaborators(agentId, params)
  getCollaborationGraph = (params?) => this.analytics.getCollaborationGraph(params)

  // ExperienceMethods
  getExperiencesStats = () => this.experience.getExperiencesStats()
  getExperiencesLowConfidence = (maxConfidence?, limit?) => this.experience.getExperiencesLowConfidence(maxConfidence, limit)
  getExperiencesScatter = (limit?) => this.experience.getExperiencesScatter(limit)
  getExperiencesReuseTrend = (days?) => this.experience.getExperiencesReuseTrend(days)
  getExperiencesConfidenceDecayForecast = (days?) => this.experience.getExperiencesConfidenceDecayForecast(days)
  getExperiencesDecayByDomain = (limit?) => this.experience.getExperiencesDecayByDomain(limit)
  getExperiencesDecayByTaskType = (limit?) => this.experience.getExperiencesDecayByTaskType(limit)
  getExperiencesConfidenceDistribution = () => this.experience.getExperiencesConfidenceDistribution()
  getExperiencesSourceDistribution = () => this.experience.getExperiencesSourceDistribution()
  getExperiencesPropagationChain = (limit?) => this.experience.getExperiencesPropagationChain(limit)
  getExperiencesSkillCoverageRadar = (limit?, domains?) => this.experience.getExperiencesSkillCoverageRadar(limit, domains)
  getAgentExperiencesDecayAlerts = (days?, minDrop?, limit?) => this.experience.getAgentExperiencesDecayAlerts(days, minDrop, limit)
  listAgentExperiences = (agentId, params?) => this.experience.listAgentExperiences(agentId, params)
  createAgentExperience = (agentId, data) => this.experience.createAgentExperience(agentId, data)
  getAgentExperience = (agentId, experienceId) => this.experience.getAgentExperience(agentId, experienceId)
  updateAgentExperience = (agentId, experienceId, data) => this.experience.updateAgentExperience(agentId, experienceId, data)
  deleteAgentExperience = (agentId, experienceId) => this.experience.deleteAgentExperience(agentId, experienceId)
  recommendExperiences = (agentId, params?) => this.experience.recommendExperiences(agentId, params)
  shareAgentExperience = (agentId, experienceId) => this.experience.shareAgentExperience(agentId, experienceId)
  learnFromExperience = (agentId, experienceId) => this.experience.learnFromExperience(agentId, experienceId)
  listSharedExperiences = (agentId, params?) => this.experience.listSharedExperiences(agentId, params)
  autoExtractExperiences = (agentId) => this.experience.autoExtractExperiences(agentId)
  applyExperienceDecay = (agentId, params?) => this.experience.applyExperienceDecay(agentId, params)
  validateExperience = (agentId, experienceId, data) => this.experience.validateExperience(agentId, experienceId, data)
  getExperienceValidationStats = (agentId) => this.experience.getExperienceValidationStats(agentId)
  decayAllExperiences = (params?) => this.experience.decayAllExperiences(params)
  suggestCapabilityAdaptation = (agentId) => this.experience.suggestCapabilityAdaptation(agentId)
  applyCapabilityAdaptation = (agentId, data) => this.experience.applyCapabilityAdaptation(agentId, data)
  authorizeCrossProjectAgent = (data) => this.experience.authorizeCrossProjectAgent(data)
  revokeCrossProjectAgent = (agentId, projectId) => this.experience.revokeCrossProjectAgent(agentId, projectId)
  listAgentCrossProjects = (agentId) => this.experience.listAgentCrossProjects(agentId)
  listProjectExternalAgents = (projectId) => this.experience.listProjectExternalAgents(projectId)
  discoverCrossProjectAgents = (params?) => this.experience.discoverCrossProjectAgents(params)
  findCapableAgentsCrossProject = (params) => this.experience.findCapableAgentsCrossProject(params)
  findCrossProjectTasks = (agentId, params?) => this.experience.findCrossProjectTasks(agentId, params)
  claimCrossProjectTask = (agentId, taskId, data?) => this.experience.claimCrossProjectTask(agentId, taskId, data)
  listKnowledgeEntries = (agentId, params?) => this.experience.listKnowledgeEntries(agentId, params)
  createKnowledgeEntry = (agentId, data) => this.experience.createKnowledgeEntry(agentId, data)
  getKnowledgeEntry = (agentId, entryId) => this.experience.getKnowledgeEntry(agentId, entryId)
  updateKnowledgeEntry = (agentId, entryId, data) => this.experience.updateKnowledgeEntry(agentId, entryId, data)
  deleteKnowledgeEntry = (agentId, entryId) => this.experience.deleteKnowledgeEntry(agentId, entryId)
  searchKnowledge = (agentId, params?) => this.experience.searchKnowledge(agentId, params)
  listSharedKnowledge = (params?) => this.experience.listSharedKnowledge(params)
  autoExtractKnowledge = (agentId, limit?) => this.experience.autoExtractKnowledge(agentId, limit)

  // SandboxConflictMethods
  listSandboxes = (params?) => this.sandboxConflict.listSandboxes(params)
  createSandbox = (data) => this.sandboxConflict.createSandbox(data)
  getSandbox = (sandboxId) => this.sandboxConflict.getSandbox(sandboxId)
  updateSandbox = (sandboxId, data) => this.sandboxConflict.updateSandbox(sandboxId, data)
  deleteSandbox = (sandboxId) => this.sandboxConflict.deleteSandbox(sandboxId)
  bindAgentSandbox = (agentId, sandboxId) => this.sandboxConflict.bindAgentSandbox(agentId, sandboxId)
  getAgentSandbox = (agentId) => this.sandboxConflict.getAgentSandbox(agentId)
  checkSandboxAction = (sandboxId, action, target) => this.sandboxConflict.checkSandboxAction(sandboxId, action, target)
  startSandboxExecution = (sandboxId, data) => this.sandboxConflict.startSandboxExecution(sandboxId, data)
  completeSandboxExecution = (executionId, data) => this.sandboxConflict.completeSandboxExecution(executionId, data)
  revokeSandboxExecution = (executionId) => this.sandboxConflict.revokeSandboxExecution(executionId)
  reportSandboxViolation = (executionId, data) => this.sandboxConflict.reportSandboxViolation(executionId, data)
  getSandboxExecution = (executionId) => this.sandboxConflict.getSandboxExecution(executionId)
  listSandboxExecutions = (sandboxId, params?) => this.sandboxConflict.listSandboxExecutions(sandboxId, params)
  getSandboxDashboard = () => this.sandboxConflict.getSandboxDashboard()
  getSandboxViolationTrend = (days?) => this.sandboxConflict.getSandboxViolationTrend(days)
  getSandboxViolationsByAgent = (days?, limit?) => this.sandboxConflict.getSandboxViolationsByAgent(days, limit)
  getSandboxTemplateUsage = () => this.sandboxConflict.getSandboxTemplateUsage()
  getStepSandboxExecution = (runId, stepKey) => this.sandboxConflict.getStepSandboxExecution(runId, stepKey)
  reportStepSandboxViolation = (runId, stepKey, data) => this.sandboxConflict.reportStepSandboxViolation(runId, stepKey, data)
  setStepRuntimeOverride = (runId, stepKey, data) => this.sandboxConflict.setStepRuntimeOverride(runId, stepKey, data)
  clearStepRuntimeOverride = (runId, stepKey) => this.sandboxConflict.clearStepRuntimeOverride(runId, stepKey)
  getStepEffectiveParams = (runId, stepKey) => this.sandboxConflict.getStepEffectiveParams(runId, stepKey)
  listSandboxTemplates = () => this.sandboxConflict.listSandboxTemplates()
  instantiateSandboxTemplate = (templateKey, data) => this.sandboxConflict.instantiateSandboxTemplate(templateKey, data)
  scanConflicts = () => this.sandboxConflict.scanConflicts()
  listConflicts = (params?) => this.sandboxConflict.listConflicts(params)
  getConflict = (conflictId) => this.sandboxConflict.getConflict(conflictId)
  resolveConflict = (conflictId, strategy, description?) => this.sandboxConflict.resolveConflict(conflictId, strategy, description)
  acknowledgeConflict = (conflictId) => this.sandboxConflict.acknowledgeConflict(conflictId)
  ignoreConflict = (conflictId) => this.sandboxConflict.ignoreConflict(conflictId)
  getConflictsDashboard = () => this.sandboxConflict.getConflictsDashboard()
  getConflictsTrend = (days?) => this.sandboxConflict.getConflictsTrend(days)
  getConflictsByAgent = (limit?) => this.sandboxConflict.getConflictsByAgent(limit)
  getConflictsStrategyStats = () => this.sandboxConflict.getConflictsStrategyStats()
  autoResolveConflicts = () => this.sandboxConflict.autoResolveConflicts()
  getSecurityEvents = (params?) => this.sandboxConflict.getSecurityEvents(params)
  exportSecurityEvents = (params?) => this.sandboxConflict.exportSecurityEvents(params)
  getSecurityEventsDailyTrend = (params?) => this.sandboxConflict.getSecurityEventsDailyTrend(params)
  getSecurityEventsByAgent = (params?) => this.sandboxConflict.getSecurityEventsByAgent(params)
  orchestrate = () => this.sandboxConflict.orchestrate()
  getOrchestratorStatus = () => this.sandboxConflict.getOrchestratorStatus()
  listOrchestratorHistory = (params?) => this.sandboxConflict.listOrchestratorHistory(params)
  getOrchestratorDailyTrend = (params?) => this.sandboxConflict.getOrchestratorDailyTrend(params)
  getAgentReputation = (agentId) => this.sandboxConflict.getAgentReputation(agentId)
  listReputations = () => this.sandboxConflict.listReputations()
  recalculateReputation = (agentId) => this.sandboxConflict.recalculateReputation(agentId)
  getAgentReputationHistory = (agentId, params?) => this.sandboxConflict.getAgentReputationHistory(agentId, params)

  // MessagingMethods
  broadcastMessage = (agentId, content) => this.messaging.broadcastMessage(agentId, content)
  getCollaborationMetrics = (params?) => this.messaging.getCollaborationMetrics(params)
  getRecommendedTasks = (agentId, params?) => this.messaging.getRecommendedTasks(agentId, params)
  listChannels = (params?) => this.messaging.listChannels(params)
  createChannel = (data) => this.messaging.createChannel(data)
  getChannel = (channelId) => this.messaging.getChannel(channelId)
  updateChannel = (channelId, data) => this.messaging.updateChannel(channelId, data)
  deleteChannel = (channelId) => this.messaging.deleteChannel(channelId)
  addChannelMember = (channelId, data) => this.messaging.addChannelMember(channelId, data)
  removeChannelMember = (channelId, memberId) => this.messaging.removeChannelMember(channelId, memberId)
  listChannelMessages = (channelId, params?) => this.messaging.listChannelMessages(channelId, params)
  sendChannelMessage = (channelId, data) => this.messaging.sendChannelMessage(channelId, data)
  selfRegisterAgent = (data) => this.messaging.selfRegisterAgent(data)
  discoverAgents = (params?) => this.messaging.discoverAgents(params)
  sendAgentMessage = (fromAgentId, toAgentId, data) => this.messaging.sendAgentMessage(fromAgentId, toAgentId, data)
  getAgentMessages = (agentId, params?) => this.messaging.getAgentMessages(agentId, params)
  listProtocols = (params?) => this.messaging.listProtocols(params)
  createProtocol = (data) => this.messaging.createProtocol(data)
  getProtocol = (protocolId) => this.messaging.getProtocol(protocolId)
  respondToProtocol = (protocolId, data) => this.messaging.respondToProtocol(protocolId, data)
  resolveProtocol = (protocolId, data) => this.messaging.resolveProtocol(protocolId, data)
  getProtocolAnalytics = (params?) => this.messaging.getProtocolAnalytics(params)
  addDeliberationMessage = (protocolId, data) => this.messaging.addDeliberationMessage(protocolId, data)
  listCollaborationTemplates = (params?) => this.messaging.listCollaborationTemplates(params)
  createCollaborationTemplate = (data) => this.messaging.createCollaborationTemplate(data)
  deleteCollaborationTemplate = (templateId) => this.messaging.deleteCollaborationTemplate(templateId)
  instantiateCollaborationTemplate = (templateKey, data?) => this.messaging.instantiateCollaborationTemplate(templateKey, data)
  getProjectMembers = (projectId) => this.messaging.getProjectMembers(projectId)
  addProjectMember = (projectId, data) => this.messaging.addProjectMember(projectId, data)
  updateProjectMember = (projectId, memberId, data) => this.messaging.updateProjectMember(projectId, memberId, data)
  removeProjectMember = (projectId, memberId) => this.messaging.removeProjectMember(projectId, memberId)

  // MaintenanceMethods
  healthCheck = () => this.maintenance.healthCheck()
  escalateOverdueTasks = (data?) => this.maintenance.escalateOverdueTasks(data)
  getAuditLogs = (params?) => this.maintenance.getAuditLogs(params)
  markOfflineAgents = () => this.maintenance.markOfflineAgents()
  timeoutWorkflowSteps = () => this.maintenance.timeoutWorkflowSteps()
}

// ── Singleton export ────────────────────────────────────────────────

export const agentsApi = new AgentsApiImpl()