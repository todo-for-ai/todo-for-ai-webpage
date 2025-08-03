import React, { useState, useEffect } from 'react'
import { Space, Button, message, Modal } from 'antd'
import { SaveOutlined, ReloadOutlined, EyeOutlined, BookOutlined, PlusOutlined } from '@ant-design/icons'
import MilkdownEditor from '../MilkdownEditor'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { renderPromptTemplate, type RenderContext } from '../../utils/promptRenderer'
import { customPromptsService } from '../../services/customPromptsService'
import VariableSelector from './VariableSelector'

interface ProjectPromptEditorProps {
  onVariableDocsClick?: () => void
}

const ProjectPromptEditor: React.FC<ProjectPromptEditorProps> = ({
  onVariableDocsClick
}) => {
  const { tp } = usePageTranslation('customPrompts')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [variableSelectorVisible, setVariableSelectorVisible] = useState(false)

  // 默认模板
  const defaultTemplate = tp('projectPrompts.defaultTemplate')

  // 初始化内容
  useEffect(() => {
    // 从服务加载用户自定义的提示词
    const template = customPromptsService.getProjectPromptTemplate()
    setContent(template)
  }, [])

  // 保存提示词
  const handleSave = async () => {
    setIsLoading(true)
    try {
      // 保存到服务
      await customPromptsService.setProjectPromptTemplate(content)
      message.success(tp('messages.saveSuccess'))
    } catch (error) {
      console.error('Failed to save project prompt:', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 重置为默认模板
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: tp('messages.resetConfirm'),
      onOk: async () => {
        try {
          await customPromptsService.resetToDefaults()
          const template = customPromptsService.getProjectPromptTemplate()
          setContent(template)
          message.success('已重置为默认模板')
        } catch (error) {
          console.error('Failed to reset:', error)
          message.error('重置失败，请稍后重试')
        }
      }
    })
  }

  // 预览效果
  const handlePreview = () => {
    setPreviewVisible(true)
  }

  // 创建示例渲染上下文
  const createSampleContext = (): RenderContext => ({
    project: {
      id: 1,
      name: '示例项目',
      description: '这是一个示例项目的描述',
      github_repo: 'https://github.com/example/project',
      context: '项目上下文信息',
      color: '#1890ff',
      status: 'active',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    system: {
      url: 'https://todo4ai.org',
      current_time: new Date().toISOString()
    },
    tasks: {
      count: 5,
      list: '1. [高] 示例任务1 (ID: 1)\n2. [中] 示例任务2 (ID: 2)\n3. [低] 示例任务3 (ID: 3)',
      pending_count: 3,
      in_progress_count: 1,
      review_count: 1
    }
  })

  // 渲染预览
  const renderPreview = (template: string) => {
    const context = createSampleContext()
    return renderPromptTemplate(template, context)
  }

  // 插入变量
  const handleInsertVariable = (variable: string) => {
    setContent(prev => prev + variable)
    setVariableSelectorVisible(false)
  }

  return (
    <div>
      <Space style={{ marginBottom: '16px' }}>
        <Button
          type="link"
          icon={<BookOutlined />}
          onClick={onVariableDocsClick}
        >
          {tp('variables.viewDocs')}
        </Button>
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => setVariableSelectorVisible(true)}
        >
          插入变量
        </Button>
      </Space>

      <div style={{ marginBottom: '16px' }}>
        <MilkdownEditor
          value={content}
          onChange={setContent}
          placeholder={tp('projectPrompts.placeholder')}
          height="400px"
          autoSave={false}
        />
      </div>

      <Space>
        <Button 
          type="primary" 
          icon={<SaveOutlined />}
          loading={isLoading}
          onClick={handleSave}
        >
          {tp('buttons.save')}
        </Button>
        <Button 
          icon={<ReloadOutlined />}
          onClick={handleReset}
        >
          {tp('buttons.reset')}
        </Button>
        <Button 
          icon={<EyeOutlined />}
          onClick={handlePreview}
        >
          {tp('buttons.preview')}
        </Button>
      </Space>

      {/* 预览模态框 */}
      <Modal
        title={tp('messages.previewTitle')}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="copy" 
            type="primary"
            onClick={() => {
              navigator.clipboard.writeText(renderPreview(content))
              message.success(tp('messages.copySuccess'))
            }}
          >
            {tp('buttons.copy')}
          </Button>
        ]}
        width={800}
      >
        <div style={{ 
          maxHeight: '500px', 
          overflow: 'auto',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          {renderPreview(content)}
        </div>
      </Modal>

      {/* 变量选择器 */}
      <VariableSelector
        visible={variableSelectorVisible}
        onClose={() => setVariableSelectorVisible(false)}
        onInsertVariable={handleInsertVariable}
      />
    </div>
  )
}

export default ProjectPromptEditor
