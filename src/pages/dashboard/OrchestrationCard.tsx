/**
 * 全局协作编排卡片组件
 *
 * 展示全局编排状态：离线 Agent、过期租约、升级任务、超时步骤等。
 * 包含立即编排按钮和调度器上次运行摘要。
 */
import { Card, Row, Col, Statistic, Space, Tag, Badge, Tooltip, Popconfirm, Button, Alert, Empty } from 'antd'
import { ThunderboltOutlined, HistoryOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { OrchestrationResult, OrchestratorStatus } from '../../api/agents'

interface OrchestrationCardProps {
  orchestration: OrchestrationResult | null
  orchestratorStatus: OrchestratorStatus | null
  orchestrationLoading: boolean
  onRun: () => void
  onOpenHistory: () => void
}

const OrchestrationCard: FC<OrchestrationCardProps> = ({
  orchestration,
  orchestratorStatus,
  orchestrationLoading,
  onRun,
  onOpenHistory,
}) => {
  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined /> 全局协作编排
          {orchestratorStatus && (
            <Tooltip title={orchestratorStatus.enabled ? '内置调度器运行中（后台自动编排）' : '内置调度器未启用（需手动编排或外部 cron）'}>
              <Badge status={orchestratorStatus.enabled ? 'success' : 'default'} text={orchestratorStatus.enabled ? '自动' : '手动'} />
            </Tooltip>
          )}
        </Space>
      }
      style={{ marginBottom: 24 }}
      extra={
        <Space>
          <Button size="small" icon={<HistoryOutlined />} onClick={onOpenHistory}>
            历史
          </Button>
          <Popconfirm
            title="立即执行全局编排？"
            description="将依次执行：健康检查、工作流超时、触发器触发、冲突自动解决。"
            onConfirm={onRun}
          >
            <Button type="primary" size="small" icon={<ThunderboltOutlined />} loading={orchestrationLoading}>
              立即编排
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      {orchestration ? (
        <>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={4}>
              <Statistic title="离线 Agent" value={orchestration.stale_agents} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={4}>
              <Statistic title="过期租约" value={orchestration.expired_leases} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={4}>
              <Statistic title="升级任务" value={orchestration.escalated_tasks} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={4}>
              <Statistic title="超时步骤" value={orchestration.timed_out_steps} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={4}>
              <Statistic title="触发器触发" value={orchestration.triggers_fired} valueStyle={{ fontSize: 16, color: '#1890ff' }} />
            </Col>
            <Col span={4}>
              <Statistic title="冲突自动解决" value={orchestration.conflicts_auto_resolved} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
            </Col>
          </Row>
          <Space wrap size={[8, 4]}>
            <Tag>检测冲突 {orchestration.conflicts_detected}</Tag>
            <Tag>跳过冲突 {orchestration.conflicts_skipped}</Tag>
            <Tag color="blue">耗时 {orchestration.duration_seconds}s</Tag>
            {orchestration.trigger_run_ids.length > 0 && (
              <Tag color="purple">新 Run: {orchestration.trigger_run_ids.join(', ')}</Tag>
            )}
            {orchestration.errors.length > 0 && (
              <Tag color="error">错误 {orchestration.errors.length}</Tag>
            )}
          </Space>
          {orchestration.errors.length > 0 && (
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              message="部分阶段出错"
              description={<ul style={{ margin: 0, paddingLeft: 18 }}>{orchestration.errors.map((e, i) => <li key={i} style={{ fontSize: 12 }}>{e}</li>)}</ul>}
            />
          )}
        </>
      ) : (
        <Empty description="尚未执行编排。点击「立即编排」运行完整协作维护周期。" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {orchestratorStatus?.last_run && (
        <Alert
          style={{ marginTop: 12 }}
          type="info"
          showIcon
          message="调度器上次自动运行"
          description={
            <span style={{ fontSize: 12 }}>
              {orchestratorStatus.last_run.summary}
              <span style={{ color: '#8c8c8c' }}> · 耗时 {orchestratorStatus.last_run.duration_seconds}s</span>
              {orchestratorStatus.last_run.error_count > 0 && (
                <span style={{ color: '#ff4d4f' }}> · {orchestratorStatus.last_run.error_count} 个错误</span>
              )}
            </span>
          }
        />
      )}
    </Card>
  )
}

export default OrchestrationCard