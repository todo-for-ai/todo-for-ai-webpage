import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Divider, InputNumber, Row, Space, Statistic, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AgentSecretCollaborationResponse, AgentSecretCollaborator } from '../../../../api/agents'
import './SecretsCollaborationSection.css'

const { Text } = Typography

interface SecretsCollaborationSectionProps {
  collaboration: AgentSecretCollaborationResponse | null
  collaborationLoading: boolean
  collaborationProjectId: number | null
  onProjectIdChange: (value: number | null) => void
  onRefresh: () => void
}

const collaboratorColumns: ColumnsType<AgentSecretCollaborator> = [
  {
    title: 'Agent',
    key: 'agent',
    render: (_, row) => row.agent_name || `#${row.agent_id}`,
  },
  { title: 'Shares', dataIndex: 'share_count', key: 'share_count', width: 100 },
  { title: 'Active', dataIndex: 'active_share_count', key: 'active_share_count', width: 100 },
  { title: 'Secrets', dataIndex: 'secret_count', key: 'secret_count', width: 100 },
  {
    title: 'Last Update',
    dataIndex: 'last_updated_at',
    key: 'last_updated_at',
    width: 200,
    render: (value: string | null) => (value ? new Date(value).toLocaleString() : '-'),
  },
]

export function SecretsCollaborationSection({
  collaboration,
  collaborationLoading,
  collaborationProjectId,
  onProjectIdChange,
  onRefresh,
}: SecretsCollaborationSectionProps) {
  return (
    <section className='agent-secrets-collaboration'>
      <Divider className='agent-secrets-collaboration__divider' />
      <Space wrap align='center' className='agent-secrets-collaboration__toolbar'>
        <Text strong>Secret Collaboration Topology</Text>
        <InputNumber
          min={1}
          value={collaborationProjectId ?? undefined}
          placeholder='Filter by Project ID'
          onChange={(value) => onProjectIdChange(typeof value === 'number' ? value : null)}
          className='agent-secrets-collaboration__project-input'
        />
        <Button type="text" icon={<ReloadOutlined />} onClick={onRefresh} className="flat-btn flat-btn--secondary">
          Refresh
        </Button>
      </Space>

      <Row gutter={[12, 12]} className='agent-secrets-collaboration__stats'>
        <Card size='small' className='agent-secrets-collaboration__stat-card'>
          <Statistic
            title='Outgoing Shares'
            value={collaboration?.stats?.outgoing_share_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size='small' className='agent-secrets-collaboration__stat-card'>
          <Statistic
            title='Incoming Shares'
            value={collaboration?.stats?.incoming_share_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size='small' className='agent-secrets-collaboration__stat-card'>
          <Statistic
            title='Outgoing Agents'
            value={collaboration?.stats?.outgoing_agent_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size='small' className='agent-secrets-collaboration__stat-card'>
          <Statistic
            title='Incoming Agents'
            value={collaboration?.stats?.incoming_agent_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size='small' className='agent-secrets-collaboration__stat-card'>
          <Statistic
            title='Active Edges'
            value={collaboration?.stats?.active_edge_count || 0}
            loading={collaborationLoading}
          />
        </Card>
      </Row>

      <Text strong>Outgoing Collaborators</Text>
      <Table<AgentSecretCollaborator>
        rowKey='agent_id'
        size='small'
        loading={collaborationLoading}
        dataSource={collaboration?.outgoing_collaborators || []}
        pagination={false}
        className='agent-secrets-collaboration__table'
        columns={collaboratorColumns}
      />

      <Text strong>Incoming Collaborators</Text>
      <Table<AgentSecretCollaborator>
        rowKey='agent_id'
        size='small'
        loading={collaborationLoading}
        dataSource={collaboration?.incoming_collaborators || []}
        pagination={false}
        className='agent-secrets-collaboration__table'
        columns={collaboratorColumns}
      />
    </section>
  )
}
