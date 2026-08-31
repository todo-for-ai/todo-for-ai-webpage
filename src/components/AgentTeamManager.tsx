import React, { useEffect, useState, useCallback } from 'react'
import { Card, Button, Modal, Form, Input, Select, Tag, Popconfirm, Empty, Spin, Row, Col, Space, message } from 'antd'
import { PlusOutlined, TeamOutlined, DeleteOutlined } from '@ant-design/icons'
import { agentTeamsApi } from '../api/agentTeams'
import type { AgentTeam } from '../api/agentTeams'
import { getErrorMessage } from '../utils/errorUtils'
import AgentTeamDetail from './AgentTeamDetail'

interface AgentTeamManagerProps {
  workspaceId: number
}

const STRATEGY_OPTIONS = [
  { value: 'sequential', label: '顺序执行' },
  { value: 'parallel', label: '并行执行' },
  { value: 'map_reduce', label: 'MapReduce' },
  { value: 'debate', label: '辩论' },
  { value: 'voting', label: '投票' },
]

const STRATEGY_COLORS: Record<string, string> = {
  sequential: 'blue',
  parallel: 'green',
  map_reduce: 'purple',
  debate: 'orange',
  voting: 'cyan',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  archived: 'orange',
}

const AgentTeamManager: React.FC<AgentTeamManagerProps> = ({ workspaceId }) => {
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<AgentTeam[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailTeamId, setDetailTeamId] = useState<number | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [createForm] = Form.useForm()

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true)
      const result = await agentTeamsApi.list(workspaceId)
      setTeams(result.items || [])
    } catch (error) {
      message.error(getErrorMessage(error, '加载团队列表失败'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void loadTeams()
  }, [loadTeams])

  const handleCreate = async (values: Partial<AgentTeam>) => {
    try {
      await agentTeamsApi.create(workspaceId, values)
      message.success('团队已创建')
      setCreateModalVisible(false)
      createForm.resetFields()
      void loadTeams()
    } catch (error) {
      message.error(getErrorMessage(error, '创建团队失败'))
    }
  }

  const handleDelete = async (teamId: number) => {
    try {
      await agentTeamsApi.delete(workspaceId, teamId)
      message.success('团队已删除')
      void loadTeams()
    } catch (error) {
      message.error(getErrorMessage(error, '删除团队失败'))
    }
  }

  const openDetail = (teamId: number) => {
    setDetailTeamId(teamId)
    setDetailVisible(true)
  }

  const closeDetail = () => {
    setDetailVisible(false)
    setDetailTeamId(null)
  }

  const strategyLabel = (value?: string) => {
    if (!value) return '-'
    return STRATEGY_OPTIONS.find(s => s.value === value)?.label || value
  }

  if (loading && teams.length === 0) {
    return (
      <Card className='flat-card'>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card
        className='flat-card'
        title={<span><TeamOutlined style={{ marginRight: 8 }} />Agent Teams</span>}
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建团队
          </Button>
        }
      >
        {teams.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无团队' />
        ) : (
          <Row gutter={[12, 12]}>
            {teams.map((team) => (
              <Col key={team.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  className='flat-card'
                  size='small'
                  style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => openDetail(team.id)}
                  hoverable
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <TeamOutlined style={{ marginRight: 6 }} />
                      {team.name}
                    </span>
                    <Popconfirm
                      title='确定删除该团队？'
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        handleDelete(team.id)
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText='确定'
                      cancelText='取消'
                    >
                      <Button
                        type='text'
                        danger
                        size='small'
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>

                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    {team.description
                      ? (team.description.length > 60
                          ? team.description.slice(0, 60) + '...'
                          : team.description)
                      : '暂无描述'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={STRATEGY_COLORS[team.default_strategy || ''] || 'default'}>
                      {strategyLabel(team.default_strategy)}
                    </Tag>
                    <Space size={8}>
                      <Tag color={STATUS_COLORS[team.status] || 'default'}>{team.status}</Tag>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {team.members?.length || 0} 成员
                      </span>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Create Team Modal */}
      <Modal
        title='创建团队'
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          createForm.resetFields()
        }}
        onOk={() => createForm.submit()}
        okText='创建'
        cancelText='取消'
      >
        <Form form={createForm} onFinish={handleCreate} layout='vertical'>
          <Form.Item name='name' label='团队名称' rules={[{ required: true, message: '请输入团队名称' }]}>
            <Input placeholder='输入团队名称' />
          </Form.Item>
          <Form.Item name='description' label='描述'>
            <Input.TextArea rows={3} placeholder='描述团队的用途和职责' />
          </Form.Item>
          <Form.Item name='default_strategy' label='默认策略'>
            <Select options={STRATEGY_OPTIONS} placeholder='选择默认编排策略' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Team Detail Drawer */}
      <AgentTeamDetail
        workspaceId={workspaceId}
        teamId={detailTeamId}
        visible={detailVisible}
        onClose={closeDetail}
        onUpdated={loadTeams}
      />
    </>
  )
}

export default AgentTeamManager
