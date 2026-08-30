import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Card, Descriptions, List, Spin, Tag, Tooltip, Typography } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { tasksApi, type TaskEvidenceItem, type TaskEvidenceResult } from '../../../api/tasks'

const EVIDENCE_TYPE_LABELS: Record<TaskEvidenceItem['evidence_type'], string> = {
  test: 'Test',
  build: 'Build',
  lint: 'Lint',
  command: 'Command',
  pr: 'Pull Request',
  manual: 'Manual',
}

const STATUS_META: Record<TaskEvidenceItem['status'], { color: string; icon: React.ReactNode }> = {
  passed: { color: 'success', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', icon: <CloseCircleOutlined /> },
  unknown: { color: 'default', icon: <QuestionCircleOutlined /> },
}

interface TaskEvidenceCardProps {
  taskId?: number
}

/**
 * 任务 DoD 与验证证据卡片（P1.2 验证门）
 *
 * 展示任务声明的完成标准（DoD）以及 Agent 提交的机器可验证证据
 * （测试/构建/lint 结果、关联 PR）。无 DoD 且无证据时不渲染。
 */
export const TaskEvidenceCard: React.FC<TaskEvidenceCardProps> = ({ taskId }) => {
  const [data, setData] = useState<TaskEvidenceResult | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const result = await tasksApi.getTaskEvidence(id)
      setData(result)
    } catch {
      // 404（无记录）等情况静默：卡片仅在存在内容时展示
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (taskId) {
      load(taskId)
    }
  }, [taskId, load])

  if (!taskId || loading) {
    if (!loading) return null
    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <Spin />
      </Card>
    )
  }

  if (!data || (data.dod.length === 0 && data.evidence.length === 0)) {
    return null
  }

  const hasFailed = data.evidence.some((item) => item.status === 'failed')
  const allPassed =
    data.evidence.length > 0 && data.evidence.every((item) => item.status === 'passed')

  return (
    <Card
      title={
        <span>
          <ExperimentOutlined /> Definition of Done &amp; Evidence
        </span>
      }
      style={{ marginTop: 16 }}
      size="small"
    >
      {hasFailed && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message="Some verification evidence failed — this task should not be considered done."
        />
      )}
      {allPassed && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          message="All verification evidence passed."
        />
      )}

      {data.dod.length > 0 && (
        <>
          <Typography.Text strong>Acceptance criteria (DoD)</Typography.Text>
          <List
            size="small"
            dataSource={data.dod}
            renderItem={(criterion, index) => (
              <List.Item>
                <Tag>{criterion.type}</Tag>
                <Typography.Text code style={{ flex: 1 }}>
                  {criterion.value || '-'}
                </Typography.Text>
                {criterion.type === 'pr' || criterion.type === 'manual' ? (
                  <Tooltip title="Verified by platform / human review">
                    <Tag>human/platform</Tag>
                  </Tooltip>
                ) : (
                  <Tag>agent-executed</Tag>
                )}
                <Typography.Text type="secondary">#{index + 1}</Typography.Text>
              </List.Item>
            )}
          />
        </>
      )}

      {data.evidence.length > 0 && (
        <>
          <Typography.Text strong>Verification evidence</Typography.Text>
          <List
            size="small"
            dataSource={data.evidence}
            renderItem={(item) => {
              const meta = STATUS_META[item.status] ?? STATUS_META.unknown
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={meta.icon}
                    title={
                      <Descriptions size="small" column={3} style={{ maxWidth: 720 }}>
                        <Descriptions.Item label="Type">
                          {EVIDENCE_TYPE_LABELS[item.evidence_type] ?? item.evidence_type}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          <Tag color={meta.color}>{item.status}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Verified at">
                          {item.verified_at ? new Date(item.verified_at).toLocaleString() : '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    }
                    description={
                      <>
                        {item.summary && (
                          <Typography.Text type="secondary">{item.summary}</Typography.Text>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: 8 }}
                          >
                            <LinkOutlined /> link
                          </a>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )
            }}
          />
        </>
      )}
    </Card>
  )
}

export default TaskEvidenceCard
