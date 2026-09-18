import React from 'react'
import { Badge, Button, Input, InputNumber, Space, Tooltip } from 'antd'
import { NodeIndexOutlined, PartitionOutlined, SaveOutlined } from '@ant-design/icons'

/** 画布编辑器顶部工具栏：基本信息 + 添加步骤/自动布局/保存（含未保存标识与 ⌘S 提示） */
const CanvasToolbar: React.FC<{
  name: string
  description: string
  maxParallel: number
  dirty: boolean
  saving: boolean
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onMaxParallelChange: (v: number) => void
  onAddStep: () => void
  onAutoLayout: () => void
  onSave: () => void
}> = ({
  name, description, maxParallel, dirty, saving,
  onNameChange, onDescriptionChange, onMaxParallelChange, onAddStep, onAutoLayout, onSave,
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
    borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap',
  }}>
    <Input value={name} onChange={e => onNameChange(e.target.value)} style={{ width: 220 }} placeholder="工作流名称" />
    <Input value={description} onChange={e => onDescriptionChange(e.target.value)} style={{ width: 260 }} placeholder="描述" />
    <InputNumber min={0} max={20} value={maxParallel} onChange={v => onMaxParallelChange(v ?? 0)} addonBefore="并行上限" />
    {dirty && <span style={{ fontSize: 12, color: '#fa8c16' }}>未保存</span>}
    <Space style={{ marginLeft: 'auto' }}>
      <Tooltip title="添加步骤">
        <Button icon={<NodeIndexOutlined />} onClick={onAddStep}>添加步骤</Button>
      </Tooltip>
      <Tooltip title="按依赖自动排版并收拢视野">
        <Button icon={<PartitionOutlined />} onClick={onAutoLayout}>自动布局</Button>
      </Tooltip>
      <Tooltip title="快捷键 ⌘/Ctrl+S">
        <Badge dot={dirty} offset={[-4, 4]}>
          <Button type="primary" loading={saving} icon={<SaveOutlined />} onClick={onSave}>
            保存
          </Button>
        </Badge>
      </Tooltip>
    </Space>
  </div>
)

export default CanvasToolbar
