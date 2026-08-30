import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Select, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { agentAutomationApi, type AgentRun } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import { emptyPagination, formatDateTime, runStateColorMap, runStateValues } from './shared'
import './AgentRunsTab.css'

const { Text } = Typography

interface AgentRunsTabProps {
  workspaceId: number | null
  agentId: number
  active: boolean
}

export function AgentRunsTab({ workspaceId, agentId, active }: AgentRunsTabProps) {
  const { tp } = usePageTranslation('agents')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AgentRun[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [runState, setRunState] = useState<string | undefined>(undefined)

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setRunState(undefined)
  }, [workspaceId, agentId])

  const runStateOptions = useMemo(
    () =>
      runStateValues.map((value) => ({
        value,
        label: tp(`detail.enums.runState.${value}`, { defaultValue: value }),
      })),
    [tp]
  )

  const getRunStateLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.enums.runState.${key}`, { defaultValue: key })
    },
    [tp]
  )

  const loadRuns = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      setPagination(emptyPagination)
      return
    }
    try {
      setLoading(true)
      const data = await agentAutomationApi.listRuns(workspaceId, agentId, {
        page: pagination.page,
        per_page: pagination.per_page,
        state: runState || undefined,
      })
      setItems(data.items || [])
      setPagination(data.pagination || emptyPagination)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId, pagination.page, pagination.per_page, runState])

  useEffect(() => {
    if (!active) {
      return
    }
    void loadRuns()
  }, [active, loadRuns])

  const columns: ColumnsType<AgentRun> = useMemo(
    () => [
      {
        title: tp('detail.runs.run', { defaultValue: 'Run' }),
        key: 'run',
        render: (_, row) => (
          <Space direction='vertical' size={2}>
            <Text code>{row.run_id}</Text>
            <Text type='secondary'>{row.trigger_reason}</Text>
          </Space>
        ),
      },
      {
        title: tp('detail.runs.state', { defaultValue: 'State' }),
        dataIndex: 'state',
        key: 'state',
        width: 120,
        render: (value: string) => <Badge status={runStateColorMap[value] || 'default'} text={getRunStateLabel(value)} />,
      },
      {
        title: tp('detail.runs.scheduledAt', { defaultValue: 'Scheduled At' }),
        dataIndex: 'scheduled_at',
        key: 'scheduled_at',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: tp('detail.runs.endedAt', { defaultValue: 'Ended At' }),
        dataIndex: 'ended_at',
        key: 'ended_at',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: tp('detail.runs.failure', { defaultValue: 'Failure' }),
        key: 'failure',
        ellipsis: true,
        render: (_, row) => row.failure_reason || row.failure_code || '-',
      },
    ],
    [tp, getRunStateLabel]
  )

  return (
    <Space direction='vertical' className='agent-runs-tab' size={12}>
      <Select
        allowClear
        placeholder={tp('detail.runs.stateFilter', { defaultValue: 'Run state' })}
        value={runState}
        className='agent-runs-tab__state'
        options={runStateOptions}
        onChange={(value) => {
          setRunState(value)
          setPagination((prev) => ({ ...prev, page: 1 }))
        }}
      />
      <Table
        rowKey='run_id'
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: pagination.page,
          pageSize: pagination.per_page,
          total: pagination.total,
          showSizeChanger: true,
        }}
        onChange={(pageInfo) => {
          setPagination((prev) => ({
            ...prev,
            page: pageInfo.current || 1,
            per_page: pageInfo.pageSize || prev.per_page,
          }))
        }}
      />
    </Space>
  )
}

export default AgentRunsTab
