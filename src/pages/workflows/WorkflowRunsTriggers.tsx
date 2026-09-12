import { useMemo, useState } from 'react'
import { message, Card, Table, Tag, Button, Space, Typography, Empty } from 'antd'
import WorkflowRunsCard from './WorkflowRunsCard'
import ScheduledTriggersCard from './ScheduledTriggersCard'

interface Props {
  runs: any
  runsLoading: any
  triggers: any
  triggerLoading: any
  handleCancelRun: any
  handleDeleteTrigger: any
  handlePauseRun: any
  handleResumeRun: any
  handleRetryRun: any
  handleToggleTrigger: any
  loadRuns: any
  loadTriggers: any
  openTriggerModal: any
  viewRun: any
  workflows: any
}

export default function WorkflowRunsTriggers(props: Props) {
  const { runs,
    runsLoading,
    triggers,
    triggerLoading,
    handleCancelRun,
    handleDeleteTrigger,
    handlePauseRun,
    handleResumeRun,
    handleRetryRun,
    handleToggleTrigger,
    loadRuns,
    loadTriggers,
    openTriggerModal,
    viewRun,
    workflows } = props

  return (
    <>
      {/* Workflow runs */}
      <WorkflowRunsCard
        runs={runs}
        runsLoading={runsLoading}
        onRefresh={loadRuns}
        onViewRun={viewRun}
        onPauseRun={handlePauseRun}
        onResumeRun={handleResumeRun}
        onRetryRun={handleRetryRun}
        onCancelRun={handleCancelRun}
      />

      {/* Scheduled Triggers */}
      <ScheduledTriggersCard
        triggers={triggers}
        triggerLoading={triggerLoading}
        workflows={workflows}
        onRefresh={loadTriggers}
        onAddTrigger={() => {
          if (workflows.length === 0) {
            message.warning('请先创建工作流')
            return
          }
          openTriggerModal(workflows[0].id)
        }}
        onToggleTrigger={handleToggleTrigger}
        onDeleteTrigger={handleDeleteTrigger}
      />

    </>
  )
}
