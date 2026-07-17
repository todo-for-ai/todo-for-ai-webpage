import { apiClient } from './client/index.js'
import { getApiBaseUrl } from '../utils/apiConfig'
import type { Task } from './tasks'

// ── Type re-exports (split into ./agents/ subdirectory) ──
export * from './agents'

const unwrapData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T
  }
  return response as T
}

const unwrapList = <T>(response: any): ListResult<T> => {
  const payload = unwrapData<any>(response)
  const items = payload?.items || payload?.data || []
  const pagination = payload?.pagination || {
    page: 1,
    per_page: Array.isArray(items) ? items.length : 0,
    total: Array.isArray(items) ? items.length : 0,
    pages: 1,
    has_next: false,
    has_prev: false,
    next_num: null,
    prev_num: null,
  }

  return {
    items: Array.isArray(items) ? items : [],
    pagination,
  }
}

const buildQuery = (params?: object) => {
  const queryParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        queryParams.append(key, String(value))
      }
    })
  }

  const query = queryParams.toString()
  return query ? `?${query}` : ''
}

export class AgentsApi {
  async getAgents(params?: AgentQueryParams): Promise<ListResult<Agent>> {
    const response = await apiClient.get(`/agents${buildQuery(params)}`)
    return unwrapList<Agent>(response)
  }

  async getReviewQueue(params?: { action?: ReviewQueueAction; page?: number; per_page?: number }): Promise<ListResult<ReviewQueueItem>> {
    const response = await apiClient.get(`/agents/review-queue${buildQuery(params)}`)
    return unwrapList<ReviewQueueItem>(response)
  }

  async getAgent(id: number): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.get(`/agents/${id}`))
  }

  async createAgent(data: CreateAgentData): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.post('/agents', data))
  }

  async updateAgent(id: number, data: UpdateAgentData): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.put(`/agents/${id}`, data))
  }

  async heartbeatAgent(id: number, status?: AgentStatus): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.post(`/agents/${id}/heartbeat`, status ? { status } : {}))
  }

  async getAgentAssignments(id: number, params?: AssignmentQueryParams): Promise<ListResult<TaskAssignment>> {
    const response = await apiClient.get(`/agents/${id}/assignments${buildQuery(params)}`)
    return unwrapList<TaskAssignment>(response)
  }

  async claimTask(id: number, data: ClaimTaskData = {}): Promise<ClaimTaskResult | null> {
    return unwrapData<ClaimTaskResult | null>(await apiClient.post(`/agents/${id}/claim`, data))
  }

  async updateAssignment(agentId: number, assignmentId: number, data: UpdateAssignmentData) {
    return unwrapData<{ assignment: TaskAssignment; run: AgentRun | null }>(
      await apiClient.put(`/agents/${agentId}/assignments/${assignmentId}`, data)
    )
  }

  async getTaskAssignments(taskId: number, params?: TaskAssignmentQueryParams): Promise<ListResult<TaskAssignment>> {
    const response = await apiClient.get(`/agents/tasks/${taskId}/assignments${buildQuery(params)}`)
    return unwrapList<TaskAssignment>(response)
  }

  async updateTaskAssignment(taskId: number, assignmentId: number, data: UpdateAssignmentData) {
    return unwrapData<{ assignment: TaskAssignment; run: AgentRun | null }>(
      await apiClient.put(`/agents/tasks/${taskId}/assignments/${assignmentId}`, data)
    )
  }

  async getTaskEvents(taskId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<TaskEvent>> {
    const response = await apiClient.get(`/agents/tasks/${taskId}/events${buildQuery(params)}`)
    return unwrapList<TaskEvent>(response)
  }

  async postTaskEvent(taskId: number, data: PostTaskEventData): Promise<TaskEvent> {
    return unwrapData<TaskEvent>(await apiClient.post(`/agents/tasks/${taskId}/events`, data))
  }

  async handoffTask(taskId: number, data: HandoffTaskData): Promise<HandoffTaskResult> {
    return unwrapData<HandoffTaskResult>(await apiClient.post(`/agents/tasks/${taskId}/handoff`, data))
  }

  async dispatchTasks(agentId: number, data: DispatchTasksData = {}): Promise<DispatchTasksResult> {
    return unwrapData<DispatchTasksResult>(await apiClient.post(`/agents/${agentId}/dispatch`, data))
  }

  async getDispatchPolicy(agentId: number): Promise<{ policy: DispatchPolicy }> {
    return unwrapData<{ policy: DispatchPolicy }>(await apiClient.get(`/agents/${agentId}/dispatch/policy`))
  }

  async updateDispatchPolicy(agentId: number, policy: DispatchTasksData): Promise<{ policy: DispatchPolicy; coordinator: Agent }> {
    return unwrapData<{ policy: DispatchPolicy; coordinator: Agent }>(
      await apiClient.put(`/agents/${agentId}/dispatch/policy`, { policy })
    )
  }

  async previewDispatchTasks(agentId: number, data: DispatchTasksData = {}): Promise<DispatchPreviewResult> {
    return unwrapData<DispatchPreviewResult>(await apiClient.post(`/agents/${agentId}/dispatch/preview`, data))
  }

  async getAgentInbox(agentId: number, params?: { since_id?: number; per_page?: number; include_self?: boolean }): Promise<AgentInboxResult> {
    return unwrapData<AgentInboxResult>(await apiClient.get(`/agents/${agentId}/inbox${buildQuery(params)}`))
  }

  async getNotifications(params?: { since_id?: number; unread_only?: boolean; per_page?: number }): Promise<ListNotificationsResult> {
    return unwrapData<ListNotificationsResult>(await apiClient.get(`/agents/notifications${buildQuery(params)}`))
  }

  async markNotificationsRead(data: { ids?: number[]; all?: boolean }): Promise<{ marked_count: number }> {
    return unwrapData<{ marked_count: number }>(await apiClient.post('/agents/notifications/read', data))
  }

  async getSharedContext(taskId: number, key?: string): Promise<SharedContextEntry[]> {
    const params = key ? `?key=${encodeURIComponent(key)}` : ''
    return unwrapData<SharedContextEntry[]>(await apiClient.get(`/agents/tasks/${taskId}/shared-context${params}`))
  }

  async setSharedContext(taskId: number, data: { key: string; value: string; agent_id?: number }): Promise<SharedContextEntry> {
    return unwrapData<SharedContextEntry>(await apiClient.put(`/agents/tasks/${taskId}/shared-context`, data))
  }

  async deleteSharedContext(taskId: number, entryId: number): Promise<void> {
    await apiClient.delete(`/agents/tasks/${taskId}/shared-context/${entryId}`)
  }

  async getRunLogs(runId: number, params?: { since_id?: number; level?: RunLogLevel; per_page?: number }): Promise<{ items: RunLogEntry[]; latest_id: number; since_id?: number; run_id: number }> {
    const query = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}` : ''
    return unwrapData<any>(await apiClient.get(`/agents/runs/${runId}/logs${query}`))
  }

  // Task templates
  async getTaskTemplates(): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get('/agents/task-templates'))
  }

  async createTaskTemplate(data: { name: string; description?: string; title_template?: string; content_template?: string; priority?: string; tags?: string[]; is_ai_task?: boolean; capabilities?: string[] }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/task-templates', data))
  }

  async deleteTaskTemplate(id: number): Promise<void> {
    await apiClient.delete(`/agents/task-templates/${id}`)
  }

  async instantiateTaskTemplate(templateId: number, data: { project_id: number; title?: string; content?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/task-templates/${templateId}/instantiate`, data))
  }

  // Workflows
  async getWorkflows(params?: { is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<WorkflowItem>> {
    const response = await apiClient.get(`/agents/workflows${buildQuery(params)}`)
    return unwrapList<WorkflowItem>(response)
  }

  async getWorkflow(id: number): Promise<WorkflowItem> {
    return unwrapData<WorkflowItem>(await apiClient.get(`/agents/workflows/${id}`))
  }

  async createWorkflow(data: CreateWorkflowData): Promise<WorkflowItem> {
    return unwrapData<WorkflowItem>(await apiClient.post('/agents/workflows', data))
  }

  async updateWorkflow(id: number, data: Partial<CreateWorkflowData>): Promise<WorkflowItem> {
    return unwrapData<WorkflowItem>(await apiClient.put(`/agents/workflows/${id}`, data))
  }

  async deleteWorkflow(id: number): Promise<void> {
    await apiClient.delete(`/agents/workflows/${id}`)
  }

  async launchWorkflow(workflowId: number, data: { project_id: number; root_task_id?: number; context?: Record<string, unknown> }): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflows/${workflowId}/runs`, data))
  }

  async getWorkflowRuns(params?: { workflow_id?: number; status?: string; page?: number; per_page?: number }): Promise<ListResult<WorkflowRunItem>> {
    const response = await apiClient.get(`/agents/workflow-runs${buildQuery(params)}`)
    return unwrapList<WorkflowRunItem>(response)
  }

  async getWorkflowStepStats(limit = 30): Promise<WorkflowStepStats> {
    return unwrapData<WorkflowStepStats>(await apiClient.get(`/agents/workflows/step-stats${buildQuery({ limit })}`))
  }

  async getWorkflowStepDurationHistogram(limit = 10): Promise<WorkflowStepDurationHistogram> {
    return unwrapData<WorkflowStepDurationHistogram>(await apiClient.get(`/agents/workflows/step-duration-histogram${buildQuery({ limit })}`))
  }

  async getWorkflowRunDurationPercentiles(days = 30): Promise<WorkflowRunDurationPercentiles> {
    return unwrapData<WorkflowRunDurationPercentiles>(await apiClient.get(`/agents/workflows/run-duration-percentiles${buildQuery({ days })}`))
  }

  async getWorkflowStepFailureRate(days = 30, limit = 15): Promise<WorkflowStepFailureRate> {
    return unwrapData<WorkflowStepFailureRate>(await apiClient.get(`/agents/workflows/step-failure-rate${buildQuery({ days, limit })}`))
  }

  async getWorkflowStepCofailureMatrix(days = 30, limit = 8): Promise<WorkflowStepCofailureMatrix> {
    return unwrapData<WorkflowStepCofailureMatrix>(await apiClient.get(`/agents/workflows/step-cofailure-matrix${buildQuery({ days, limit })}`))
  }

  async getWorkflowStepRetryTopology(days = 30, limit = 15): Promise<WorkflowStepRetryTopology> {
    return unwrapData<WorkflowStepRetryTopology>(await apiClient.get(`/agents/workflows/step-retry-topology${buildQuery({ days, limit })}`))
  }

  async getWorkflowStepHourlyDistribution(days = 30, limit = 10): Promise<WorkflowStepHourlyDistribution> {
    return unwrapData<WorkflowStepHourlyDistribution>(await apiClient.get(`/agents/workflows/step-hourly-distribution${buildQuery({ days, limit })}`))
  }

  async getWorkflowFailedStepsByDuration(days = 30, limit = 20): Promise<WorkflowFailedStepsByDuration> {
    return unwrapData<WorkflowFailedStepsByDuration>(await apiClient.get(`/agents/workflows/failed-steps/by-duration${buildQuery({ days, limit })}`))
  }

  async getWorkflowRunTrend(days = 30): Promise<WorkflowRunTrend> {
    return unwrapData<WorkflowRunTrend>(await apiClient.get(`/agents/workflows/run-trend${buildQuery({ days })}`))
  }

  async getWorkflowSuccessRateByWorkflow(days = 30, limit = 10): Promise<WorkflowSuccessRateByWorkflow> {
    return unwrapData<WorkflowSuccessRateByWorkflow>(await apiClient.get(`/agents/workflows/success-rate-by-workflow${buildQuery({ days, limit })}`))
  }

  async getExperiencesStats(): Promise<ExperiencesStats> {
    return unwrapData<ExperiencesStats>(await apiClient.get('/agents/experiences/stats'))
  }

  async getExperiencesLowConfidence(maxConfidence = 0.5, limit = 20): Promise<ExperiencesLowConfidence> {
    return unwrapData<ExperiencesLowConfidence>(await apiClient.get(`/agents/experiences/low-confidence${buildQuery({ max_confidence: maxConfidence, limit })}`))
  }

  async getExperiencesScatter(limit = 200): Promise<ExperiencesScatter> {
    return unwrapData<ExperiencesScatter>(await apiClient.get(`/agents/experiences/scatter${buildQuery({ limit })}`))
  }

  async getExperiencesReuseTrend(days = 30): Promise<ExperiencesReuseTrend> {
    return unwrapData<ExperiencesReuseTrend>(await apiClient.get(`/agents/experiences/reuse-trend${buildQuery({ days })}`))
  }

  async getExperiencesConfidenceDecayForecast(days = 30): Promise<ExperiencesConfidenceDecayForecast> {
    return unwrapData<ExperiencesConfidenceDecayForecast>(await apiClient.get(`/agents/experiences/confidence-decay-forecast${buildQuery({ days })}`))
  }

  async getExperiencesDecayByDomain(limit = 15): Promise<ExperiencesDecayByDomain> {
    return unwrapData<ExperiencesDecayByDomain>(await apiClient.get(`/agents/experiences/decay-by-domain${buildQuery({ limit })}`))
  }

  async getExperiencesDecayByTaskType(limit = 15): Promise<ExperiencesDecayByTaskType> {
    return unwrapData<ExperiencesDecayByTaskType>(await apiClient.get(`/agents/experiences/decay-by-task-type${buildQuery({ limit })}`))
  }

  async getExperiencesConfidenceDistribution(): Promise<ExperiencesConfidenceDistribution> {
    return unwrapData<ExperiencesConfidenceDistribution>(await apiClient.get(`/agents/experiences/confidence-distribution`))
  }

  async getExperiencesSourceDistribution(): Promise<ExperiencesSourceDistribution> {
    return unwrapData<ExperiencesSourceDistribution>(await apiClient.get(`/agents/experiences/source-distribution`))
  }

  async getExperiencesPropagationChain(limit = 10): Promise<ExperiencesPropagationChain> {
    return unwrapData<ExperiencesPropagationChain>(await apiClient.get(`/agents/experiences/propagation-chain${buildQuery({ limit })}`))
  }

  async getExperiencesSkillCoverageRadar(limit = 6, domains = 8): Promise<ExperiencesSkillCoverageRadar> {
    return unwrapData<ExperiencesSkillCoverageRadar>(await apiClient.get(`/agents/experiences/skill-coverage-radar${buildQuery({ limit, domains })}`))
  }

  async getWorkflowFailureCorrelation(days = 30, windowHours = 2): Promise<WorkflowFailureCorrelation> {
    return unwrapData<WorkflowFailureCorrelation>(await apiClient.get(`/agents/workflows/failure-correlation${buildQuery({ days, window_hours: windowHours })}`))
  }

  async getWorkflowFailureCorrelationByStep(days = 30, windowHours = 2): Promise<WorkflowFailureCorrelationByStep> {
    return unwrapData<WorkflowFailureCorrelationByStep>(await apiClient.get(`/agents/workflows/failure-correlation-by-step${buildQuery({ days, window_hours: windowHours })}`))
  }

  async getAgentProductivity(days = 30, limit = 20): Promise<AgentProductivity> {
    return unwrapData<AgentProductivity>(await apiClient.get(`/agents/productivity${buildQuery({ days, limit })}`))
  }

  async getAgentRunResourceUsage(days = 30, limit = 10): Promise<AgentRunResourceUsage> {
    return unwrapData<AgentRunResourceUsage>(await apiClient.get(`/agents/run-resource-usage${buildQuery({ days, limit })}`))
  }

  async getAgentProductivityWeeklyComparison(limit = 10): Promise<AgentProductivityWeeklyComparison> {
    return unwrapData<AgentProductivityWeeklyComparison>(await apiClient.get(`/agents/productivity/weekly-comparison${buildQuery({ limit })}`))
  }

  async getAgentProductivityTrend(days = 30): Promise<AgentProductivityTrend> {
    return unwrapData<AgentProductivityTrend>(await apiClient.get(`/agents/productivity/trend${buildQuery({ days })}`))
  }

  async getAgentProductivityAlerts(): Promise<AgentProductivityAlerts> {
    return unwrapData<AgentProductivityAlerts>(await apiClient.get('/agents/productivity/alerts'))
  }

  async getAgentProductivityByKind(days = 30): Promise<AgentProductivityByKind> {
    return unwrapData<AgentProductivityByKind>(await apiClient.get(`/agents/productivity/by-kind${buildQuery({ days })}`))
  }

  async getAgentProductivityHourlyHeatmap(days = 30, limit = 15): Promise<AgentProductivityHourlyHeatmap> {
    return unwrapData<AgentProductivityHourlyHeatmap>(await apiClient.get(`/agents/productivity/hourly-heatmap${buildQuery({ days, limit })}`))
  }

  async getAgentProductivityCalendarHeatmap(days = 90, limit = 10): Promise<AgentProductivityCalendarHeatmap> {
    return unwrapData<AgentProductivityCalendarHeatmap>(await apiClient.get(`/agents/productivity/calendar-heatmap${buildQuery({ days, limit })}`))
  }

  async getAgentFailureReasons(days = 30, limit = 15): Promise<AgentFailureReasons> {
    return unwrapData<AgentFailureReasons>(await apiClient.get(`/agents/failure-reasons${buildQuery({ days, limit })}`))
  }

  async getAgentFailureErrorPatterns(days = 30, limit = 10, prefixLen = 40): Promise<AgentFailureErrorPatterns> {
    return unwrapData<AgentFailureErrorPatterns>(await apiClient.get(`/agents/failure-error-patterns${buildQuery({ days, limit, prefix_len: prefixLen })}`))
  }

  async getWorkflowStepDependencyBottleneck(days = 30, limit = 10): Promise<WorkflowStepDependencyBottleneck> {
    return unwrapData<WorkflowStepDependencyBottleneck>(await apiClient.get(`/agents/workflows/step-dependency-bottleneck${buildQuery({ days, limit })}`))
  }

  async getAgentCapabilityGapAnalysis(limit = 10, minConfidence = 0.5): Promise<AgentCapabilityGapAnalysis> {
    return unwrapData<AgentCapabilityGapAnalysis>(await apiClient.get(`/agents/capability-gap-analysis${buildQuery({ limit, min_confidence: minConfidence })}`))
  }

  async getCollaborationGraphTimeline(days = 14, bucket = 'day', limit = 50): Promise<CollaborationGraphTimeline> {
    return unwrapData<CollaborationGraphTimeline>(await apiClient.get(`/agents/collaboration-graph-timeline${buildQuery({ days, bucket, limit })}`))
  }

  async getTaskAllocationFairness(days = 30): Promise<TaskAllocationFairness> {
    return unwrapData<TaskAllocationFairness>(await apiClient.get(`/agents/task-allocation-fairness${buildQuery({ days })}`))
  }

  async getWorkflowSimilarityMatrix(days = 30, limit = 5, maxRuns = 20): Promise<WorkflowSimilarityMatrix> {
    return unwrapData<WorkflowSimilarityMatrix>(await apiClient.get(`/agents/workflows/similarity-matrix${buildQuery({ days, limit, max_runs: maxRuns })}`))
  }

  async getAgentRunResourceTrend(days = 14, limit = 10): Promise<AgentRunResourceTrend> {
    return unwrapData<AgentRunResourceTrend>(await apiClient.get(`/agents/run-resource-trend${buildQuery({ days, limit })}`))
  }

  async getAgentSkillMatching(limit = 10): Promise<AgentSkillMatching> {
    return unwrapData<AgentSkillMatching>(await apiClient.get(`/agents/skill-matching${buildQuery({ limit })}`))
  }

  async getWorkflowStepDurationHistogram(days = 30, limit = 10): Promise<StepDurationHistogramResult> {
    return unwrapData<StepDurationHistogramResult>(await apiClient.get(`/agents/workflows/step-duration-histogram${buildQuery({ days, limit })}`))
  }

  async getAgentTaskHandoffStats(days = 30, limit = 10): Promise<AgentTaskHandoffStats> {
    return unwrapData<AgentTaskHandoffStats>(await apiClient.get(`/agents/task-handoff-stats${buildQuery({ days, limit })}`))
  }

  async getChannelActivityTrend(days = 14, limit = 10): Promise<ChannelActivityTrend> {
    return unwrapData<ChannelActivityTrend>(await apiClient.get(`/agents/channels/activity-trend${buildQuery({ days, limit })}`))
  }

  async getAgentWorkloadForecast(days = 30, horizon = 3, limit = 10): Promise<AgentWorkloadForecast> {
    return unwrapData<AgentWorkloadForecast>(await apiClient.get(`/agents/workload-forecast${buildQuery({ days, horizon, limit })}`))
  }

  async getKnowledgePropagationNetwork(days = 90, limit = 20): Promise<KnowledgePropagationNetwork> {
    return unwrapData<KnowledgePropagationNetwork>(await apiClient.get(`/agents/knowledge-propagation-network${buildQuery({ days, limit })}`))
  }

  async getWorkflowStepBottleneckTimeline(days = 30, limit = 8): Promise<WorkflowStepBottleneckTimeline> {
    return unwrapData<WorkflowStepBottleneckTimeline>(await apiClient.get(`/agents/workflows/step-bottleneck-timeline${buildQuery({ days, limit })}`))
  }

  async getProtocolDecisionLatency(days = 30): Promise<ProtocolDecisionLatency> {
    return unwrapData<ProtocolDecisionLatency>(await apiClient.get(`/agents/protocol-decision-latency${buildQuery({ days })}`))
  }

  async getAgentSpecializationEvolution(weeks = 12, limit = 8): Promise<AgentSpecializationEvolution> {
    return unwrapData<AgentSpecializationEvolution>(await apiClient.get(`/agents/specialization-evolution${buildQuery({ weeks, limit })}`))
  }

  async getAgentExperiencesDecayAlerts(days = 30, minDrop = 0.1, limit = 10): Promise<AgentExperiencesDecayAlerts> {
    return unwrapData<AgentExperiencesDecayAlerts>(await apiClient.get(`/agents/experiences/decay-alerts${buildQuery({ days, min_drop: minDrop, limit })}`))
  }

  async getAgentCrossProjectEfficiency(days = 30, limit = 20): Promise<AgentCrossProjectEfficiency> {
    return unwrapData<AgentCrossProjectEfficiency>(await apiClient.get(`/agents/cross-project-efficiency${buildQuery({ days, limit })}`))
  }

  async getAgentCapabilitySupplyDemand(limit = 20): Promise<AgentCapabilitySupplyDemand> {
    return unwrapData<AgentCapabilitySupplyDemand>(await apiClient.get(`/agents/capability-supply-demand${buildQuery({ limit })}`))
  }

  async getWorkflowStructuralComplexity(limit = 20): Promise<WorkflowStructuralComplexity> {
    return unwrapData<WorkflowStructuralComplexity>(await apiClient.get(`/agents/workflows/structural-complexity${buildQuery({ limit })}`))
  }

  async getAgentIdleRanking(limit = 20): Promise<AgentIdleRanking> {
    return unwrapData<AgentIdleRanking>(await apiClient.get(`/agents/idle-ranking${buildQuery({ limit })}`))
  }

  async getConflictsSandboxCorrelation(days = 30, windowHours = 2): Promise<ConflictsSandboxCorrelation> {
    return unwrapData<ConflictsSandboxCorrelation>(await apiClient.get(`/agents/conflicts/sandbox-correlation${buildQuery({ days, window_hours: windowHours })}`))
  }

  async getAgentHealth(days = 30): Promise<AgentHealth> {
    return unwrapData<AgentHealth>(await apiClient.get(`/agents/health${buildQuery({ days })}`))
  }

  async getAgentHealthTrend(days = 30, agentId?: number): Promise<AgentHealthTrend> {
    return unwrapData<AgentHealthTrend>(await apiClient.get(`/agents/health/trend${buildQuery({ days, agent_id: agentId })}`))
  }

  async getAgentHealthStateTransitions(days = 30): Promise<AgentHealthStateTransitions> {
    return unwrapData<AgentHealthStateTransitions>(await apiClient.get(`/agents/health/state-transitions${buildQuery({ days })}`))
  }

  async getAgentHealthAlerts(weights: HealthWeights = {}): Promise<AgentHealthAlerts> {
    return unwrapData<AgentHealthAlerts>(await apiClient.get(`/agents/health/alerts${buildQuery(weights)}`))
  }

  async getWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.get(`/agents/workflow-runs/${runId}`))
  }

  async getWorkflowRunConsole(runId: number, params?: { log_limit?: number }): Promise<WorkflowRunConsoleResult> {
    return unwrapData<WorkflowRunConsoleResult>(await apiClient.get(`/agents/workflow-runs/${runId}/console${buildQuery(params)}`))
  }

  async cancelWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/cancel`))
  }

  async pauseWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/pause`))
  }

  async resumeWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/resume`))
  }

  async retryWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/retry`))
  }

  async completeWorkflowStep(runId: number, stepKey: string, data: { success?: boolean; error?: string }): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/steps/${stepKey}/complete`, data))
  }

  async escalateOverdueTasks(data?: { overdue_after_days?: number }): Promise<{ escalated_count: number; task_ids: number[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/escalate-overdue', data || {}))
  }

  async getAuditLogs(params?: { action?: string; resource_type?: string; resource_id?: number; actor_type?: string; project_id?: number; page?: number; per_page?: number }): Promise<ListResult<any>> {
    const response = await apiClient.get(`/agents/audit-logs${buildQuery(params)}`)
    return unwrapList<any>(response)
  }

  async getSecurityEvents(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; page?: number; per_page?: number }): Promise<ListResult<SecurityEventItem>> {
    const response = await apiClient.get(`/agents/security/events${buildQuery(params)}`)
    return unwrapList<SecurityEventItem>(response)
  }

  /** Export unified security events as CSV or JSON. Returns the raw text.
   *  Uses a raw fetch (not apiClient) because the client forces JSON parsing. */
  async exportSecurityEvents(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; search?: string; format?: 'csv' | 'json' }): Promise<string> {
    const token = localStorage.getItem('access_token')
    const url = `${getApiBaseUrl()}/agents/security/events/export${buildQuery(params)}`
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      throw new Error(`Export failed: HTTP ${response.status}`)
    }
    return await response.text()
  }

  /** Daily aggregation of security events for trend visualization (same filters as list). */
  async getSecurityEventsDailyTrend(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; search?: string }): Promise<SecurityDailyTrend> {
    const response = await apiClient.get(`/agents/security/events/daily-trend${buildQuery(params)}`)
    return unwrapData<SecurityDailyTrend>(response)
  }

  /** Per-agent aggregation of security events for ranking (same filters as list). */
  async getSecurityEventsByAgent(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; search?: string }): Promise<SecurityByAgent> {
    const response = await apiClient.get(`/agents/security/events/by-agent${buildQuery(params)}`)
    return unwrapData<SecurityByAgent>(response)
  }

  async healthCheck(): Promise<{ stale_agents: number; stale_agent_ids: number[]; expired_leases: number; escalated_tasks: number; escalated_task_ids: number[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/health-check'))
  }

  // Project Members (RBAC)
  async getProjectMembers(projectId: number): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/projects/${projectId}/members`))
  }

  async addProjectMember(projectId: number, data: { user_id: number; role: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/projects/${projectId}/members`, data))
  }

  async updateProjectMember(projectId: number, memberId: number, data: { role: string }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/projects/${projectId}/members/${memberId}`, data))
  }

  async removeProjectMember(projectId: number, memberId: number): Promise<void> {
    await apiClient.delete(`/agents/projects/${projectId}/members/${memberId}`)
  }

  // Agent Broadcast
  async broadcastMessage(agentId: number, content: string): Promise<{ recipient_count: number }> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/broadcast`, { content }))
  }

  // Collaboration Metrics
  async getCollaborationMetrics(params?: { project_id?: number; days?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/dashboard/metrics${buildQuery(params)}`))
  }

  // Workflow Triggers
  async getWorkflowTriggers(params?: { workflow_id?: number; is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<any>> {
    return unwrapList<any>(await apiClient.get(`/agents/workflow-triggers${buildQuery(params)}`))
  }

  async createWorkflowTrigger(data: { workflow_id: number; name: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/workflow-triggers', data))
  }

  async updateWorkflowTrigger(triggerId: number, data: { name?: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/workflow-triggers/${triggerId}`, data))
  }

  async deleteWorkflowTrigger(triggerId: number): Promise<void> {
    await apiClient.delete(`/agents/workflow-triggers/${triggerId}`)
  }

  async fireDueTriggers(): Promise<{ fired_count: number; fired: any[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/fire-triggers'))
  }

  async markOfflineAgents(): Promise<{ marked_offline: number; agent_ids: number[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/mark-offline-agents'))
  }

  async timeoutWorkflowSteps(): Promise<{ timed_out: number; steps: any[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/timeout-workflow-steps'))
  }

  async getRecommendedTasks(agentId: number, params?: { limit?: number; project_id?: number }): Promise<any[]> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/recommended-tasks${buildQuery(params)}`))
  }

  // Collaboration Channels
  async listChannels(params?: { project_id?: number; task_id?: number }): Promise<any[]> {
    return unwrapData<any>(await apiClient.get(`/agents/channels${buildQuery(params)}`))
  }

  async createChannel(data: { name: string; description?: string; project_id?: number; task_id?: number; agent_ids?: number[] }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/channels', data))
  }

  async getChannel(channelId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/channels/${channelId}`))
  }

  async updateChannel(channelId: number, data: { name?: string; description?: string; is_active?: boolean }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/channels/${channelId}`, data))
  }

  async deleteChannel(channelId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/channels/${channelId}`))
  }

  async addChannelMember(channelId: number, data: { agent_id: number; role?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/channels/${channelId}/members`, data))
  }

  async removeChannelMember(channelId: number, memberId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/channels/${channelId}/members/${memberId}`))
  }

  async listChannelMessages(channelId: number, params?: { page?: number; per_page?: number }): Promise<any[]> {
    return unwrapData<any>(await apiClient.get(`/agents/channels/${channelId}/messages${buildQuery(params)}`))
  }

  async sendChannelMessage(channelId: number, data: { agent_id?: number; content: string; message_type?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/channels/${channelId}/messages`, data))
  }

  // Agent self-registration & discovery
  async selfRegisterAgent(data: { name: string; description?: string; kind?: string; provider?: string; model?: string; capabilities?: string[]; config?: Record<string, unknown>; collaboration_role?: string }): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.post('/agents/self-register', data))
  }

  async discoverAgents(params?: { capability?: string[]; collaboration_role?: string; kind?: string; status?: string }): Promise<Agent[]> {
    return unwrapData<any>(await apiClient.get(`/agents/discover${buildQuery(params)}`))
  }

  // Agent Direct Messaging
  async sendAgentMessage(fromAgentId: number, toAgentId: number, data: { content: string; task_id?: number; message_type?: string; metadata?: Record<string, unknown> }): Promise<{ delivered: boolean; to_agent_id: number; to_agent_name: string }> {
    return unwrapData<any>(await apiClient.post(`/agents/${fromAgentId}/message/${toAgentId}`, data))
  }

  async getAgentMessages(agentId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<any>> {
    return unwrapList<any>(await apiClient.get(`/agents/${agentId}/messages${buildQuery(params)}`))
  }

  async getAgentCollaborators(agentId: number, params?: { limit?: number }): Promise<AgentCollaboratorsResult> {
    return unwrapData<AgentCollaboratorsResult>(await apiClient.get(`/agents/${agentId}/collaborators${buildQuery(params)}`))
  }

  async getCollaborationGraph(params?: { limit?: number; since?: string; until?: string }): Promise<CollaborationGraph> {
    return unwrapData<CollaborationGraph>(await apiClient.get(`/agents/collaboration-graph${buildQuery(params)}`))
  }

  // Workflow Templates
  async getWorkflowTemplates(params?: { category?: string }): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/workflow-templates${buildQuery(params)}`))
  }

  async getWorkflowTemplate(templateKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflow-templates/${templateKey}`))
  }

  async instantiateWorkflowTemplate(templateKey: string, data?: { name?: string; project_id?: number; root_task_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/workflow-templates/${templateKey}/instantiate`, data || {}))
  }

  // Collaboration Templates
  async listCollaborationTemplates(params?: { category?: string }): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/collaboration-templates${buildQuery(params)}`))
  }

  async createCollaborationTemplate(data: { name: string; agent_specs: any[]; description?: string; category?: string; workflow_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/collaboration-templates', data))
  }

  async deleteCollaborationTemplate(templateId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/collaboration-templates/${templateId}`))
  }

  async instantiateCollaborationTemplate(templateKey: string, data?: { project_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/collaboration-templates/${templateKey}/instantiate`, data || {}))
  }

  // Knowledge Base
  async listKnowledgeEntries(agentId: number, params?: { domain?: string; entry_type?: string; tag?: string; search?: string; include_content?: boolean; page?: number; per_page?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/knowledge${buildQuery(params)}`))
  }

  async createKnowledgeEntry(agentId: number, data: { title: string; content: string; domain?: string; tags?: string[]; entry_type?: string; source_task_id?: number; confidence?: number; shared_with_project?: boolean; project_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/knowledge`, data))
  }

  async getKnowledgeEntry(agentId: number, entryId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/knowledge/${entryId}`))
  }

  async updateKnowledgeEntry(agentId: number, entryId: number, data: { title?: string; content?: string; domain?: string; tags?: string[]; confidence?: number; is_valid?: boolean; shared_with_project?: boolean }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/${agentId}/knowledge/${entryId}`, data))
  }

  async deleteKnowledgeEntry(agentId: number, entryId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/${agentId}/knowledge/${entryId}`))
  }

  async searchKnowledge(agentId: number, params?: { q?: string; domain?: string; tags?: string; entry_type?: string; limit?: number }): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/knowledge/search${buildQuery(params)}`))
  }

  async listSharedKnowledge(params?: { domain?: string; entry_type?: string; search?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/knowledge/shared${buildQuery(params)}`))
  }

  async autoExtractKnowledge(agentId: number, limit?: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/knowledge/auto-extract`, { limit }))
  }

  // Workflow Version Management
  async listWorkflowVersions(workflowId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflows/${workflowId}/versions`))
  }

  async getWorkflowVersion(workflowId: number, versionNumber: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflows/${workflowId}/versions/${versionNumber}`))
  }

  async rollbackWorkflow(workflowId: number, version: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/workflows/${workflowId}/rollback`, { version }))
  }

  async diffWorkflowVersions(workflowId: number, v1: number, v2: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflows/${workflowId}/diff/${v1}/${v2}`))
  }

  // Collaboration Protocols
  async listProtocols(params?: { project_id?: number; status?: string; protocol_type?: string; initiator_agent_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/protocols${buildQuery(params)}`))
  }

  async createProtocol(data: { protocol_type: string; title: string; initiator_agent_id: number; description?: string; channel_id?: number; project_id?: number; task_id?: number; config?: Record<string, unknown>; deadline?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/protocols', data))
  }

  async getProtocol(protocolId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/protocols/${protocolId}`))
  }

  async respondToProtocol(protocolId: number, data: { agent_id: number; message_type: string; content?: string; payload?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/protocols/${protocolId}/respond`, data))
  }

  async resolveProtocol(protocolId: number, data: { resolution: string; result?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/protocols/${protocolId}/resolve`, data))
  }

  // Agent Reputation
  async getAgentReputation(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/reputation`))
  }

  async listReputations(): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get('/agents/reputations'))
  }

  async recalculateReputation(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/reputation/recalculate`, {}))
  }

  async getAgentReputationHistory(
    agentId: number,
    params?: { limit?: number; since?: string; until?: string }
  ): Promise<ReputationHistory> {
    return unwrapData<ReputationHistory>(
      await apiClient.get(`/agents/${agentId}/reputation/history${buildQuery(params)}`)
    )
  }

  // ---- Agent Experience (Collective Intelligence) ----

  async listAgentExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<any>> {
    const query = buildQuery(params)
    return unwrapData<PaginatedResponse<any>>(await apiClient.get(`/agents/${agentId}/experiences${query}`))
  }

  async createAgentExperience(agentId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences`, data))
  }

  async getAgentExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/experiences/${experienceId}`))
  }

  async updateAgentExperience(agentId: number, experienceId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/${agentId}/experiences/${experienceId}`, data))
  }

  async deleteAgentExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/${agentId}/experiences/${experienceId}`))
  }

  async recommendExperiences(agentId: number, params?: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/experiences/recommend${query}`))
  }

  async shareAgentExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/share`, {}))
  }

  async learnFromExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/learn`, {}))
  }

  async listSharedExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<any>> {
    const query = buildQuery(params)
    return unwrapData<PaginatedResponse<any>>(await apiClient.get(`/agents/${agentId}/experiences/shared${query}`))
  }

  async autoExtractExperiences(agentId: number): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.post(`/agents/${agentId}/experiences/auto-extract`, {}))
  }

  // ---- Cross-Project Agent Collaboration ----

  async authorizeCrossProjectAgent(data: { agent_id: number; project_id: number; role_in_project?: string; capabilities_override?: string[]; max_concurrent_tasks?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/cross-project/authorize', data))
  }

  async revokeCrossProjectAgent(agentId: number, projectId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/cross-project/revoke', { agent_id: agentId, project_id: projectId }))
  }

  async listAgentCrossProjects(agentId: number): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/cross-project`))
  }

  async listProjectExternalAgents(projectId: number): Promise<PaginatedResponse<any>> {
    return unwrapData<PaginatedResponse<any>>(await apiClient.get(`/agents/projects/${projectId}/external-agents`))
  }

  async discoverCrossProjectAgents(params?: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/cross-project/discover-agents${query}`))
  }

  async findCapableAgentsCrossProject(params: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/cross-project/capable-agents${query}`))
  }

  // ---- Experience Decay & Validation ----

  async applyExperienceDecay(agentId: number, params?: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/decay`, params || {}))
  }

  async validateExperience(agentId: number, experienceId: number, data: { is_accurate: boolean }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/validate`, data))
  }

  async getExperienceValidationStats(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/experiences/validation-stats`))
  }

  async decayAllExperiences(params?: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/decay-all-experiences', params || {}))
  }

  // ---- Adaptive Capabilities ----

  async suggestCapabilityAdaptation(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/adapt-capabilities`))
  }

  async applyCapabilityAdaptation(agentId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/adapt-capabilities`, data))
  }

  // ---- Cross-Project Task Discovery & Assignment ----

  async findCrossProjectTasks(agentId: number, params?: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/cross-project-tasks${query}`))
  }

  async claimCrossProjectTask(agentId: number, taskId: number, data?: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/claim-cross-project-task/${taskId}`, data || {}))
  }

  // ---- Protocol Analytics & Deliberation ----

  async getProtocolAnalytics(params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/protocols/analytics${query}`))
  }

  async addDeliberationMessage(protocolId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/protocols/${protocolId}/deliberate`, data))
  }

  // ---- Increment 85: Agent collaboration sandbox ----

  async listSandboxes(params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/sandboxes${query}`))
  }

  async createSandbox(data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/sandboxes', data))
  }

  async getSandbox(sandboxId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/sandboxes/${sandboxId}`))
  }

  async updateSandbox(sandboxId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/sandboxes/${sandboxId}`, data))
  }

  async deleteSandbox(sandboxId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/sandboxes/${sandboxId}`))
  }

  async bindAgentSandbox(agentId: number, sandboxId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/sandbox/bind`, { sandbox_id: sandboxId }))
  }

  async getAgentSandbox(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/sandbox`))
  }

  async checkSandboxAction(sandboxId: number, action: string, target: string): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/sandboxes/${sandboxId}/check`, { action, target }))
  }

  async startSandboxExecution(sandboxId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/sandboxes/${sandboxId}/executions`, data))
  }

  async completeSandboxExecution(executionId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/executions/${executionId}/complete`, data))
  }

  async revokeSandboxExecution(executionId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/executions/${executionId}/revoke`, {}))
  }

  async reportSandboxViolation(executionId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/executions/${executionId}/violation`, data))
  }

  async getSandboxExecution(executionId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/executions/${executionId}`))
  }

  async listSandboxExecutions(sandboxId: number, params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/sandboxes/${sandboxId}/executions${query}`))
  }

  async getSandboxDashboard(): Promise<any> {
    return unwrapData<any>(await apiClient.get('/agents/sandboxes/dashboard'))
  }

  async getSandboxViolationTrend(days = 30): Promise<SandboxViolationTrend> {
    return unwrapData<SandboxViolationTrend>(await apiClient.get(`/agents/sandboxes/violation-trend${buildQuery({ days })}`))
  }

  async getSandboxViolationsByAgent(days = 30, limit = 10): Promise<SandboxViolationsByAgent> {
    return unwrapData<SandboxViolationsByAgent>(await apiClient.get(`/agents/sandboxes/violations-by-agent${buildQuery({ days, limit })}`))
  }

  async getSandboxTemplateUsage(): Promise<SandboxTemplateUsage> {
    return unwrapData<SandboxTemplateUsage>(await apiClient.get('/agents/sandboxes/template-usage'))
  }

  async getStepSandboxExecution(runId: number, stepKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/sandbox-execution`))
  }

  async reportStepSandboxViolation(runId: number, stepKey: string, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/sandbox-violation`, data))
  }

  async setStepRuntimeOverride(runId: number, stepKey: string, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/override`, data))
  }

  async clearStepRuntimeOverride(runId: number, stepKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/override`))
  }

  async getStepEffectiveParams(runId: number, stepKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/effective-params`))
  }

  // ---- Increment 89: Conflict detection & resolution ----

  async scanConflicts(): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/conflicts/scan', {}))
  }

  async listConflicts(params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/conflicts${query}`))
  }

  async getConflict(conflictId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/conflicts/${conflictId}`))
  }

  async resolveConflict(conflictId: number, strategy: string, description?: string): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/conflicts/${conflictId}/resolve`, { strategy, description }))
  }

  async acknowledgeConflict(conflictId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/conflicts/${conflictId}/acknowledge`, {}))
  }

  async ignoreConflict(conflictId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/conflicts/${conflictId}/ignore`, {}))
  }

  async getConflictsDashboard(): Promise<ConflictsDashboard> {
    return unwrapData<ConflictsDashboard>(await apiClient.get('/agents/conflicts/dashboard'))
  }

  async getConflictsTrend(days = 30): Promise<ConflictsTrend> {
    return unwrapData<ConflictsTrend>(await apiClient.get(`/agents/conflicts/trend${buildQuery({ days })}`))
  }

  async getConflictsByAgent(limit = 10): Promise<ConflictsByAgent> {
    return unwrapData<ConflictsByAgent>(await apiClient.get(`/agents/conflicts/by-agent${buildQuery({ limit })}`))
  }

  async getConflictsStrategyStats(): Promise<ConflictsStrategyStats> {
    return unwrapData<ConflictsStrategyStats>(await apiClient.get('/agents/conflicts/strategy-stats'))
  }

  async listSandboxTemplates(): Promise<any> {
    return unwrapData<any>(await apiClient.get('/agents/sandbox-templates'))
  }

  async instantiateSandboxTemplate(templateKey: string, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/sandbox-templates/${encodeURIComponent(templateKey)}/instantiate`, data))
  }

  async autoResolveConflicts(): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/auto-resolve-conflicts', {}))
  }

  async orchestrate(): Promise<OrchestrationResult> {
    return unwrapData<OrchestrationResult>(await apiClient.post('/agents/maintenance/orchestrate', {}))
  }

  async getOrchestratorStatus(): Promise<OrchestratorStatus> {
    return unwrapData<OrchestratorStatus>(await apiClient.get('/agents/maintenance/orchestrator/status'))
  }

  async listOrchestratorHistory(params?: { limit?: number; triggered_by?: string }): Promise<OrchestratorHistoryResult> {
    const response = await apiClient.get(`/agents/maintenance/orchestrator/history${buildQuery(params)}`)
    return unwrapData<OrchestratorHistoryResult>(response)
  }

  async getOrchestratorDailyTrend(params?: { triggered_by?: string; since?: string; until?: string }): Promise<OrchestratorDailyTrend> {
    const response = await apiClient.get(`/agents/maintenance/orchestrator/daily-trend${buildQuery(params)}`)
    return unwrapData<OrchestratorDailyTrend>(response)
  }
}

export const agentsApi = new AgentsApi()
