import React from 'react'
import { Space, Button } from 'antd'
import { SaveOutlined, ReloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'

interface PromptEditorToolbarProps {
  onSave: () => void
  onReset: () => void
  onPreview: () => void
  onVariableDocsClick?: () => void
  tp: (key: string) => string
}

export const PromptEditorToolbar: React.FC<PromptEditorToolbarProps> = ({
  onSave,
  onReset,
  onPreview,
  onVariableDocsClick,
  tp
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSave}
        >
          {tp('actions.save')}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={onReset}>
          {tp('actions.reset')}
        </Button>
        <Button icon={<EyeOutlined />} onClick={onPreview}>
          {tp('actions.preview')}
        </Button>
        {onVariableDocsClick && (
          <Button icon={<PlusOutlined />} onClick={onVariableDocsClick}>
            {tp('actions.variableDocs')}
          </Button>
        )}
      </Space>
    </div>
  )
}
