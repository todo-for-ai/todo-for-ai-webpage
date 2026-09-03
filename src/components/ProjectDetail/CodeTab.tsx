/**
 * 代码 Tab：呈现项目的 repo 绑定（G1 代码平面的项目级入口）。
 *
 * 数据来自 GET /projects/{id}/repo；未绑定时给出接入指引。
 * PR 的创建/审批/合并在任务维度操作，这里只放绑定事实与自治等级语义。
 */
import { useEffect, useState } from 'react'
import { Button, Card, Descriptions, Empty, Spin, Tag, Timeline } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import {
  projectContextApi,
  type ProjectRepoBinding,
} from '../../api/projectContext'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface CodeTabProps {
  projectId: number
  canManage: boolean
  onOpenTab?: (tabKey: string) => void
}

const AUTONOMY_LEVELS: Record<number, string> = {
  0: 'L0 · 全审批（每步人工确认）',
  1: 'L1 · 自动 PR，人工合并',
  2: 'L2 · 证据全通过自动合并',
}

export function CodeTab({ projectId, canManage, onOpenTab }: CodeTabProps) {
  const { tp } = usePageTranslation('projectDetail')
  const [loading, setLoading] = useState(true)
  const [binding, setBinding] = useState<ProjectRepoBinding | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    projectContextApi
      .getRepoBinding(projectId)
      .then((result) => {
        if (!cancelled) setBinding(result)
      })
      .catch(() => {
        if (!cancelled) setBinding(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!binding) {
    return (
      <Card title={tp('codeTab.bindingTitle')}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              {tp('codeTab.unboundHint1')}
              <br />
              {tp('codeTab.unboundHint2')}
            </span>
          }
        />
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card
        title={tp('codeTab.bindingTitle')}
        extra={
          <Tag color={binding.has_binding_token ? 'green' : 'orange'}>
            {binding.has_binding_token ? tp('codeTab.tokenConfigured') : tp('codeTab.tokenMissing')}
          </Tag>
        }
      >
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label={tp('codeTab.repo')} span={2}>
            <LinkOutlined /> {binding.repo_full_name}
          </Descriptions.Item>
          <Descriptions.Item label={tp('codeTab.defaultBranch')}>
            {binding.default_branch}
          </Descriptions.Item>
          <Descriptions.Item label={tp('codeTab.autonomy')}>
            <Tag color={binding.autonomy_level >= 2 ? 'green' : binding.autonomy_level === 1 ? 'blue' : 'orange'}>
              {AUTONOMY_LEVELS[binding.autonomy_level] ?? `L${binding.autonomy_level}`}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={tp('codeTab.agentReview')}>
            {binding.require_agent_review
              ? `${tp('codeTab.enabled')} · ${binding.reviewer_agent_id ? `Agent #${binding.reviewer_agent_id}` : tp('codeTab.reviewerFallback')}`
              : tp('codeTab.disabled')}
          </Descriptions.Item>
          <Descriptions.Item label={tp('codeTab.boundAt')}>
            {binding.created_at ? new Date(binding.created_at).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
        {!canManage && (
          <p style={{ marginTop: 12, color: '#999', fontSize: 12 }}>{tp('codeTab.manageHint')}</p>
        )}
      </Card>

      <Card title={tp('codeTab.flowTitle')}>
        <Timeline
          items={[
            {
              children: tp('codeTab.flowStep1'),
            },
            {
              children: tp('codeTab.flowStep2'),
            },
            {
              children: (
                <span>
                  {tp('codeTab.flowStep3')}
                  {onOpenTab && (
                    <Button type="link" size="small" onClick={() => onOpenTab('governance')}>
                      {tp('codeTab.flowStep3Link')}
                    </Button>
                  )}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
