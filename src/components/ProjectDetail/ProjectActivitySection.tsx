/**
 * 项目动态区（概览 Tab）：Agent 运行概览 + 最近事件。
 *
 * 数据来自项目 overview 聚合端点；让「概览」从静态项目信息升级为
 * 项目运行状态的驾驶舱入口。
 */
import { Button, Card, Empty, Tag } from 'antd'
import { LinkButton } from '../SmartLink'
import type { ProjectOverview } from '../../api/projectContext'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { HintIcon, withHint } from '../common/HintIcon'

interface ProjectActivitySectionProps {
  overview?: ProjectOverview | null
  onOpenTab?: (tabKey: string) => void
}

export function ProjectActivitySection({ overview, onOpenTab }: ProjectActivitySectionProps) {
  const { tp } = usePageTranslation('projectDetail')

  if (!overview) {
    return null
  }

  const runs = overview.runs_summary
  const events = overview.recent_events ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      <Card
        title={withHint(tp('activity.runsTitle'), tp('activity.hintRuns'))}
        extra={
          onOpenTab && (
            <Button type="link" size="small" onClick={() => onOpenTab('agents')}>
              {tp('activity.viewAgents')}
            </Button>
          )
        }
      >
        <div className="pd-activity__stats">
          <div className="pd-activity__stat">
            <div className="pd-activity__stat-value pd-activity__stat-value--running">
              {runs.running_tasks}
            </div>
            <div className="pd-activity__stat-label">
              {tp('activity.runningTasks')}
              <HintIcon title={tp('activity.hintRunningTasks')} />
            </div>
          </div>
          <div className="pd-activity__stat">
            <div className="pd-activity__stat-value">{runs.succeeded_window}</div>
            <div className="pd-activity__stat-label">
              {tp('activity.succeededWindow').replace('{days}', String(runs.window_days))}
              <HintIcon title={tp('activity.hintWindow')} />
            </div>
          </div>
          <div className="pd-activity__stat">
            <div className="pd-activity__stat-value pd-activity__stat-value--failed">
              {runs.failed_window}
            </div>
            <div className="pd-activity__stat-label">
              {tp('activity.failedWindow').replace('{days}', String(runs.window_days))}
              <HintIcon title={tp('activity.hintWindow')} />
            </div>
          </div>
          <div className="pd-activity__stat">
            <div className="pd-activity__stat-value">{overview.agents.length}</div>
            <div className="pd-activity__stat-label">{tp('activity.visibleAgents')}</div>
          </div>
        </div>
      </Card>

      <Card
        title={withHint(tp('activity.eventsTitle'), tp('activity.hintEvents'))}
        extra={
          onOpenTab && (
            <Button type="link" size="small" onClick={() => onOpenTab('governance')}>
              {tp('activity.viewGovernance')}
            </Button>
          )
        }
      >
        {events.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('activity.eventsEmpty')} />
        ) : (
          <ul className="pd-activity__event-list">
            {events.slice(0, 6).map((event) => (
              <li key={event.id} className="pd-activity__event-item">
                <Tag color="default">{event.event_type}</Tag>
                {event.task_id && (
                  <LinkButton to={`/todo-for-ai/pages/tasks/${event.task_id}`} type="link">
                    #{event.task_id}
                  </LinkButton>
                )}
                <span className="pd-activity__event-time">
                  {event.occurred_at ? new Date(event.occurred_at).toLocaleString() : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
