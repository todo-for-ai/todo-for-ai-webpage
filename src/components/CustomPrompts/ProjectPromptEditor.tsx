import React, { useState } from 'react'
import { Card, Modal, Spin, Alert } from 'antd'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { renderPromptTemplate } from '../../utils/promptRenderer'
import MilkdownEditor from '../MilkdownEditor'
import ProjectSelector from '../ProjectSelector'
import { useProjectPromptEditor } from '../../hooks/useProjectPromptEditor'
import { PromptEditorToolbar } from './ProjectPromptEditor/PromptEditorToolbar'

const ProjectPromptEditor: React.FC<ProjectPromptEditorProps> = ({
  onVariableDocsClick
}) => {
  const { tp } = usePageTranslation('customPrompts')
  
  const {
    content,
    setContent,
    isLoading,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    projectTasks,
    globalContextRules,
    projectContextRules,
    handleProjectChange,
    savePrompt,
    resetPrompt,
  } = useProjectPromptEditor(tp)

  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const handlePreview = async () => {
    setPreviewVisible(true)
    setPreviewLoading(true)
    setPreviewError(null)
    
    try {
      const context = {
        project: selectedProject,
        tasks: projectTasks,
        globalContextRules,
        projectContextRules,
      }
      
      renderPromptTemplate(content, context)
    } catch (error: any) {
      setPreviewError(error.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <PromptEditorToolbar
        onSave={savePrompt}
        onReset={resetPrompt}
        onPreview={handlePreview}
        onVariableDocsClick={onVariableDocsClick}
        tp={tp}
      />

      <Card style={{ marginBottom: '16px' }}>
        <ProjectSelector
          placeholder={tp('projectPrompts.selectProject')}
          value={selectedProjectId}
          onChange={handleProjectChange}
        />
      </Card>

      <Card>
        <MilkdownEditor
          value={content}
          onChange={setContent}
          placeholder={tp('projectPrompts.placeholder')}
        />
      </Card>

      <Modal
        title={tp('projectPrompts.preview')}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin />
          </div>
        ) : previewError ? (
          <Alert
            message={tp('errors.previewFailed')}
            description={previewError}
            type="error"
            showIcon
          />
        ) : (
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            <pre>{renderPromptTemplate(content, {
              project: selectedProject,
              tasks: projectTasks,
              globalContextRules,
              projectContextRules,
            })}</pre>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ProjectPromptEditor
