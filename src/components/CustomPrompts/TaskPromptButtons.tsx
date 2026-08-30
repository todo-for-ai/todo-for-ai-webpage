import React, { useState, useEffect } from 'react'
import { Space, Button, Card, Input, Modal, List, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, HolderOutlined } from '@ant-design/icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MilkdownEditor from '../MilkdownEditor'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { customPromptsService, type TaskPromptButton } from '../../services/customPromptsService'

const { TextArea } = Input

interface SortableButtonItemProps {
  id: string
  button: TaskPromptButton
  index: number
  onEdit: (button: TaskPromptButton) => void
  onDelete: (buttonId: string) => void
}

const SortableButtonItem: React.FC<SortableButtonItemProps> = ({
  id,
  button,
  index,
  onEdit,
  onDelete
}) => {
  const { tp } = usePageTranslation('customPrompts')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <List.Item>
        <Card
          size="small"
          style={{
            width: '100%',
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            backgroundColor: '#fff',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                <HolderOutlined style={{ color: '#999' }} />
              </div>
              <span>{button.name || tp('messages.unnamedButton')}</span>
            </div>
          }
          extra={
            <Space>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(button)}
              />
              <Popconfirm
                title={tp('messages.deleteConfirm')}
                onConfirm={() => onDelete(button.id)}
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
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            {button.content?.substring(0, 200)}
            {button.content && button.content.length > 200 && '...'}
          </div>
        </Card>
      </List.Item>
    </div>
  )
}

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

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
      message.error(tp('messages.nameRequired'))
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
      message.error(tp('messages.saveFailed'))
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
      message.success(tp('messages.deleteSuccess'))
    } catch (error) {
      console.error('Failed to delete button:', error)
      message.error(tp('messages.deleteFailed'))
    }
  }

  // 拖拽结束处理
  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const newButtons = [...buttons]
      const oldIndex = newButtons.findIndex((item) => item.id === active.id)
      const newIndex = newButtons.findIndex((item) => item.id === over.id)

      const reorderedButtons = arrayMove(newButtons, oldIndex, newIndex)

      // 更新order
      reorderedButtons.forEach((button, idx) => {
        button.order = idx + 1
      })

      setButtons(reorderedButtons)

      try {
        await customPromptsService.setTaskPromptButtons(reorderedButtons)
        message.success(tp('messages.reorderSuccess'))
      } catch (error) {
        // 如果保存失败，恢复原来的顺序
        setButtons(buttons)
        message.error(tp('messages.reorderFailed'))
      }
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

      {buttons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          {tp('taskPrompts.noButtons')}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={buttons.map(button => button.id)}
            strategy={verticalListSortingStrategy}
          >
            <List
              dataSource={buttons}
              renderItem={(button, index) => (
                <SortableButtonItem
                  key={button.id}
                  id={button.id}
                  button={button}
                  index={index}
                  onEdit={handleEditButton}
                  onDelete={handleDeleteButton}
                />
              )}
            />
          </SortableContext>
        </DndContext>
      )}

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
