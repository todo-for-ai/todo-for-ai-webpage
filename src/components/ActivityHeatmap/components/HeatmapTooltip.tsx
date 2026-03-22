import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import { useLanguage } from '../../../contexts/LanguageContext'
import { formatDate } from '../utils/heatmapHelpers'
import type { ActivityHeatmapData } from '../../../api/dashboard'

interface HeatmapTooltipContentProps {
  day: ActivityHeatmapData
}

export function HeatmapTooltipContent({ day }: HeatmapTooltipContentProps) {
  const { tp } = usePageTranslation('dashboard')
  const { language } = useLanguage()
  const date = formatDate(day.date, language)

  if (day.count === 0) {
    return (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{date}</div>
        <div style={{ color: '#999' }}>{tp('heatmap.tooltip.noActivity')}</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{date}</div>
      <div style={{ fontSize: '12px' }}>
        <div style={{ marginBottom: '2px' }}>
          📝 {tp('heatmap.tooltip.taskCreated')}: <span style={{ fontWeight: 'bold' }}>{day.task_created_count}</span>
        </div>
        <div style={{ marginBottom: '2px' }}>
          ✏️ {tp('heatmap.tooltip.taskUpdated')}: <span style={{ fontWeight: 'bold' }}>{day.task_updated_count}</span>
        </div>
        <div style={{ marginBottom: '2px' }}>
          🔄 {tp('heatmap.tooltip.taskStatusChanged')}: <span style={{ fontWeight: 'bold' }}>{day.task_status_changed_count}</span>
        </div>
        <div style={{ marginBottom: '2px' }}>
          ✅ {tp('heatmap.tooltip.taskCompleted')}: <span style={{ fontWeight: 'bold' }}>{day.task_completed_count}</span>
        </div>
        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
          {tp('heatmap.tooltip.totalActivity')}: <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{day.count}</span>
        </div>
        {day.first_activity_at && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
            {tp('heatmap.tooltip.activeTime')}: {new Date(day.first_activity_at).toLocaleTimeString(language === 'zh-CN' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            {day.last_activity_at && day.first_activity_at !== day.last_activity_at && (
              <> - {new Date(day.last_activity_at).toLocaleTimeString(language === 'zh-CN' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
