import React, { useEffect, useCallback, useState } from 'react'
import { Form, Input, DatePicker, Select, Button, Space, Card, Row, Col, Checkbox, Breadcrumb, message, Typography, Upload } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, HomeOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { useNavigate } from 'react-router-dom'
import MilkdownEditor from '../components/MilkdownEditor'
import ResizableContainer from '../components/ResizableContainer'
import { TaskEditStatus } from '../components/TaskEditStatus'
import { useCreateTask } from '../hooks/useCreateTask'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { taskLabelsApi } from '../api/taskLabels'
import { projectsApi } from '../api/projects'
import { organizationsApi } from '../api/organizations'
import { organizationAgentsApi } from '../api/organizationAgents'

const { Title, Paragraph } = Typography
const { Option } = Select

const CreateTask: React.FC = () => {
  const { t, tp } = usePageTranslation('createTask')
  const navigate = useNavigate()
  const hook = useCreateTask(tp)
  const [labelOptions, setLabelOptions] = useState<{ label: string; value: string }[]>([])
  const [memberOptions, setMemberOptions] = useState<{ label: string; value: string }[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<UploadFile[]>([])
  const attachmentRawFiles = attachmentFiles
    .map((item) => item.originFileObj)
    .filter(Boolean) as File[]

  const {
    form,
    loading,
    isEditMode,
    editorContent,
    setEditorContent,
    taskLoaded,
    originalTaskContent,
    isAutoSaving,
    lastSavedTime,
    defaultProjectId,
    handleSubmit,
    handleSubmitAndEdit,
    handleCancel,
    handleCreateAndContinue,
    debouncedSaveDraft,
    debouncedSaveEditDraft,
    debouncedAutoSave,
    performAutoSave,
    clearDraft,
    clearEditDraft,
  } = hook
  const selectedProjectId = Form.useWatch('project_id', form)

  useEffect(() => {
    const pageTitle = isEditMode ? tp('title.edit') : tp('title.create')
    document.title = `${pageTitle} - Todo for AI`
    return () => { document.title = 'Todo for AI' }
  }, [isEditMode, tp])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+S (Windows) or Cmd+S (Mac) - 保存并编辑
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      handleSubmitAndEdit(attachmentRawFiles)
    }
    // Ctrl+Enter (Windows) or Cmd+Enter (Mac) - 提交表单
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      handleSubmit(attachmentRawFiles)
    }
  }, [handleSubmitAndEdit, handleSubmit, attachmentRawFiles])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const loadTaskLabels = async () => {
      if (!selectedProjectId) {
        setLabelOptions([])
        return
      }
      try {
        const data = await taskLabelsApi.getTaskLabels({ project_id: Number(selectedProjectId) })
        const options = (data.items || []).map((item) => ({
          label: item.name,
          value: item.name
        }))
        setLabelOptions(options)
      } catch (error) {
        console.error('Failed to load task labels:', error)
      }
    }

    loadTaskLabels()
  }, [selectedProjectId])

  useEffect(() => {
    const loadAssignableMembers = async () => {
      if (!selectedProjectId) {
        setMemberOptions([])
        return
      }
      try {
        const project = await projectsApi.getProject(Number(selectedProjectId))
        if (!project.organization_id) {
          setMemberOptions([])
          return
        }

        const [humanData, agentData] = await Promise.all([
          organizationsApi.getOrganizationMembers(project.organization_id),
          organizationAgentsApi.getOrganizationAgentMembers(project.organization_id)
        ])

        const humans = (humanData.items || []).map((item) => ({
          label: `${item.user?.full_name || item.user?.nickname || item.user?.username || `#${item.user_id}`} (Human)`,
          value: `human:${item.user_id}`
        }))

        const agents = (agentData.items || [])
          .filter((item) => item.status === 'active' && item.agent)
          .map((item) => ({
            label: `${item.agent?.name || `Agent #${item.agent_id}`} (Agent)`,
            value: `agent:${item.agent_id}`
          }))

        setMemberOptions([...humans, ...agents])
      } catch (error) {
        console.error('Failed to load assignable members:', error)
        setMemberOptions([])
      }
    }
    loadAssignableMembers()
  }, [selectedProjectId])

  return (
    <div style={{ padding: '24px', width: '80%', margin: '0 auto', minWidth: '800px', maxWidth: '1600px' }}>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <HomeOutlined />
          <span onClick={() => navigate('/todo-for-ai/pages')} style={{ cursor: 'pointer', marginLeft: '8px' }}>
            {tp('navigation.home')}
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span onClick={() => {
            const projectId = form.getFieldValue('project_id') || defaultProjectId
            if (projectId) {
              navigate(`/todo-for-ai/pages/projects/${projectId}?tab=tasks`)
            } else {
              navigate('/todo-for-ai/pages/projects')
            }
          }} style={{ cursor: 'pointer' }}>
            {tp('navigation.projectTaskList')}
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{isEditMode ? tp('title.edit') : tp('title.create')}</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="flat-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button type="text" className="flat-btn flat-btn--secondary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
            {tp('navigation.returnToProjectTaskList')}
          </Button>
          <div style={{ flex: 1 }}>
            <Title level={2} style={{ margin: 0 }}>
              <PlusOutlined style={{ marginRight: '12px' }} />
              {isEditMode ? tp('title.edit') : tp('title.create')}
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
              {isEditMode ? tp('description.edit') : tp('description.create')}
            </Paragraph>
          </div>
        </div>
      </Card>

      <TaskEditStatus
        currentContent={editorContent}
        originalContent={originalTaskContent}
        lastSavedTime={lastSavedTime}
        onSave={handleSubmit}
        onAutoSave={performAutoSave}
        isSaving={loading || isAutoSaving}
        enabled={isEditMode}
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={() => handleSubmit(attachmentRawFiles)}>
          <ResizableContainer defaultWidth={1000} minWidth={600} maxWidth={1400} storageKey="taskEditor_contentWidth">
            <Card className="flat-card" size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label={tp('form.project.label')} name="project_id" rules={[{ required: true, message: tp('form.project.required') }]}>
                    <Select placeholder={tp('form.project.placeholder')} showSearch allowClear={false} />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item label={tp('form.title.label')} name="title" tooltip={tp('form.title.tooltip')}>
                    <Input placeholder={tp('form.title.placeholder')} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="is_ai_task" valuePropName="checked" style={{ marginTop: '30px' }}>
                    <Checkbox>{tp('form.assignToAI')}</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card className="flat-card" title={<div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>📝 {tp('form.content.title')}</div>} style={{ marginBottom: '16px' }}>
              <Form.Item name="content" rules={[{ required: true, message: tp('form.content.required') }]}>
                {(!isEditMode || taskLoaded) ? (
                  <MilkdownEditor
                    value={editorContent}
                    onChange={(value) => {
                      const newValue = value || ''
                      const normalizedNewValue = newValue.replace(/\r\n/g, '\n').trim()
                      const normalizedCurrentValue = (editorContent || '').replace(/\r\n/g, '\n').trim()
                      if (normalizedNewValue !== normalizedCurrentValue) {
                        React.startTransition(() => {
                          setEditorContent(newValue)
                          form.setFieldValue('content', newValue)
                        })
                        if (!isEditMode) debouncedSaveDraft(newValue)
                        else { debouncedSaveEditDraft(newValue); debouncedAutoSave() }
                      }
                    }}
                    onSave={() => handleSubmitAndEdit(attachmentRawFiles)}
                    autoHeight={true}
                    minHeight={300}
                    hideToolbar={false}
                  />
                ) : <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tp('form.content.loading')}</div>}
              </Form.Item>
            </Card>

            <Card className="flat-card" title={tp('form.settings.title')} size="small" style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label={tp('form.settings.status.label')} name="status">
                    <Select>
                      <Option value="todo">{tp('form.settings.status.todo')}</Option>
                      <Option value="in_progress">{tp('form.settings.status.inProgress')}</Option>
                      <Option value="review">{tp('form.settings.status.review')}</Option>
                      <Option value="done">{tp('form.settings.status.done')}</Option>
                      <Option value="cancelled">{tp('form.settings.status.cancelled')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label={tp('form.settings.priority.label')} name="priority">
                    <Select>
                      <Option value="low">{tp('form.settings.priority.low')}</Option>
                      <Option value="medium">{tp('form.settings.priority.medium')}</Option>
                      <Option value="high">{tp('form.settings.priority.high')}</Option>
                      <Option value="urgent">{tp('form.settings.priority.urgent')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label={tp('form.settings.dueDate.label')} name="due_date">
                    <DatePicker style={{ width: '100%' }} placeholder={tp('form.settings.dueDate.placeholder')} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label={tp('form.settings.tags.label')} name="tags">
                    <Select
                      mode="tags"
                      placeholder={tp('form.settings.tags.placeholder')}
                      style={{ width: '100%' }}
                      options={labelOptions}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={tp('form.settings.assignees.label')} name="assignees">
                    <Select
                      mode="multiple"
                      placeholder={tp('form.settings.assignees.placeholder')}
                      style={{ width: '100%' }}
                      options={memberOptions}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={tp('form.settings.mentions.label')} name="mentions">
                    <Select
                      mode="multiple"
                      placeholder={tp('form.settings.mentions.placeholder')}
                      style={{ width: '100%' }}
                      options={memberOptions}
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card className="flat-card" title={tp('form.attachments.title')} size="small" style={{ marginBottom: '24px' }}>
              <Upload.Dragger
                multiple
                beforeUpload={(file) => {
                  setAttachmentFiles((prev) => [...prev, file])
                  return false
                }}
                onRemove={(file) => {
                  setAttachmentFiles((prev) => prev.filter((item) => item.uid !== file.uid))
                }}
                fileList={attachmentFiles}
              >
                <p>{tp('form.attachments.hint')}</p>
                <p>{tp('form.attachments.subHint')}</p>
              </Upload.Dragger>
            </Card>
          </ResizableContainer>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Space size="large">
              <Button type="text" className="flat-btn flat-btn--secondary" size="large" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
                {tp('actions.common.return')}
              </Button>
              <Button type="primary" className="flat-btn-solid flat-btn-solid--primary" size="large" icon={<SaveOutlined />} loading={loading} htmlType="submit">
                {isEditMode ? tp('actions.common.update') : tp('actions.createMode.create')}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default CreateTask
