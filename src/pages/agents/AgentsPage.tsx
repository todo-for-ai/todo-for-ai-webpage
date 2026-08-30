import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Pagination,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import {
  AppstoreOutlined,
  EditOutlined,
  OrderedListOutlined,
  PlusOutlined,
  RobotOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Agent, AgentStatus } from '../../api/agents'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { AgentWorkspaceActivityCenter } from './components/AgentWorkspaceActivityCenter'
import { useAgentsPage } from './hooks/useAgentsPage'
import {
  loadAgentsViewModeFromIndexedDb,
  saveAgentsViewModeToIndexedDb,
  type AgentsViewMode,
} from './storage'

const { Title, Paragraph, Text } = Typography
const { Search } = Input

const statusColorMap: Record<string, string> = {
  active: 'green',
  inactive: 'orange',
  revoked: 'default',
}

type WorkspaceTabKey = 'agents' | 'activity_center'

export default function AgentsPage() {
  const { tp, pageTitle, pageSubtitle } = usePageTranslation('agents')
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<AgentsViewMode>('list')
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabKey>('agents')

  const {
    workspaces,
    workspaceId,
    setWorkspaceId,
    agents,
    agentsPagination,
    agentSearchInput,
    updateAgentSearchInput,
    applyAgentSearch,
    agentStatusFilter,
    updateAgentStatusFilter,
    updateAgentPage,
    loading,
    revokeAgent,
  } = useAgentsPage()

  useEffect(() => {
    let active = true
    void loadAgentsViewModeFromIndexedDb().then((mode) => {
      if (active) {
        setViewMode(mode)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const workspaceOptions = useMemo(
    () => workspaces.map((item) => ({ label: item.name, value: item.id })),
    [workspaces]
  )

  const handleViewModeChange = (mode: AgentsViewMode) => {
    setViewMode(mode)
    void saveAgentsViewModeToIndexedDb(mode)
  }

  const toAgentDetail = (agentId: number) => {
    navigate(`/todo-for-ai/pages/agents/${agentId}/overview${workspaceId ? `?workspace_id=${workspaceId}` : ''}`)
  }

  const listCard = (
    <Card
      style={{ marginBottom: 16 }}
      title={tp('table.title')}
      extra={
        <Space wrap>
          <Search
            allowClear
            value={agentSearchInput}
            placeholder={tp('table.search', { defaultValue: 'Search agent name/display name' })}
            onChange={(event) => updateAgentSearchInput(event.target.value)}
            onSearch={applyAgentSearch}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            value={agentStatusFilter || undefined}
            placeholder={tp('table.statusFilter', { defaultValue: 'Status' })}
            options={[
              { value: 'active', label: tp('form.status.active') },
              { value: 'inactive', label: tp('form.status.inactive') },
              { value: 'revoked', label: tp('form.status.revoked') },
            ]}
            onChange={(value) => updateAgentStatusFilter((value || '') as AgentStatus | '')}
            style={{ width: 160 }}
          />
          <Text type="secondary">
            {tp('table.totalCount', { defaultValue: '{{count}} total', count: agentsPagination.total })}
          </Text>
        </Space>
      }
    >
      {viewMode === 'list' ? (
        <Table<Agent>
          rowKey="id"
          loading={loading}
          dataSource={agents}
          pagination={{
            current: agentsPagination.page,
            pageSize: agentsPagination.per_page,
            total: agentsPagination.total,
            showSizeChanger: true,
          }}
          onChange={(pagination) => {
            updateAgentPage(pagination.current || 1, pagination.pageSize || agentsPagination.per_page)
          }}
          columns={[
            {
              title: tp('table.agent'),
              key: 'name',
              render: (_, row) => (
                <Space>
                  <RobotOutlined style={{ color: '#1677ff' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.display_name || row.name}</div>
                    <Text type="secondary">#{row.id}</Text>
                  </div>
                </Space>
              ),
            },
            {
              title: tp('table.status'),
              dataIndex: 'status',
              key: 'status',
              width: 120,
              render: (value: string) => <Tag color={statusColorMap[value] || 'default'}>{value}</Tag>,
            },
            {
              title: tp('table.capabilities'),
              key: 'capability_tags',
              render: (_, row) => (
                <Space wrap>
                  {(row.capability_tags || []).slice(0, 4).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: tp('table.actions'),
              key: 'actions',
              width: 300,
              render: (_, row) => (
                <Space>
                  <Button
                    size="small"
                    icon={<RobotOutlined />}
                    onClick={() => toAgentDetail(row.id)}
                  >
                    {tp('table.viewDetail', { defaultValue: 'Detail' })}
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(
                        `/todo-for-ai/pages/agents/${row.id}/edit${workspaceId ? `?workspace_id=${workspaceId}` : ''}`
                      )
                    }}
                  >
                    {tp('table.edit')}
                  </Button>

                  <Popconfirm
                    title={tp('table.revokeConfirmTitle')}
                    description={tp('table.revokeConfirmDesc')}
                    okText={tp('table.revoke')}
                    cancelText={tp('form.cancel')}
                    onConfirm={(event) => {
                      event?.stopPropagation()
                      return revokeAgent(row.id)
                    }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<StopOutlined />}
                      onClick={(event) => event.stopPropagation()}
                      disabled={row.status === 'revoked'}
                    >
                      {tp('table.revoke')}
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      ) : agents.length === 0 && !loading ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Row gutter={[16, 16]}>
            {agents.map((row) => (
              <Col key={row.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  actions={[
                    <Button
                      key="detail"
                      type="text"
                      icon={<RobotOutlined />}
                      onClick={(event) => {
                        event.stopPropagation()
                        toAgentDetail(row.id)
                      }}
                    >
                      {tp('table.viewDetail', { defaultValue: 'Detail' })}
                    </Button>,
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(
                          `/todo-for-ai/pages/agents/${row.id}/edit${workspaceId ? `?workspace_id=${workspaceId}` : ''}`
                        )
                      }}
                    >
                      {tp('table.edit')}
                    </Button>,
                    <Popconfirm
                      key="revoke"
                      title={tp('table.revokeConfirmTitle')}
                      description={tp('table.revokeConfirmDesc')}
                      okText={tp('table.revoke')}
                      cancelText={tp('form.cancel')}
                      onConfirm={(event) => {
                        event?.stopPropagation()
                        return revokeAgent(row.id)
                      }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<StopOutlined />}
                        onClick={(event) => event.stopPropagation()}
                        disabled={row.status === 'revoked'}
                      >
                        {tp('table.revoke')}
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <Space align="start">
                    <RobotOutlined style={{ color: '#1677ff', fontSize: 18, marginTop: 4 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                        {row.display_name || row.name}
                      </div>
                      <Text type="secondary">#{row.id}</Text>
                    </div>
                  </Space>

                  <div style={{ marginTop: 12 }}>
                    <Tag color={statusColorMap[row.status] || 'default'}>{row.status}</Tag>
                  </div>

                  <Space wrap style={{ marginTop: 12 }}>
                    {(row.capability_tags || []).slice(0, 6).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              current={agentsPagination.page}
              pageSize={agentsPagination.per_page}
              total={agentsPagination.total}
              showSizeChanger
              onChange={(page, pageSize) => updateAgentPage(page, pageSize)}
            />
          </div>
        </Space>
      )}
    </Card>
  )

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} className="page-title" style={{ marginBottom: 8 }}>
              {pageTitle}
            </Title>
            <Paragraph className="page-description" style={{ marginBottom: 0 }}>
              {pageSubtitle}
            </Paragraph>
          </div>

          <Space>
            <Space>
              <Text type="secondary">{tp('viewMode.label')}</Text>
              <Segmented<AgentsViewMode>
                value={viewMode}
                onChange={(value) => handleViewModeChange(value)}
                options={[
                  {
                    value: 'list',
                    label: (
                      <Space size={6}>
                        <OrderedListOutlined />
                        {tp('viewMode.list')}
                      </Space>
                    ),
                  },
                  {
                    value: 'card',
                    label: (
                      <Space size={6}>
                        <AppstoreOutlined />
                        {tp('viewMode.card')}
                      </Space>
                    ),
                  },
                ]}
              />
            </Space>
            <Select
              placeholder={tp('form.workspace')}
              value={workspaceId || undefined}
              options={workspaceOptions}
              style={{ minWidth: 240 }}
              onChange={(value) => setWorkspaceId(value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                navigate(
                  `/todo-for-ai/pages/agents/create${workspaceId ? `?workspace_id=${workspaceId}` : ''}`
                )
              }
              disabled={!workspaceId}
            >
              {tp('form.create')}
            </Button>
          </Space>
        </Space>
      </div>

      <Tabs
        activeKey={workspaceTab}
        onChange={(key) => setWorkspaceTab(key as WorkspaceTabKey)}
        items={[
          {
            key: 'agents',
            label: tp('workspaceTabs.agents', { defaultValue: 'Agent List' }),
            children: listCard,
          },
          {
            key: 'activity_center',
            label: tp('workspaceTabs.activityCenter', { defaultValue: 'Activity Center' }),
            children: <AgentWorkspaceActivityCenter workspaceId={workspaceId} />,
          },
        ]}
      />
    </div>
  )
}
