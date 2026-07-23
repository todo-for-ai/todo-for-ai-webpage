import React from 'react'
import {
  Button,
  Divider,
  Drawer,
  Empty,
  InputNumber,
  List,
  message,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SearchOutlined,
  ShareAltOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { Agent, TaskAssignment, TaskEvent } from '../../../api/agents'
import CapabilityRadar from '../../../components/Agent/CapabilityRadar'
import CollaborationGraphView from '../../../components/CollaborationGraphView'
import ReputationSparkline from '../../../components/ReputationSparkline'
import { renderCapabilities } from '../utils'
import { KnowledgeDrawer, ExperienceDrawer } from '.'

const { Text } = Typography
export type { KnowledgeDrawerProps, ExperienceDrawerProps } from '.'

export interface AgentDetailDrawerProps {
  open: boolean
  selectedAgent: Agent | null
  agents: Agent[]
  assignments: TaskAssignment[]
  assignmentLoading: boolean
  assignmentColumns: any[]
  inboxItems: TaskEvent[]
  claimTaskId: number | null
  agentReputation: any
  agentSandbox: any
  reputationHistory: any
  collaborators: any[]
  collaboratorsLoading: boolean
  collabSubgraph: any
  experiences: any[]
  experiencesLoading: boolean
  experienceCreateOpen: boolean
  experienceForm: any
  experienceDetailOpen: boolean
  experienceDetail: any
  sharedExperiencesOpen: boolean
  sharedExperiences: any[]
  crossProjects: any[]
  crossProjectLoading: boolean
  knowledgeProps: React.ComponentProps<typeof KnowledgeDrawer>
  experienceProps: React.ComponentProps<typeof ExperienceDrawer>
  onClose: () => void
  onClaimTaskIdChange: (id: number | null) => void
  onClaimTask: (agent: Agent, taskId?: number | null, matchCapabilities?: boolean) => void
  onRefreshAssignments: (agent: Agent) => void
  onNavigate: (path: string) => void
  onOpenAgent: (agent: Agent) => void
  onRecalculateReputation: () => void
  onOpenSandboxes: () => void
  onLoadAdaptSuggestions: (agent: Agent) => void
  adaptLoading: boolean
  onSetDrawerOpen: (open: boolean) => void
  onSetExperienceCreateOpen: (open: boolean) => void
  onAutoExtractExperiences: () => void
  onLoadSharedExperiences: () => void
  sharedExperiencesLoading: boolean
  onApplyDecay: () => void
  onValidateExperience: (expId: number, isAccurate: boolean) => void
  onShareExperience: (expId: number) => void
  onDeleteExperience: (expId: number) => void
  onOpenExperienceDetail: (exp: any) => void
  onSetAuthorizeOpen: (open: boolean) => void
  onOpenCrossProject: () => void
  onLoadCrossProjectTasks: () => void
  crossTasksLoading: boolean
  onRevokeCrossProject: (projectId: number) => void
}

const AgentDetailDrawer: React.FC<AgentDetailDrawerProps> = ({
  open,
  selectedAgent,
  agents,
  assignments,
  assignmentLoading,
  assignmentColumns,
  inboxItems,
  claimTaskId,
  agentReputation,
  agentSandbox,
  reputationHistory,
  collaborators,
  collaboratorsLoading,
  collabSubgraph,
  experiences,
  experiencesLoading,
  experienceCreateOpen,
  experienceForm,
  experienceDetailOpen,
  experienceDetail,
  sharedExperiencesOpen,
  sharedExperiences,
  crossProjects,
  crossProjectLoading,
  knowledgeProps,
  experienceProps,
  onClose,
  onClaimTaskIdChange,
  onClaimTask,
  onRefreshAssignments,
  onNavigate,
  onOpenAgent,
  onRecalculateReputation,
  onOpenSandboxes,
  onLoadAdaptSuggestions,
  adaptLoading,
  onSetDrawerOpen,
  onSetExperienceCreateOpen,
  onAutoExtractExperiences,
  onLoadSharedExperiences,
  sharedExperiencesLoading,
  onApplyDecay,
  onValidateExperience,
  onShareExperience,
  onDeleteExperience,
  onOpenExperienceDetail,
  onSetAuthorizeOpen,
  onOpenCrossProject,
  onLoadCrossProjectTasks,
  crossTasksLoading,
  onRevokeCrossProject,
}) => {
  return (
    <Drawer
      title={selectedAgent ? `${selectedAgent.name} 的派发记录` : '派发记录'}
      width={980}
      open={open}
      onClose={onClose}
    >
      {selectedAgent && (
        <Space direction="vertical" size={12} style={{ marginBottom: 16, width: '100%' }}>
          {/* Agent status & capabilities overview */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Space wrap style={{ marginBottom: 8 }}>
                <Tag color={selectedAgent.status === 'active' ? 'green' : selectedAgent.status === 'paused' ? 'orange' : 'default'}>
                  {selectedAgent.status}
                </Tag>
                <Tag>{selectedAgent.kind}</Tag>
                {selectedAgent.collaboration_role && selectedAgent.collaboration_role !== 'standalone' && (
                  <Tag color={selectedAgent.collaboration_role === 'leader' ? 'gold' : 'cyan'}>
                    {selectedAgent.collaboration_role === 'leader' ? '领导者' : '跟随者'}
                  </Tag>
                )}
                {selectedAgent.last_seen_at && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    最近心跳: {new Date(selectedAgent.last_seen_at).toLocaleString()}
                  </Text>
                )}
                {agentReputation && (
                  <Tag color={agentReputation.score >= 70 ? 'green' : agentReputation.score >= 40 ? 'orange' : 'red'} style={{ cursor: 'pointer' }} onClick={onRecalculateReputation}>
                    声誉: {agentReputation.score.toFixed(1)} ({agentReputation.completed_tasks || 0}✓ {agentReputation.failed_tasks || 0}✗)
                  </Tag>
                )}
                {agentSandbox ? (
                  <Tag color={agentSandbox.security_level === 'strict' ? 'red' : agentSandbox.security_level === 'permissive' ? 'green' : 'orange'} icon={<SafetyOutlined />} style={{ cursor: 'pointer' }} onClick={onOpenSandboxes}>
                    沙盒: {agentSandbox.name} [{agentSandbox.security_level}] 执行={agentSandbox.stats?.total_executions || 0} 违规={agentSandbox.stats?.violations || 0}
                  </Tag>
                ) : (
                  <Tag onClick={onOpenSandboxes} style={{ cursor: 'pointer' }}>未绑定沙盒</Tag>
                )}
              </Space>
              {reputationHistory && reputationHistory.points.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>声誉趋势（{reputationHistory.points.length} 次变化，点击点跳转任务）</Text>
                  <ReputationSparkline
                    points={reputationHistory.points}
                    currentScore={agentReputation?.score}
                    width={240}
                    height={56}
                    onPointClick={(p) => {
                      if (p.task_id) {
                        onNavigate(`/todo-for-ai/pages/tasks/${p.task_id}`)
                      } else if (p.workflow_run_id) {
                        message.info(`工作流运行 #${p.workflow_run_id}（暂无独立详情页）`)
                      }
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {renderCapabilities(selectedAgent.capabilities, 12)}
              </div>
            </div>
            {(selectedAgent.capabilities || []).length >= 3 && (
              <CapabilityRadar capabilities={selectedAgent.capabilities || []} size={140} />
            )}
          </div>
          {/* 协作伙伴排行（基于直接消息审计聚合） */}
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">协作伙伴</Text>
            <Spin spinning={collaboratorsLoading} size="small">
              {collaborators.length > 0 ? (
                <List
                  size="small"
                  dataSource={collaborators.slice(0, 5)}
                  renderItem={(c: any) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text
                          ellipsis
                          style={{ maxWidth: 160, color: '#1890ff', cursor: 'pointer' }}
                          onClick={() => {
                            onSetDrawerOpen(false)
                            const target = agents.find((a) => a.id === c.agent_id)
                            if (target) {
                              onOpenAgent(target)
                            } else {
                              onNavigate(`/todo-for-ai/pages/agents?agent_id=${c.agent_id}`)
                            }
                          }}
                        >
                          {c.name}
                        </Text>
                        <Space size={4}>
                          <Tag>发 {c.sent}</Tag>
                          <Tag>收 {c.received}</Tag>
                          <Tag color="blue">合计 {c.total}</Tag>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>暂无协作伙伴记录</Text>
              )}
            </Spin>
          </div>
          {/* 协作关系子图：以当前 Agent 为中心 */}
          {collabSubgraph && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">协作关系图</Text>
              <div style={{ marginTop: 4 }}>
                <CollaborationGraphView
                  data={collabSubgraph}
                  size={300}
                  layout="grid"
                  centerNodeId={selectedAgent?.id}
                  storageKey={selectedAgent ? `agentsCollabGraphDetail_${selectedAgent.id}` : undefined}
                  onNodeClick={(agentId) => {
                    if (agentId === selectedAgent?.id) return
                    onSetDrawerOpen(false)
                    const target = agents.find((a) => a.id === agentId)
                    if (target) {
                      onOpenAgent(target)
                    } else {
                      onNavigate(`/todo-for-ai/pages/agents?agent_id=${agentId}`)
                    }
                  }}
                />
              </div>
            </div>
          )}
          <Space wrap>
            <Text type="secondary">能力</Text>
            {renderCapabilities(selectedAgent.capabilities, 8)}
            <Button size="small" icon={<BulbOutlined />} onClick={() => onLoadAdaptSuggestions(selectedAgent)} loading={adaptLoading}>自适应</Button>
          </Space>
          <Space wrap>
            <InputNumber
              placeholder="指定任务 ID"
              value={claimTaskId}
              onChange={value => onClaimTaskIdChange(value)}
              min={1}
              style={{ width: 160 }}
            />
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              disabled={!claimTaskId}
              onClick={() => onClaimTask(selectedAgent, claimTaskId)}
            >
              指定领取
            </Button>
            <Button icon={<PlayCircleOutlined />} onClick={() => onClaimTask(selectedAgent, null, true)}>
              智能领取
            </Button>
            <Button onClick={() => onClaimTask(selectedAgent, null, false)}>
              优先级领取
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => onRefreshAssignments(selectedAgent)}>
              刷新
            </Button>
          </Space>
        </Space>
      )}
      {selectedAgent && inboxItems.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
            <Space>
              <SafetyOutlined />
              <Text>收件箱（@提及）</Text>
              <Tag color="blue">{inboxItems.length}</Tag>
            </Space>
          </Divider>
          <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
            {inboxItems.map(event => (
              <div key={event.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space size={8} wrap>
                  <Tag color="geekblue">{event.event_type}</Tag>
                  <Text type="secondary">
                    {event.actor_agent?.name || event.actor_user?.name || event.actor_type}
                  </Text>
                  {event.payload?.content && <Text>{String(event.payload.content).slice(0, 120)}</Text>}
                  {(event.payload as Record<string, any>)?.task?.title && <Tag>任务 #{event.task_id} {String((event.payload as Record<string, any>).task.title).slice(0, 30)}</Tag>}
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(event.created_at).toLocaleString()}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <Table
        columns={assignmentColumns}
        dataSource={assignments}
        rowKey="id"
        loading={assignmentLoading}
        pagination={{ pageSize: 10 }}
      />

      {/* Knowledge Base */}
      <KnowledgeDrawer {...knowledgeProps} />

      {/* Agent Experience (Collective Intelligence) */}
      {selectedAgent && (
        <>
          <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
            <Space>
              <BulbOutlined />
              <Text>经验与学习</Text>
              <Tag color="purple">{experiences.length}</Tag>
            </Space>
          </Divider>
          <Space style={{ marginBottom: 8, width: '100%' }} wrap>
            <Button icon={<PlusOutlined />} onClick={() => onSetExperienceCreateOpen(true)}>添加经验</Button>
            <Button icon={<ThunderboltOutlined />} onClick={onAutoExtractExperiences}>自动提取</Button>
            <Button icon={<TeamOutlined />} onClick={onLoadSharedExperiences} loading={sharedExperiencesLoading}>群体学习</Button>
            <Button icon={<FieldTimeOutlined />} onClick={onApplyDecay}>衰减</Button>
          </Space>
          <Spin spinning={experiencesLoading}>
            {experiences.length === 0 && !experiencesLoading ? (
              <Empty description="暂无经验记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={experiences}
                style={{ maxHeight: 300, overflowY: 'auto' }}
                renderItem={(exp: any) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '6px 8px' }}
                    actions={[
                      <Tooltip key="validate" title="验证准确">
                        <Button size="small" icon={<CheckCircleOutlined />} onClick={(e) => { e.stopPropagation(); onValidateExperience(exp.id, true) }} />
                      </Tooltip>,
                      <Tooltip key="refute" title="反驳">
                        <Button size="small" danger icon={<CloseCircleOutlined />} onClick={(e) => { e.stopPropagation(); onValidateExperience(exp.id, false) }} />
                      </Tooltip>,
                      exp.is_shared
                        ? <Tag key="shared" color="green" style={{ fontSize: 10 }}>已分享</Tag>
                        : <Button key="share" size="small" icon={<ShareAltOutlined />} onClick={(e) => { e.stopPropagation(); onShareExperience(exp.id) }} />,
                      <Popconfirm key="del" title="确定删除？" onConfirm={() => onDeleteExperience(exp.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>,
                    ]}
                    onClick={() => onOpenExperienceDetail(exp)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={exp.experience_type === 'success_pattern' ? 'green' : exp.experience_type === 'failure_pattern' ? 'red' : 'blue'} style={{ fontSize: 10 }}>
                            {exp.experience_type === 'success_pattern' ? '成功' : exp.experience_type === 'failure_pattern' ? '失败' : exp.experience_type === 'strategy' ? '策略' : exp.experience_type === 'optimization' ? '优化' : '反模式'}
                          </Tag>
                          {exp.domain && <Tag color="purple" style={{ fontSize: 10 }}>{exp.domain}</Tag>}
                          <Text strong style={{ fontSize: 12 }}>{exp.strategy?.substring(0, 40) || '无策略'}</Text>
                        </Space>
                      }
                      description={
                        <Space size={4}>
                          <Text type="secondary" style={{ fontSize: 11 }}>置信度: {exp.confidence ?? 0.7}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>复用: {exp.times_reused || 0}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </>
      )}

      {/* Cross-Project Agent Collaboration */}
      {selectedAgent && (
        <>
          <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
            <Space>
              <SafetyOutlined />
              <Text>跨项目协作</Text>
              <Tag color="cyan">{crossProjects.length}</Tag>
            </Space>
          </Divider>
          <Space style={{ marginBottom: 8, width: '100%' }} wrap>
            <Button icon={<PlusOutlined />} onClick={() => onSetAuthorizeOpen(true)}>授权到项目</Button>
            <Button icon={<ReloadOutlined />} onClick={onOpenCrossProject} loading={crossProjectLoading}>刷新</Button>
            <Button icon={<SafetyOutlined />} onClick={onLoadCrossProjectTasks} loading={crossTasksLoading}>发现跨项目任务</Button>
          </Space>
          {crossProjects.length === 0 && !crossProjectLoading ? (
            <Empty description="暂无跨项目授权" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={crossProjects}
              style={{ maxHeight: 200, overflowY: 'auto' }}
              renderItem={(auth: any) => (
                <List.Item
                  actions={[
                    <Popconfirm key="revoke" title="确定撤销授权？" onConfirm={() => onRevokeCrossProject(auth.project_id)}>
                      <Button size="small" danger>撤销</Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{auth.project_name || `项目 #${auth.project_id}`}</Text>
                        <Tag color="blue">{auth.role_in_project}</Tag>
                        {auth.is_active ? <Tag color="green">活跃</Tag> : <Tag color="default">停用</Tag>}
                      </Space>
                    }
                    description={
                      <Space size={4}>
                        <Text type="secondary" style={{ fontSize: 11 }}>最大并发: {auth.max_concurrent_tasks || 3}</Text>
                        {auth.expires_at && <Text type="secondary" style={{ fontSize: 11 }}>到期: {new Date(auth.expires_at).toLocaleDateString()}</Text>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </>
      )}

      {/* Experience Modals */}
      <ExperienceDrawer {...experienceProps} />
    </Drawer>
  )
}

export default AgentDetailDrawer
