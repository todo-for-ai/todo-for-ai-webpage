import { Space, Typography } from 'antd'
import { usePageTranslation } from '../../../../../i18n/hooks/useTranslation'
import { useAgentActivity } from './hooks/useAgentActivity'
import { ActivityFilters } from './components/ActivityFilters'
import { ActivitySummary } from './components/ActivitySummary'
import { ActivityTable } from './components/ActivityTable'
import { ActivityDetailModal } from './components/ActivityDetailModal'
import type { AgentActivityTabProps } from './types'
import './AgentActivityTab.css'

const { Text } = Typography

export function AgentActivityTab({ workspaceId, agentId, active }: AgentActivityTabProps) {
  const { tp } = usePageTranslation('agents')
  const {
    loading,
    items,
    pagination,
    setPagination,
    sourceSummary,
    levelSummary,
    detailItem,
    setDetailItem,
    source,
    setSource,
    level,
    setLevel,
    eventType,
    setEventType,
    eventTypeInput,
    setEventTypeInput,
    query,
    setQuery,
    queryInput,
    setQueryInput,
    taskId,
    setTaskId,
    projectId,
    setProjectId,
    runId,
    setRunId,
    runIdInput,
    setRunIdInput,
    attemptId,
    setAttemptId,
    attemptIdInput,
    setAttemptIdInput,
    riskMin,
    setRiskMin,
    riskMax,
    setRiskMax,
    from,
    setFrom,
    to,
    setTo,
    activitySourceOptions,
    activityLevelOptions,
    getActivitySourceLabel,
    getActivityLevelLabel,
    activityLevelStatus,
    resetPagination,
  } = useAgentActivity({ workspaceId, agentId, active })

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
      per_page: pageSize,
    }))
  }

  return (
    <Space direction='vertical' className='agent-activity-tab' size={12}>
      <ActivityFilters
        source={source}
        level={level}
        eventType={eventType}
        eventTypeInput={eventTypeInput}
        query={query}
        queryInput={queryInput}
        taskId={taskId}
        projectId={projectId}
        runId={runId}
        runIdInput={runIdInput}
        attemptId={attemptId}
        attemptIdInput={attemptIdInput}
        riskMin={riskMin}
        riskMax={riskMax}
        from={from}
        to={to}
        activitySourceOptions={activitySourceOptions}
        activityLevelOptions={activityLevelOptions}
        onSourceChange={setSource}
        onLevelChange={setLevel}
        onEventTypeChange={setEventType}
        onEventTypeInputChange={setEventTypeInput}
        onTaskIdChange={setTaskId}
        onProjectIdChange={setProjectId}
        onRunIdChange={setRunId}
        onRunIdInputChange={setRunIdInput}
        onAttemptIdChange={setAttemptId}
        onAttemptIdInputChange={setAttemptIdInput}
        onRiskMinChange={setRiskMin}
        onRiskMaxChange={setRiskMax}
        onQueryChange={setQuery}
        onQueryInputChange={setQueryInput}
        onFromChange={setFrom}
        onToChange={setTo}
        onResetPagination={resetPagination}
      />
      <ActivitySummary
        sourceSummary={sourceSummary}
        levelSummary={levelSummary}
        getActivitySourceLabel={getActivitySourceLabel}
        getActivityLevelLabel={getActivityLevelLabel}
      />
      <ActivityTable
        loading={loading}
        items={items}
        pagination={pagination}
        activityLevelStatus={activityLevelStatus}
        getActivitySourceLabel={getActivitySourceLabel}
        getActivityLevelLabel={getActivityLevelLabel}
        onPaginationChange={handlePaginationChange}
        onRowClick={setDetailItem}
      />
      <Text type='secondary'>{tp('detail.activity.clickHint', { defaultValue: 'Click a row to view details.' })}</Text>
      <ActivityDetailModal
        detailItem={detailItem}
        getActivitySourceLabel={getActivitySourceLabel}
        getActivityLevelLabel={getActivityLevelLabel}
        onClose={() => setDetailItem(null)}
      />
    </Space>
  )
}

export default AgentActivityTab
