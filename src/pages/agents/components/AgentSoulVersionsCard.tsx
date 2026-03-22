import { useState } from 'react'
import { Button, Card, Input, Modal, Space, Table, Tag, Typography } from 'antd'
import { HistoryOutlined, RollbackOutlined } from '@ant-design/icons'
import type { AgentSoulVersion } from '../../../api/agents'
import { useAgentSoul } from '../hooks/useAgentSoul'
import './AgentSoulVersionsCard.css'

const { Text } = Typography

interface AgentSoulVersionsCardProps {
  workspaceId: number | null
  agentId: number | null
  soulVersion?: number
  onAfterRollback?: () => Promise<void> | void
}

export function AgentSoulVersionsCard({
  workspaceId,
  agentId,
  soulVersion,
  onAfterRollback,
}: AgentSoulVersionsCardProps) {
  const { versions, loading, rollback } = useAgentSoul(workspaceId, agentId)
  const [rollbackTarget, setRollbackTarget] = useState<AgentSoulVersion | null>(null)
  const [changeSummary, setChangeSummary] = useState('')

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined /> SOUL Versions
        </Space>
      }
      className='agent-soul-versions-card'
    >
      <Table<AgentSoulVersion>
        rowKey='id'
        loading={loading}
        dataSource={versions}
        pagination={false}
        columns={[
          {
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
            width: 120,
            render: (value: number) => (
              <Space>
                <Text strong>v{value}</Text>
                {soulVersion === value ? <Tag color='green'>current</Tag> : null}
              </Space>
            ),
          },
          {
            title: 'Summary',
            key: 'change_summary',
            render: (_, row) => row.change_summary || <Text type='secondary'>No summary</Text>,
          },
          {
            title: 'Updated At',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 220,
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_, row) => (
              <Button
                size='small'
                type="text"
                icon={<RollbackOutlined />}
                disabled={!agentId || soulVersion === row.version}
                onClick={() => {
                  setRollbackTarget(row)
                  setChangeSummary(`rollback to v${row.version}`)
                }}
                className="flat-btn flat-btn--secondary"
              >
                Rollback
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title={rollbackTarget ? `Rollback to v${rollbackTarget.version}` : 'Rollback'}
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        onOk={async () => {
          if (!rollbackTarget) {
            return
          }

          const updated = await rollback(rollbackTarget.version, changeSummary.trim())
          if (updated && onAfterRollback) {
            await onAfterRollback()
          }
          setRollbackTarget(null)
        }}
        confirmLoading={loading}
        className='flat-modal'
      >
        <Space direction='vertical' className='agent-soul-versions-card__modal-body'>
          <Text>Change summary</Text>
          <Input
            value={changeSummary}
            onChange={(event) => setChangeSummary(event.target.value)}
            maxLength={255}
          />
        </Space>
      </Modal>
    </Card>
  )
}
