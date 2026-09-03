/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { Card, Modal, Select, Space, Button, Table, message } from 'antd'
import { DeleteOutlined, EditOutlined, DeploymentUnitOutlined } from '@ant-design/icons'
import { useProjectTasks } from '../../hooks/useProjectTasks'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { getErrorMessage } from '../../utils/errorUtils'
import { TaskFilters } from './TaskFilters'
import { useTaskStore } from '../../stores'
import { agentsApi, type Agent } from '../../api/agents'

const { Option } = Select

interface TaskListSectionProps {
  projectId: string
  onTableChange: (params: any) => void
  onRefresh: () => Promise<void>
}

export const TaskListSection: React.FC<TaskListSectionProps> = ({
  projectId,
  onTableChange,
  onRefresh
}) => {
  const { tp } = usePageTranslation('projectDetail')
  const { tasks, tasksLoading, selectedTaskIds, handleTaskSelection, handleClearSelection, getTaskColumns } = useProjectTasks(projectId)
  const { batchUpdateTaskStatus, batchDeleteTasks } = useTaskStore()
  const [batchStatusValue, setBatchStatusValue] = useState<string | undefined>(undefined)
  const [batchDispatchOpen, setBatchDispatchOpen] = useState(false)
  const [batchDispatchAgentId, setBatchDispatchAgentId] = useState<number | null>(null)
  const [batchDispatchAgents, setBatchDispatchAgents] = useState<Agent[]>([])
  const [batchDispatching, setBatchDispatching] = useState(false)

  const taskColumns = getTaskColumns()

  const handleBatchDelete = () => {
    if (selectedTaskIds.length === 0) {
      message.warning(tp('tasks.table.bulkActions.noSelectionForDelete'))
      return
    }

    Modal.confirm({
      title: tp('tasks.table.bulkActions.deleteConfirmTitle'),
      content: tp('tasks.table.bulkActions.deleteConfirmDescription', { count: selectedTaskIds.length }),
      okText: tp('tasks.table.bulkActions.confirmDelete'),
      okType: 'danger',
      cancelText: tp('tasks.confirm.delete.cancel'),
      onOk: async () => {
        try {
          await batchDeleteTasks(selectedTaskIds)
          message.success(tp('tasks.table.bulkActions.deleteSuccess', { count: selectedTaskIds.length }))
          handleClearSelection()
          await onRefresh()
        } catch (error) {
          message.error(getErrorMessage(error, tp('tasks.table.bulkActions.deleteError')))
        }
      }
    })
  }

  const handleBatchStatusChange = (status: string) => {
    if (selectedTaskIds.length === 0) {
      message.warning(tp('tasks.table.bulkActions.noSelectionForStatus'))
      return
    }

    Modal.confirm({
      title: tp('tasks.table.bulkActions.statusChangeConfirmTitle'),
      content: tp('tasks.table.bulkActions.statusChangeConfirmDescription', { count: selectedTaskIds.length, status: getStatusLabel(status) }),
      okText: tp('tasks.table.bulkActions.confirmStatusChange'),
      cancelText: tp('tasks.confirm.delete.cancel'),
      onOk: async () => {
        try {
          await batchUpdateTaskStatus(selectedTaskIds, status)
          message.success(tp('tasks.table.bulkActions.statusChangeSuccess', { count: selectedTaskIds.length, status: getStatusLabel(status) }))
          setBatchStatusValue(undefined)
          handleClearSelection()
          await onRefresh()
        } catch (error) {
          message.error(getErrorMessage(error, tp('tasks.table.bulkActions.statusChangeError')))
        }
      },
      onCancel: () => {
        setBatchStatusValue(undefined)
      }
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: tp('tasks.filters.status.todo'),
      in_progress: tp('tasks.filters.status.inProgress'),
      review: tp('tasks.filters.status.review'),
      done: tp('tasks.filters.status.done'),
      cancelled: tp('tasks.filters.status.cancelled')
    }
    return labels[status] || status
  }

  const openBatchDispatch = async () => {
    try {
      const result = await agentsApi.getAgents({ per_page: 100 })
      setBatchDispatchAgents(result.items.filter(a => a.status === 'active' && a.kind !== 'coordinator'))
      setBatchDispatchOpen(true)
    } catch {
      message.error('加载 Agent 列表失败')
    }
  }

  const submitBatchDispatch = async () => {
    if (!batchDispatchAgentId) {
      message.warning('请选择 Agent')
      return
    }
    setBatchDispatching(true)
    try {
      const agent = batchDispatchAgents.find(a => a.id === batchDispatchAgentId)
      let dispatched = 0
      for (const taskId of selectedTaskIds) {
        try {
          await agentsApi.claimTask(batchDispatchAgentId, { task_id: taskId, dispatch_source: 'human' })
          dispatched++
        } catch {
          // skip tasks that can't be claimed
        }
      }
      message.success(`已派发 ${dispatched}/${selectedTaskIds.length} 个任务给 ${agent?.name || `Agent #${batchDispatchAgentId}`}`)
      setBatchDispatchOpen(false)
      setBatchDispatchAgentId(null)
      handleClearSelection()
      await onRefresh()
    } catch {
      message.error('批量派发失败')
    } finally {
      setBatchDispatching(false)
    }
  }

  return (
    <>
    <Card>
      <TaskFilters onRefresh={onRefresh} loading={tasksLoading} />
      
      {selectedTaskIds.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f0faf5', borderRadius: '4px' }}>
          <Space>
            <span>{tp('tasks.table.bulkActions.selectedCount', { count: selectedTaskIds.length })}</span>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={handleBatchDelete}
            >
              {tp('tasks.table.bulkActions.delete')}
            </Button>
            <Select
              size="small"
              placeholder={tp('tasks.table.bulkActions.changeStatus')}
              style={{ width: 150 }}
              value={batchStatusValue}
              onChange={handleBatchStatusChange}
              suffixIcon={<EditOutlined />}
            >
              <Option value="todo">{tp('tasks.filters.status.todo')}</Option>
              <Option value="in_progress">{tp('tasks.filters.status.inProgress')}</Option>
              <Option value="review">{tp('tasks.filters.status.review')}</Option>
              <Option value="done">{tp('tasks.filters.status.done')}</Option>
              <Option value="cancelled">{tp('tasks.filters.status.cancelled')}</Option>
            </Select>
            <Button size="small" onClick={handleClearSelection}>
              {tp('tasks.table.bulkActions.clearSelection')}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<DeploymentUnitOutlined />}
              onClick={openBatchDispatch}
            >
              批量派发
            </Button>
          </Space>
        </div>
      )}

      <Table
        columns={taskColumns}
        dataSource={tasks}
        rowKey="id"
        loading={tasksLoading}
        size="small"
        rowSelection={handleTaskSelection()}
        pagination={{ current: 1, pageSize: 20, showSizeChanger: true }}
        onChange={onTableChange}
        locale={{
          emptyText: (
            <div style={{ padding: '16px 0' }}>
              <div>{tp('tasks.table.emptyTitle')}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                {tp('tasks.table.emptyHint')}
              </div>
            </div>
          )
        }}
      />
    </Card>

    {/* 批量派发弹窗 */}
    <Modal
      title={`批量派发 ${selectedTaskIds.length} 个任务`}
      open={batchDispatchOpen}
      onCancel={() => { setBatchDispatchOpen(false); setBatchDispatchAgentId(null) }}
      onOk={submitBatchDispatch}
      confirmLoading={batchDispatching}
      okText="派发"
    >
      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: '100%' }}
          placeholder="选择目标 Agent"
          value={batchDispatchAgentId || undefined}
          onChange={(val) => setBatchDispatchAgentId(val)}
        >
          {batchDispatchAgents.map(a => (
            <Select.Option key={a.id} value={a.id}>
              {a.name} ({a.kind})
            </Select.Option>
          ))}
        </Select>
        {batchDispatchAgents.length === 0 && (
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            没有活跃的执行 Agent，请先创建并激活 Agent
          </div>
        )}
      </div>
    </Modal>
    </>
  )
}
