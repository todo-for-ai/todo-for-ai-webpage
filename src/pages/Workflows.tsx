import React, { useState } from 'react'
import { Button, Dropdown, Space, Upload } from 'antd'
import {
  ApartmentOutlined, DownOutlined, FormOutlined, ImportOutlined, PartitionOutlined, PlusOutlined,
} from '@ant-design/icons'
import { agentsApi } from '../api/agents'

// Extracted components
import WorkflowFormModal from './workflows/WorkflowFormModal'
import WorkflowCanvasModal from '../components/Workflow/canvas/WorkflowCanvasModal'
import WorkflowRunCanvasModal from '../components/Workflow/canvas/WorkflowRunCanvasModal'
import WorkflowRunDetailModal from './workflows/WorkflowRunDetailModal'
import WorkflowVersionModals from './workflows/WorkflowVersionModals'
import LaunchWorkflowModal from './workflows/LaunchWorkflowModal'
import TriggerCreationModal from './workflows/TriggerCreationModal'
import WorkflowRunConsole from './workflows/WorkflowRunConsole'
import WorkflowDefinitionsCard from './workflows/WorkflowDefinitionsCard'
import WorkflowRunsTriggers from './workflows/WorkflowRunsTriggers'
import WorkflowAnalyticsCards from './workflows/WorkflowAnalyticsCards'
import WorkflowTemplatesCard from './workflows/WorkflowTemplatesCard'

import { useWorkflowsData } from './workflows/useWorkflowsData'

const Workflows: React.FC = () => {
  const {
    agents,
    consoleData,
    consoleLoading,
    consoleOpen,
    createOpen,
    currentVersion,
    diffData,
    diffModalOpen,
    diffV1,
    diffV2,
    failedStepsByDuration,
    failureCorrelation,
    failureCorrelationByStep,
    handleCancelRun,
    handleCreateTrigger,
    handleDelete,
    handleDeleteTrigger,
    handleDiffVersions,
    handleLaunch,
    handlePauseRun,
    handleResumeRun,
    handleRetryRun,
    handleRollback,
    handleToggleTrigger,
    instantiateTemplate,
    launchForm,
    launchOpen,
    launching,
    loadData,
    loadRuns,
    loadTriggers,
    loading,
    openConsole,
    openLaunch,
    openTriggerModal,
    openVersionModal,
    refreshConsole,
    runDetailOpen,
    runDurationPercentiles,
    runTrend,
    runs,
    runsLoading,
    selectedRun,
    setConsoleData,
    setConsoleOpen,
    setCreateOpen,
    setDiffModalOpen,
    setLaunchOpen,
    setRunDetailOpen,
    setSelectedRun,
    setTriggerModalOpen,
    setVersionModalOpen,
    similarityMatrix,
    stepBottleneckTl,
    stepCofailureMatrix,
    stepDependencyBottleneck,
    stepDurationHist,
    stepDurationHistogram,
    stepFailureRate,
    stepHourlyDistribution,
    stepRetryTopology,
    stepStats,
    structuralComplexity,
    successRateByWorkflow,
    templateLoading,
    templates,
    triggerForm,
    triggerLoading,
    triggerModalOpen,
    triggerTargetWfId,
    triggers,
    versionLoading,
    versionModalOpen,
    versions,
    viewRun,
    workflows,
  } = useWorkflowsData()

  // 画布编辑器当前打开的工作流（null = 关闭）；createCanvas = 画布新建模式
  const [canvasWfId, setCanvasWfId] = useState<number | null>(null)
  const [canvasCreate, setCanvasCreate] = useState(false)
  // 运行态画布当前打开的运行（null = 关闭）
  const [runCanvasId, setRunCanvasId] = useState<number | null>(null)

  const closeCanvas = () => {
    setCanvasWfId(null)
    setCanvasCreate(false)
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>
          <ApartmentOutlined style={{ marginRight: 8 }} />
          工作流编排
        </h2>
        <Space>
          <Upload
            accept=".yaml,.yml,.json"
            showUploadList={false}
            beforeUpload={async file => {
              try {
                const text = await file.text()
                const name = file.name.replace(/\.[^.]+$/, '')
                await agentsApi.importWorkflowDsl(text, name)
                const { message } = await import('antd')
                message.success(`工作流已从 ${file.name} 导入`)
                loadData()
              } catch (e: any) {
                const { message } = await import('antd')
                message.error('导入失败: ' + (e?.response?.data?.error || e?.message || '未知错误'))
              }
              return false
            }}
          >
            <Button icon={<ImportOutlined />}>导入 DSL</Button>
          </Upload>
          <Dropdown
            menu={{
              items: [
                { key: 'canvas', icon: <PartitionOutlined />, label: '可视化画布创建（推荐）' },
                { key: 'form', icon: <FormOutlined />, label: '表单创建' },
              ],
              onClick: ({ key }) => {
                if (key === 'canvas') {
                  setCanvasCreate(true)
                  setCanvasWfId(0)
                } else {
                  setCreateOpen(true)
                }
              },
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              创建工作流 <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* Template marketplace */}
      <WorkflowTemplatesCard
        templates={templates}
        templateLoading={templateLoading}
        onInstantiate={instantiateTemplate}
      />

      <WorkflowDefinitionsCard
        workflows={ workflows }
        loading={ loading }
        handleDelete={ handleDelete }
        loadData={ loadData }
        openLaunch={ openLaunch }
        openTriggerModal={ openTriggerModal }
        openVersionModal={ openVersionModal }
        openCanvas={ id => { setCanvasCreate(false); setCanvasWfId(id) } }
        exportWorkflow={ async (wf: any) => {
          const { message } = await import('antd')
          try {
            const res = await agentsApi.exportWorkflowDsl(wf.id)
            const blob = new Blob([res.dsl_text], { type: 'application/x-yaml' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `workflow-${wf.id}.yaml`
            a.click()
            URL.revokeObjectURL(url)
            if (res.warnings?.length) message.warning(res.warnings.join('；'))
            else message.success('已导出 DSL')
          } catch (e: any) {
            message.error('导出失败: ' + (e?.message || '未知错误'))
          }
        } }
      />

      {/* Run canvas */}
      <WorkflowRunCanvasModal
        runId={runCanvasId}
        onClose={() => setRunCanvasId(null)}
        onOpenConsole={(id) => { setRunCanvasId(null); openConsole(id) }}
      />

      {/* Canvas editor (edit + create) */}
      <WorkflowCanvasModal
        workflowId={canvasWfId}
        createMode={canvasCreate}
        agents={agents}
        workflows={workflows}
        onClose={closeCanvas}
        onSaved={loadData}
      />

      {/* Analytics Cards (extracted) */}
      <WorkflowAnalyticsCards
        stepStats={stepStats}
        stepDurationHistogram={stepDurationHistogram}
        runDurationPercentiles={runDurationPercentiles}
        stepFailureRate={stepFailureRate}
        stepCofailureMatrix={stepCofailureMatrix}
        successRateByWorkflow={successRateByWorkflow}
        stepRetryTopology={stepRetryTopology}
        stepHourlyDistribution={stepHourlyDistribution}
        stepDependencyBottleneck={stepDependencyBottleneck}
        similarityMatrix={similarityMatrix}
        stepDurationHist={stepDurationHist}
        stepBottleneckTl={stepBottleneckTl}
        structuralComplexity={structuralComplexity}
        runTrend={runTrend}
        failureCorrelation={failureCorrelation}
        failureCorrelationByStep={failureCorrelationByStep}
        failedStepsByDuration={failedStepsByDuration}
      />

      <WorkflowRunsTriggers
        runs={ runs }
        runsLoading={ runsLoading }
        triggers={ triggers }
        triggerLoading={ triggerLoading }
        handleCancelRun={ handleCancelRun }
        handleDeleteTrigger={ handleDeleteTrigger }
        handlePauseRun={ handlePauseRun }
        handleResumeRun={ handleResumeRun }
        handleRetryRun={ handleRetryRun }
        handleToggleTrigger={ handleToggleTrigger }
        loadRuns={ loadRuns }
        loadTriggers={ loadTriggers }
        openTriggerModal={ openTriggerModal }
        viewRun={ viewRun }
        workflows={ workflows }
        onViewCanvas={ setRunCanvasId }
      />

      {/* Trigger creation modal（此前抽取的组件，原页面内联副本已删除） */}
      <TriggerCreationModal
        handleCreateTrigger={handleCreateTrigger}
        triggerModalOpen={triggerModalOpen}
        triggerTargetWfId={triggerTargetWfId}
        workflows={workflows}
        setTriggerModalOpen={setTriggerModalOpen}
        triggerForm={triggerForm}
      />

      {/* Create workflow modal (form mode) */}
      <WorkflowFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadData}
        agents={agents}
        workflows={workflows}
      />

      {/* Launch workflow modal（复用此前抽取的组件） */}
      <LaunchWorkflowModal
        launchOpen={launchOpen}
        setLaunchOpen={setLaunchOpen}
        launching={launching}
        launchForm={launchForm}
        handleLaunch={handleLaunch}
      />

      {/* Run detail modal */}
      <WorkflowRunDetailModal
        open={runDetailOpen}
        run={selectedRun}
        onClose={() => { setRunDetailOpen(false); setSelectedRun(null) }}
        onOpenConsole={openConsole}
        onPause={handlePauseRun}
        onResume={handleResumeRun}
        onRetry={handleRetryRun}
        onCancel={handleCancelRun}
      />

      {/* Real-time step console Drawer (extracted) */}
      <WorkflowRunConsole
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        selectedRun={selectedRun}
        consoleData={consoleData}
        consoleLoading={consoleLoading}
        onRefreshConsole={refreshConsole}
        onSetConsoleData={setConsoleData}
        onPauseRun={handlePauseRun}
        onResumeRun={handleResumeRun}
        onRetryRun={handleRetryRun}
        onCancelRun={handleCancelRun}
        onLoadRuns={loadRuns}
      />

      {/* Version History + Diff Modals */}
      <WorkflowVersionModals
        versionModalOpen={versionModalOpen}
        onCloseVersions={() => setVersionModalOpen(false)}
        versions={versions}
        versionLoading={versionLoading}
        currentVersion={currentVersion}
        onDiff={handleDiffVersions}
        onRollback={handleRollback}
        diffModalOpen={diffModalOpen}
        onCloseDiff={() => setDiffModalOpen(false)}
        diffV1={diffV1}
        diffV2={diffV2}
        diffData={diffData}
      />
    </div>
  )
}

export default Workflows
