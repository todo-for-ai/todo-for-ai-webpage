import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Form, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useContextRuleStore } from '../stores'
import type { CreateContextRuleData, UpdateContextRuleData } from '../api/contextRules'

interface CreateContextRuleReturn {
  form: any
  loading: boolean
  isEditMode: boolean
  projectId: number | undefined
  isDataLoaded: boolean
  currentContextRule: any
  handleSubmit: (values?: any) => Promise<void>
  handleCancel: () => void
  loadContextRule: (ruleId: number) => Promise<void>
  setIsDataLoaded: (loaded: boolean) => void
}

export const useCreateContextRule = (): CreateContextRuleReturn => {
  const { t } = useTranslation('createContextRule')
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [isEditMode, setIsEditMode] = useState(false)
  const [projectId, setProjectId] = useState<number | undefined>()
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const {
    loading,
    currentContextRule,
    createContextRule,
    updateContextRule,
    fetchContextRule
  } = useContextRuleStore()

  useEffect(() => {
    const projectIdParam = searchParams.get('project_id')
    if (projectIdParam) {
      setProjectId(parseInt(projectIdParam, 10))
    }
    if (id) {
      setIsEditMode(true)
      loadContextRule(parseInt(id, 10))
    } else {
      const isFromGlobalRules = window.location.pathname.includes('/context-rules/create')
      form.setFieldsValue({
        priority: isFromGlobalRules ? 100 : 0,
        is_active: true,
        apply_to_tasks: true,
        apply_to_projects: true,
        is_public: false,
        project_id: projectId
      })
    }
  }, [id, searchParams, form])

  useEffect(() => {
    if (isEditMode && currentContextRule && isDataLoaded) {
      form.setFieldsValue({
        name: currentContextRule.name,
        description: currentContextRule.description,
        content: currentContextRule.content,
        priority: currentContextRule.priority,
        is_active: currentContextRule.is_active,
        apply_to_tasks: currentContextRule.apply_to_tasks,
        apply_to_projects: currentContextRule.apply_to_projects,
        is_public: currentContextRule.is_public || false
      })
      setProjectId(currentContextRule.project_id)
    }
  }, [currentContextRule, isEditMode, form, isDataLoaded])

  const handleSubmit = useCallback(async (values?: any) => {
    try {
      const formValues = values || await form.validateFields()
      const ruleData: CreateContextRuleData | UpdateContextRuleData = {
        name: formValues.name,
        description: formValues.description || '',
        content: formValues.content || '',
        priority: formValues.priority || 0,
        is_active: formValues.is_active !== false,
        apply_to_tasks: formValues.apply_to_tasks !== false,
        apply_to_projects: formValues.apply_to_projects === true,
        is_public: formValues.is_public === true
      }
      if (projectId) {
        (ruleData as CreateContextRuleData).project_id = projectId
      }
      let success = false
      if (isEditMode && id) {
        const result = await updateContextRule(parseInt(id, 10), ruleData)
        success = !!result
        if (success) {
          message.success(t('messages.updateSuccess'))
        }
      } else {
        const result = await createContextRule(ruleData as CreateContextRuleData)
        success = !!result
        if (success) {
          message.success(t('messages.createSuccess'))
        }
      }
      if (success) {
        if (projectId) {
          navigate(`/todo-for-ai/pages/projects/${projectId}?tab=context`)
        } else {
          navigate('/todo-for-ai/pages/context-rules')
        }
      }
    } catch (error) {
      console.error('保存上下文规则失败:', error)
      message.error(t('messages.saveError'))
    }
  }, [isEditMode, id, projectId, form, updateContextRule, createContextRule, navigate, t])

  const handleCancel = () => {
    if (projectId) {
      navigate(`/todo-for-ai/pages/projects/${projectId}?tab=context`)
    } else {
      navigate('/todo-for-ai/pages/context-rules')
    }
  }

  const loadContextRule = async (ruleId: number) => {
    try {
      await fetchContextRule(ruleId)
      setIsDataLoaded(true)
    } catch (error) {
      console.error('加载上下文规则失败:', error)
      message.error(t('messages.loadError'))
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        handleSubmit()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSubmit])

  useEffect(() => {
    if (isEditMode && currentContextRule) {
      document.title = t('pageTitle.editWithName', { name: currentContextRule.name })
    } else {
      document.title = isEditMode ? t('pageTitle.edit') : t('pageTitle.create')
    }
    return () => {
      document.title = 'Todo for AI'
    }
  }, [isEditMode, currentContextRule, t])

  return {
    form,
    loading,
    isEditMode,
    projectId,
    isDataLoaded,
    currentContextRule,
    handleSubmit,
    handleCancel,
    loadContextRule,
    setIsDataLoaded
  }
}
