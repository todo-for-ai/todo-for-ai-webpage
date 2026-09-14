import { useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../api/agents'

interface UseWorkflowVersionsOptions {
  /** 版本回滚成功后刷新工作流列表（组合根注入，避免域间耦合） */
  loadData: () => Promise<void>
}

/**
 * 工作流版本管理域：版本历史弹窗/回滚/双版本对比。
 * 从 useWorkflowsData 原样拆出；行为由 useWorkflowsData.test.tsx 钉住。
 */
export function useWorkflowVersions({ loadData }: UseWorkflowVersionsOptions) {
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [versionWfId, setVersionWfId] = useState<number | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState<number>(1)
  const [versionLoading, setVersionLoading] = useState(false)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffData, setDiffData] = useState<any>(null)
  const [diffV1, setDiffV1] = useState<number>(0)
  const [diffV2, setDiffV2] = useState<number>(0)

  const openVersionModal = async (wfId: number) => {
    setVersionWfId(wfId)
    setVersionModalOpen(true)
    setVersionLoading(true)
    try {
      const data = await agentsApi.listWorkflowVersions(wfId)
      setVersions(data?.versions || [])
      setCurrentVersion(data?.current_version || 1)
    } catch { message.error('加载版本历史失败') }
    finally { setVersionLoading(false) }
  }

  const handleRollback = async (targetVersion: number) => {
    if (!versionWfId) return
    try {
      await agentsApi.rollbackWorkflow(versionWfId, targetVersion)
      message.success(`已回滚到版本 ${targetVersion}`)
      openVersionModal(versionWfId)
      loadData()
    } catch { message.error('回滚失败') }
  }

  const handleDiffVersions = async (v1: number, v2: number) => {
    if (!versionWfId) return
    try {
      const data = await agentsApi.diffWorkflowVersions(versionWfId, v1, v2)
      setDiffData(data)
      setDiffV1(v1)
      setDiffV2(v2)
      setDiffModalOpen(true)
    } catch { message.error('比较失败') }
  }

  return {
    versionModalOpen, setVersionModalOpen,
    versionWfId, setVersionWfId,
    versions, setVersions,
    currentVersion, setCurrentVersion,
    versionLoading, setVersionLoading,
    diffModalOpen, setDiffModalOpen,
    diffData, setDiffData,
    diffV1, setDiffV1,
    diffV2, setDiffV2,
    openVersionModal,
    handleRollback,
    handleDiffVersions,
  }
}
