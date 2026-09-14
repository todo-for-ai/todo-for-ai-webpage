import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../api/agents'

interface UseWorkflowTemplatesOptions {
  /** 模板实例化成功后刷新工作流列表（组合根注入，避免域间耦合） */
  loadData: () => Promise<void>
}

/**
 * 工作流模板域：模板列表加载与一键实例化。
 * 从 useWorkflowsData 原样拆出；行为由 useWorkflowsData.test.tsx 钉住。
 */
export function useWorkflowTemplates({ loadData }: UseWorkflowTemplatesOptions) {
  const [templates, setTemplates] = useState<any[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)

  const loadTemplates = useCallback(async () => {
    setTemplateLoading(true)
    try {
      const result = await agentsApi.getWorkflowTemplates()
      setTemplates(result)
    } catch {
      // silent
    } finally {
      setTemplateLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const instantiateTemplate = async (key: string, name: string) => {
    try {
      await agentsApi.instantiateWorkflowTemplate(key, { name })
      message.success(`工作流「${name}」已从模板创建`)
      loadData()
    } catch {
      message.error('从模板创建失败')
    }
  }

  return {
    templates, setTemplates,
    templateLoading, setTemplateLoading,
    loadTemplates,
    instantiateTemplate,
  }
}
