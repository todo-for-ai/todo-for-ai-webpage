/**
 * ========================================
 * MARKDOWN编辑器包装组件 - 三大法则 + 禁用规则
 * ========================================
 *
 * 【三大法则】此组件必须遵循Markdown编辑器的三大法则：
 *
 * 1. 【实时保存】支持实时保存功能，传递给MilkdownEditor
 * 2. 【所见即所得】使用MilkdownEditor实现所见即所得
 * 3. 【无滚动条】不产生滚动条，保持高度自适应
 *
 * 【禁用规则】
 * ❌ 严禁使用 @uiw/react-md-editor
 * ❌ 严禁使用任何其他Markdown编辑器替代MilkdownEditor
 * ❌ 严禁添加预览模式切换功能
 * ❌ 必须使用MilkdownEditor作为唯一的Markdown编辑器
 *
 * 重要：任何违反这些法则和禁用规则的修改都是不被允许的！
 * ========================================
 */

import { useState } from 'react'
import { Button, Tooltip, message, Modal, Tabs } from 'antd'
import {
  PictureOutlined
} from '@ant-design/icons'
import { ImageUpload } from '../ImageUpload'
import MilkdownEditor from '../MilkdownEditor'
import { useTranslation } from '../../i18n/hooks/useTranslation'

const { TabPane } = Tabs

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
  onSave?: (value: string) => void
  placeholder?: string
  height?: number
  minHeight?: string | number
  maxHeight?: string | number
  autoHeight?: boolean
  autoSave?: boolean
  autoSaveInterval?: number
  readOnly?: boolean
  hideToolbar?: boolean
  preview?: 'live' | 'edit' | 'preview'
  taskId?: number
  enableImageUpload?: boolean
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = '',
  onChange,
  onSave,
  placeholder,
  height = 400,
  minHeight,
  maxHeight,
  autoHeight = false,
  autoSave = false,
  autoSaveInterval = 30000, // 30秒
  readOnly = false,
  hideToolbar = false,
  taskId,
  enableImageUpload = false,
}) => {
  const { tc } = useTranslation()
  const resolvedPlaceholder = placeholder || tc('markdownEditor.placeholder')
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  // 插入Markdown文本
  const insertMarkdown = (markdown: string) => {
    // 简单地在末尾添加内容
    const newContent = value + '\n' + markdown
    onChange?.(newContent)
  }

  // 打开图片上传对话框
  const handleImageUpload = () => {
    if (!taskId) {
      message.warning(tc('markdownEditor.saveTaskFirst'))
      return
    }
    setImageModalVisible(true)
  }

  return (
    <div style={{ position: 'relative' }}>
      <MilkdownEditor
        value={value}
        onChange={onChange}
        onSave={onSave}
        placeholder={resolvedPlaceholder}
        height={height}
        minHeight={minHeight}
        maxHeight={maxHeight}
        autoHeight={autoHeight}
        readOnly={readOnly}
        hideToolbar={hideToolbar}
        autoSave={autoSave}
        autoSaveInterval={autoSaveInterval}
      />

      {/* 图片上传按钮 - 如果启用了图片上传且没有隐藏工具栏 */}
      {enableImageUpload && !hideToolbar && !readOnly && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '60px',
          zIndex: 10
        }}>
          <Tooltip title={tc('markdownEditor.insertImage')}>
            <Button
              type="text"
              size="small"
              icon={<PictureOutlined />}
              onClick={handleImageUpload}
            />
          </Tooltip>
        </div>
      )}

      {/* 图片上传模态框 */}
      <Modal
        title={tc('markdownEditor.uploadTitle')}
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        footer={null}
        width={600}
      >
        <Tabs defaultActiveKey="upload">
          <TabPane tab={tc('markdownEditor.tabs.upload')} key="upload">
            <ImageUpload
              value={uploadedImages}
              onChange={setUploadedImages}
              onInsertMarkdown={(markdown) => {
                insertMarkdown(markdown)
                setImageModalVisible(false)
              }}
              taskId={taskId}
              maxCount={5}
              maxSize={5}
            />
          </TabPane>
          <TabPane tab={tc('markdownEditor.tabs.help')} key="help">
            <div style={{ padding: '16px 0' }}>
              <h4>{tc('markdownEditor.help.uploadGuideTitle')}</h4>
              <ul>
                <li>{tc('markdownEditor.help.supportedFormats')}</li>
                <li>{tc('markdownEditor.help.maxSize')}</li>
                <li>{tc('markdownEditor.help.maxCount')}</li>
                <li>{tc('markdownEditor.help.autoInsert')}</li>
              </ul>

              <h4>{tc('markdownEditor.help.syntaxTitle')}</h4>
              <pre style={{
                background: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                {`![${tc('markdownEditor.help.altText')}](https://example.com/image.jpg)
![示例图片](https://example.com/image.jpg)`}
              </pre>
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  )
}

export default MarkdownEditor
