import { Card, Tag, Space, Table } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import type { AgentProductivityByKind } from '../../api/agents'

const kindColor: Record<string, string> = { assistant: '#1677ff', worker: '#52c41a', orchestrator: '#722ed1', reviewer: '#13c2c2' }

const AgentProductivityByKindCard: React.FC<{ data: AgentProductivityByKind | null }> = ({ data }) => {
  if (!data) return null
  if (data.items.length === 0) return null
  const maxTotal = Math.max(1, ...data.items.map((k) => k.total))
  const maxHours = Math.max(1, ...data.items.map((k) => k.avg_completion_hours ?? 0))
  const columns = [
    { title: '类别', dataIndex: 'kind', key: 'kind', render: (k: string) => <Tag color={kindColor[k] || 'default'}>{k}</Tag> },
    { title: 'Agent数', dataIndex: 'agent_count', key: 'agent_count', width: 80 },
    { title: '分配', dataIndex: 'total', key: 'total', width: 80, render: (v: number) => <Space size={4}>{v}<div style={{ width: 60, height: 6, background: '#f0f0f0', borderRadius: 3 }}><div style={{ width: `${(v / maxTotal) * 100}%`, height: '100%', background: '#1677ff', borderRadius: 3 }} /></div></Space> },
    { title: '完成', dataIndex: 'done', key: 'done', width: 70 },
    { title: '完成率', dataIndex: 'completion_rate', key: 'completion_rate', width: 90, render: (v: number) => <Tag color={v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red'}>{v}%</Tag> },
    { title: '失败率', dataIndex: 'failure_rate', key: 'failure_rate', width: 90, render: (v: number) => <Tag color={v <= 10 ? 'green' : v <= 30 ? 'orange' : 'red'}>{v}%</Tag> },
    { title: '平均完成(h)', dataIndex: 'avg_completion_hours', key: 'avg_completion_hours', width: 140, render: (v: number | null) => v == null ? '-' : <Space size={4}><span style={{ minWidth: 36, textAlign: 'right' }}>{v}</span><div style={{ width: 70, height: 8, background: '#f0f0f0', borderRadius: 4 }}><div style={{ width: `${(v / maxHours) * 100}%`, height: '100%', background: '#fa8c16', borderRadius: 4 }} /></div></Space> },
  ]
  return (
    <Card title={<Space><ThunderboltOutlined /> 按 Agent 类别 产出对比</Space>} style={{ marginBottom: 24 }}>
      <Table size="small" pagination={false} columns={columns} dataSource={data.items} rowKey="kind" />
    </Card>
  )
}

export default AgentProductivityByKindCard