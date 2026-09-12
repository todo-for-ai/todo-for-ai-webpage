import { useMemo, useState } from 'react'
import { Button, Card, Col, Empty, Popconfirm, Row, Space, Spin, Tag, Tooltip } from 'antd'
import { ApartmentOutlined, ClockCircleOutlined, DeleteOutlined, HistoryOutlined, PlayCircleOutlined } from '@ant-design/icons'
import WorkflowDagViewer from '../../components/Workflow/WorkflowDagViewer'

interface Props {
  workflows: any
  loading: any
  handleDelete: any
  loadData: any
  openLaunch: any
  openTriggerModal: any
  openVersionModal: any
}

export default function WorkflowDefinitionsCard(props: Props) {
  const { workflows,
    loading,
    handleDelete,
    loadData,
    openLaunch,
    openTriggerModal,
    openVersionModal } = props

  return (
    <>
      {/* Workflow definitions */}
      <Card title="工作流定义" style={{ marginBottom: 24 }} extra={<Button size="small" onClick={loadData}>刷新</Button>}>
        <Spin spinning={loading}>
          {workflows.length === 0 ? (
            <Empty description="暂无工作流，点击「创建工作流」开始" />
          ) : (
            <Row gutter={[16, 16]}>
              {workflows.map(wf => (
                <Col key={wf.id} xs={24} sm={12} lg={8}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <ApartmentOutlined />
                        {wf.name}
                        <Tag color={wf.is_active ? 'green' : 'default'}>{wf.is_active ? '活跃' : '停用'}</Tag>
                        {wf.max_parallel_steps > 0 && <Tag color="purple">最多 {wf.max_parallel_steps} 并行</Tag>}
                        {wf.version > 1 && <Tag color="blue">v{wf.version}</Tag>}
                      </Space>
                    }
                    extra={
                      <Space>
                        <Tooltip title="启动运行">
                          <Button
                            size="small"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            disabled={!wf.is_active}
                            onClick={() => openLaunch(wf.id)}
                          />
                        </Tooltip>
                        <Tooltip title="添加定时触发器">
                          <Button
                            size="small"
                            icon={<ClockCircleOutlined />}
                            onClick={() => openTriggerModal(wf.id)}
                          />
                        </Tooltip>
                        <Tooltip title="版本历史">
                          <Button
                            size="small"
                            icon={<HistoryOutlined />}
                            onClick={() => openVersionModal(wf.id)}
                          />
                        </Tooltip>
                        <Popconfirm title="确定删除此工作流？" onConfirm={() => handleDelete(wf.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    {wf.description && (
                      <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
                        {wf.description.length > 80 ? wf.description.substring(0, 80) + '...' : wf.description}
                      </div>
                    )}
                    <WorkflowDagViewer
                      steps={wf.steps.map(s => ({
                        step_key: s.step_key,
                        name: s.name,
                        depends_on: s.depends_on || [],
                        agent_id: s.agent_id,
                        required_capabilities: s.required_capabilities,
                      }))}
                      width={280}
                      height={160}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>
    </>
  )
}
