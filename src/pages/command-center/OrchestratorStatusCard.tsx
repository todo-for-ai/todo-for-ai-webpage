/**
 * 全局编排状态卡片
 *
 * 展示编排器运行状态、上次运行结果。
 */
import { useNavigate } from 'react-router-dom'
import { Alert, Badge, Card, Col, Dropdown, Empty, Row, Space, Statistic, Tag, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { OrchestratorStatus } from '../../api/agents'

const { Text } = Typography

interface OrchestratorStatusCardProps {
  orchestratorStatus: OrchestratorStatus | null
}

const OrchestratorStatusCard: FC<OrchestratorStatusCardProps> = ({ orchestratorStatus }) => {
  const navigate = useNavigate()

  return (
    <Card
      title={<Space><ThunderboltOutlined /> 全局编排状态</Space>}
      variant="borderless"
      extra={orchestratorStatus ? (
        <Badge status={orchestratorStatus.enabled ? 'success' : 'default'} text={orchestratorStatus.enabled ? '自动调度' : '手动'} />
      ) : null}
    >
      {orchestratorStatus ? (
        <>
          <Row gutter={16}>
            <Col span={12}><Statistic title="调度模式" value={orchestratorStatus.enabled ? '自动' : '手动'} valueStyle={{ fontSize: 16 }} /></Col>
            <Col span={12}>
              <Statistic
                title="运行间隔"
                value={orchestratorStatus.interval_seconds || 0}
                suffix="s"
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
          </Row>
          {orchestratorStatus.last_run ? (
            <Alert
              style={{ marginTop: 12 }}
              type={orchestratorStatus.last_run.error_count > 0 ? 'warning' : 'info'}
              showIcon
              message="上次运行"
              description={
                <span style={{ fontSize: 12 }}>
                  {orchestratorStatus.last_run.summary}
                  <Text type="secondary"> · 耗时 {orchestratorStatus.last_run.duration_seconds}s</Text>
                  {orchestratorStatus.last_run.error_count > 0 && (
                    <Text type="danger"> · {orchestratorStatus.last_run.error_count} 错误</Text>
                  )}
                  {orchestratorStatus.last_run.trigger_run_ids && orchestratorStatus.last_run.trigger_run_ids.length > 0 && (
                    <>
                      <Text type="secondary"> · </Text>
                      <Dropdown
                        menu={{
                          items: orchestratorStatus.last_run.trigger_run_ids.map((rid: number) => ({ key: String(rid), label: `Run #${rid}` })),
                          onClick: ({ key }) => navigate(`/todo-for-ai/pages/workflows?run_id=${key}`),
                        }}
                      >
                        <Tag color="purple" style={{ cursor: 'pointer' }}>查看运行 →</Tag>
                      </Dropdown>
                    </>
                  )}
                </span>
              }
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未运行编排" style={{ marginTop: 12 }} />
          )}
        </>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无编排状态" />
      )}
    </Card>
  )
}

export default OrchestratorStatusCard