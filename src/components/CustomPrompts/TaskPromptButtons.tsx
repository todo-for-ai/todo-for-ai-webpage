import React, { useState, useEffect } from 'react'
import { Space, Button, Card, Input, Modal, List, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, BookOutlined } from '@ant-design/icons'
import MilkdownEditor from '../MilkdownEditor'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { customPromptsService, type TaskPromptButton } from '../../services/customPromptsService'

const { TextArea } = Input

interface TaskPromptButtonsProps {
  onVariableDocsClick?: () => void
}

const TaskPromptButtons: React.FC<TaskPromptButtonsProps> = ({
  onVariableDocsClick
}) => {
  const { tp } = usePageTranslation('customPrompts')
  const [buttons, setButtons] = useState<TaskPromptButton[]>([])
  const [editingButton, setEditingButton] = useState<TaskPromptButton | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 默认按钮内容
  const defaultContent = tp('taskPrompts.buttonConfig.defaultContent')

  // 初始化按钮列表
  useEffect(() => {
    // 从服务加载用户自定义的按钮配置
    const buttons = customPromptsService.getTaskPromptButtons()
    setButtons(buttons)
  }, [])

  // 添加新按钮
  const handleAddButton = () => {
    const newButton: TaskPromptButton = {
      id: Date.now().toString(),
      name: '',
      content: defaultContent,
      order: buttons.length + 1
    }
    setEditingButton(newButton)
    setModalVisible(true)
  }

  // 编辑按钮
  const handleEditButton = (button: TaskPromptButton) => {
    setEditingButton({ ...button })
    setModalVisible(true)
  }

  // 保存按钮
  const handleSaveButton = async () => {
    if (!editingButton || !editingButton.name.trim()) {
      message.error('请输入按钮名称')
      return
    }

    setIsLoading(true)
    try {
      const isNew = !buttons.find(b => b.id === editingButton.id)
      let newButtons: TaskPromptButton[]

      if (isNew) {
        newButtons = [...buttons, editingButton]
      } else {
        newButtons = buttons.map(b => b.id === editingButton.id ? editingButton : b)
      }

      setButtons(newButtons)
      await customPromptsService.setTaskPromptButtons(newButtons)

      message.success(tp('messages.saveSuccess'))
      setModalVisible(false)
      setEditingButton(null)
    } catch (error) {
      console.error('Failed to save button:', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 删除按钮
  const handleDeleteButton = async (buttonId: string) => {
    const newButtons = buttons.filter(b => b.id !== buttonId)
    setButtons(newButtons)
    try {
      await customPromptsService.setTaskPromptButtons(newButtons)
      message.success('按钮已删除')
    } catch (error) {
      console.error('Failed to delete button:', error)
      message.error('删除失败，请稍后重试')
    }
  }

  // 移动按钮位置
  const handleMoveButton = async (buttonId: string, direction: 'up' | 'down') => {
    const index = buttons.findIndex(b => b.id === buttonId)
    if (index === -1) return

    const newButtons = [...buttons]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < newButtons.length) {
      [newButtons[index], newButtons[targetIndex]] = [newButtons[targetIndex], newButtons[index]]

      // 更新order
      newButtons.forEach((button, idx) => {
        button.order = idx + 1
      })

      setButtons(newButtons)
      await customPromptsService.setTaskPromptButtons(newButtons)
    }
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
      </Space>

      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddButton}
        >
          {tp('taskPrompts.addButton')}
        </Button>
      </div>

      <List
        dataSource={buttons}
        renderItem={(button, index) => (
          <List.Item>
            <Card 
              size="small" 
              style={{ width: '100%' }}
              title={button.name || '未命名按钮'}
              extra={
                <Space>
                  <Button 
                    type="text" 
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0}
                    onClick={() => handleMoveButton(button.id, 'up')}
                  />
                  <Button 
                    type="text" 
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={index === buttons.length - 1}
                    onClick={() => handleMoveButton(button.id, 'down')}
                  />
                  <Button 
                    type="text" 
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditButton(button)}
                  />
                  <Popconfirm
                    title={tp('messages.deleteConfirm')}
                    onConfirm={() => handleDeleteButton(button.id)}
                  >
                    <Button 
                      type="text" 
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                    />
                  </Popconfirm>
                </Space>
              }
            >
              <div style={{ 
                maxHeight: '100px', 
                overflow: 'hidden',
                color: '#666',
                fontSize: '12px'
              }}>
                {button.content.substring(0, 200)}
                {button.content.length > 200 && '...'}
              </div>
            </Card>
          </List.Item>
        )}
      />

      {/* 编辑按钮模态框 */}
      <Modal
        title={tp('taskPrompts.buttonConfig.title')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingButton(null)
        }}
        onOk={handleSaveButton}
        confirmLoading={isLoading}
        width={800}
      >
        {editingButton && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                {tp('taskPrompts.buttonConfig.name')}
              </label>
              <Input
                value={editingButton.name}
                onChange={(e) => setEditingButton({
                  ...editingButton,
                  name: e.target.value
                })}
                placeholder={tp('taskPrompts.buttonConfig.namePlaceholder')}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                {tp('taskPrompts.buttonConfig.content')}
              </label>
              <MilkdownEditor
                value={editingButton.content}
                onChange={(content) => setEditingButton({
                  ...editingButton,
                  content
                })}
                placeholder={tp('taskPrompts.buttonConfig.contentPlaceholder')}
                height="300px"
                autoSave={false}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default TaskPromptButtons
