import React, { useEffect, useState, useCallback } from 'react'
import { Drawer, Descriptions, Table, Button, Modal, Form, Input, Select, Popconfirm, Tag, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { agentTeamsApi } from '../api/agentTeams'
import type { AgentTeam, AgentTeamMember } from '../api/agentTeams'
import { getErrorMessage } from '../utils/errorUtils'

interface AgentTeamDetailProps {
  workspaceId: number
  teamId: number | null
  visible: boolean
  onClose: () => void
  onUpdated: () => void
}

const STRATEGY_OPTIONS = [
  { value: 'sequential', label: '顺序执行' },
  { value: 'parallel', label: '并行执行' },
  { value: 'map_reduce', label: 'MapReduce' },
  { value: 'debate', label: '辩论' },
  { value: 'voting', label: '投票' },
]

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  archived: 'orange',
}

const AgentTeamDetail: React.FC<AgentTeamDetailProps> = ({ workspaceId, teamId, visible, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false)
  const [team, setTeam] = useState<AgentTeam | null>(null)
  const [members, setMembers] = useState<AgentTeamMember[]>([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false)
  const [editForm] = Form.useForm()
  const [memberForm] = Form.useForm()

  const loadTeam = useCallback(async () => {
    if (!teamId) return
    try {
      setLoading(true)
      const data = await agentTeamsApi.get(workspaceId, teamId)
      setTeam(data)
      setMembers(data.members || [])
    } catch (error) {
      message.error(getErrorMessage(error, '加载团队详情失败'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, teamId])

  useEffect(() => {
    if (visible && teamId) {
      void loadTeam()
    }
  }, [visible, teamId, loadTeam])

  const handleUpdateTeam = async (values: Partial<AgentTeam>) => {
    if (!teamId) return
    try {
      await agentTeamsApi.update(workspaceId, teamId, values)
      message.success('团队已更新')
      setEditModalVisible(false)
      void loadTeam()
      onUpdated()
    } catch (error) {
      message.error(getErrorMessage(error, '更新团队失败'))
    }
  }

  const handleAddMember = async (values: Partial<AgentTeamMember>) => {
    if (!teamId) return
    try {
      await agentTeamsApi.addMember(workspaceId, teamId, values)
      message.success('成员已添加')
      setAddMemberModalVisible(false)
      memberForm.resetFields()
      void loadTeam()
      onUpdated()
    } catch (error) {
      message.error(getErrorMessage(error, '添加成员失败'))
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!teamId) return
    try {
      await agentTeamsApi.removeMember(workspaceId, teamId, memberId)
      message.success('成员已移除')
      void loadTeam()
      onUpdated()
    } catch (error) {
      message.error(getErrorMessage(error, '移除成员失败'))
    }
  }

  const openEditModal = () => {
    if (team) {
      editForm.setFieldsValue({
        name: team.name,
        description: team.description,
        default_strategy: team.default_strategy,
      })
    }
    setEditModalVisible(true)
  }

  const memberColumns = [
    {
      title: 'Agent名称',
      dataIndex: 'agent_name',
      key: 'agent_name',
      render: (text: string) => (
        <span><UserOutlined style={{ marginRight: 6 }} />{text || '-'}</span>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => text ? <Tag>{text}</Tag> : '-',
    },
    {
      title: '职责',
      dataIndex: 'responsibility',
      key: 'responsibility',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'order_index',
      key: 'order_index',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: AgentTeamMember) => (
        <Popconfirm
          title='确定移除该成员？'
          onConfirm={() => handleRemoveMember(record.id)}
          okText='确定'
          cancelText='取消'
        >
          <Button type='link' danger size='small' icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  const strategyLabel = team?.default_strategy
    ? STRATEGY_OPTIONS.find(s => s.value === team.default_strategy)?.label || team.default_strategy
    : '-'

  return (
    <>
      <Drawer
        title={team?.name || '团队详情'}
        open={visible}
        onClose={onClose}
        width={640}
        loading={loading}
        extra={
          <Button icon={<EditOutlined />} onClick={openEditModal}>
            编辑
          </Button>
        }
      >
        {team && (
          <>
            <Descriptions column={2} size='small' bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label='描述' span={2}>
                {team.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='策略'>
                <Tag color='blue'>{strategyLabel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label='状态'>
                <Tag color={STATUS_COLORS[team.status] || 'default'}>{team.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label='创建时间' span={2}>
                {new Date(team.created_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 500, fontSize: 15 }}>成员列表</span>
              <Button
                type='primary'
                size='small'
                icon={<PlusOutlined />}
                onClick={() => setAddMemberModalVisible(true)}
              >
                添加成员
              </Button>
            </div>

            <Table
              dataSource={members}
              columns={memberColumns}
              rowKey='id'
              size='small'
              pagination={false}
              locale={{ emptyText: '暂无成员' }}
            />
          </>
        )}
      </Drawer>

      {/* Edit Team Modal */}
      <Modal
        title='编辑团队'
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => editForm.submit()}
        okText='保存'
        cancelText='取消'
      >
        <Form form={editForm} onFinish={handleUpdateTeam} layout='vertical'>
          <Form.Item name='name' label='团队名称' rules={[{ required: true, message: '请输入团队名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name='description' label='描述'>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name='default_strategy' label='默认策略'>
            <Select options={STRATEGY_OPTIONS} placeholder='选择策略' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        title='添加成员'
        open={addMemberModalVisible}
        onCancel={() => {
          setAddMemberModalVisible(false)
          memberForm.resetFields()
        }}
        onOk={() => memberForm.submit()}
        okText='添加'
        cancelText='取消'
      >
        <Form form={memberForm} onFinish={handleAddMember} layout='vertical'>
          <Form.Item name='agent_id' label='Agent ID' rules={[{ required: true, message: '请输入Agent ID' }]}>
            <Input type='number' />
          </Form.Item>
          <Form.Item name='role' label='角色'>
            <Select placeholder='选择角色'>
              <Select.Option value='leader'>Leader</Select.Option>
              <Select.Option value='worker'>Worker</Select.Option>
              <Select.Option value='reviewer'>Reviewer</Select.Option>
              <Select.Option value='specialist'>Specialist</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name='responsibility' label='职责'>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AgentTeamDetail
