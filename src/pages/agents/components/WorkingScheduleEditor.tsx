/**
 * WorkingScheduleEditor — Agent 工作时间区间结构化编辑器。
 *
 * 作为受控组件放在 antd Form.Item 内（value/onChange 约定），
 * 值结构与服务端 AgentWorkingSchedule 一致（api-server
 * services/agent_working_schedule.py）：
 *   { enabled, timezone, includes: [window], excludes: [window] }
 *
 * 语义：允许时段 = includes 的并集（为空 = 全天候），再扣除 excludes；
 * 编辑模式且传入 agentId 时调用 preview 端点实时显示当前是否在区间内。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, Col, DatePicker, Input, Row, Select, Space, Switch, TimePicker, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { AgentWorkingSchedule, AgentWorkingScheduleWindow } from '../../../api/agents'
import { agentsApi } from '../../../api/agents'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import './WorkingScheduleEditor.css'

const { Text } = Typography

const TIMEZONE_OPTIONS = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
].map((tz) => ({ label: tz, value: tz }))

const WEEKDAY_LABELS = (() => {
  // 2026-01-05 是周一；用 Intl 生成与界面语言一致的星期名
  const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(2026, 0, 5 + i)),
  )
})()

const MONTH_LABELS = (() => {
  const fmt = new Intl.DateTimeFormat(undefined, { month: 'short' })
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2026, i, 1)))
})()

const DAY_OF_MONTH_OPTIONS = [
  ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
  { label: '-2', value: -2 },
  { label: '-1', value: -1 },
]

export interface WorkingScheduleValidationMessages {
  weeklyDaysRequired: string
  monthlyDaysRequired: string
  timeRequired: string
  timeRangeInvalid: string
  datesRangeRequired: string
}

/** 保存前的客户端校验；返回第一个错误文案，合法返回 null。 */
export function validateWorkingScheduleValue(
  schedule: AgentWorkingSchedule | undefined | null,
  messages: WorkingScheduleValidationMessages,
): string | null {
  if (!schedule?.enabled) return null
  for (const key of ['includes', 'excludes'] as const) {
    for (const window of schedule[key] || []) {
      if (window.enabled === false) continue
      if (window.type === 'weekly' && !(window.days_of_week || []).length) {
        return messages.weeklyDaysRequired
      }
      if (window.type === 'monthly' && !(window.days_of_month || []).length) {
        return messages.monthlyDaysRequired
      }
      if (window.type === 'dates') {
        if (!window.start_date || !window.end_date) return messages.datesRangeRequired
      } else if (!window.start_time || !window.end_time) {
        return messages.timeRequired
      }
    }
  }
  return null
}

function toDayjsTime(value?: string): Dayjs | undefined {
  return value ? dayjs(value, 'HH:mm') : undefined
}

function fromDayjsTime(value?: Dayjs | null): string | undefined {
  return value ? value.format('HH:mm') : undefined
}

function newWindow(type: AgentWorkingScheduleWindow['type']): AgentWorkingScheduleWindow {
  const base: AgentWorkingScheduleWindow = { type, enabled: true }
  if (type !== 'dates') {
    base.start_time = '09:00'
    base.end_time = '18:00'
  }
  return base
}

interface WindowEditorProps {
  window: AgentWorkingScheduleWindow
  onChange: (next: AgentWorkingScheduleWindow) => void
  onRemove: () => void
  tp: (key: string, params?: Record<string, unknown>) => string
}

function WindowEditor({ window, onChange, onRemove, tp }: WindowEditorProps) {
  const isDates = window.type === 'dates'
  const dateRange = window.start_date && window.end_date
    ? ([dayjs(window.start_date), dayjs(window.end_date)] as [Dayjs, Dayjs])
    : undefined

  return (
    <Card size='small' className='working-schedule__window' bordered>
      <Row gutter={[8, 8]} align='middle'>
        <Col flex='auto'>
          <Input
            value={window.label}
            placeholder={tp('form.workingSchedule.labelPlaceholder')}
            maxLength={100}
            onChange={(e) => onChange({ ...window, label: e.target.value || undefined })}
          />
        </Col>
        <Col>
          <Space size={4}>
            <Text type={window.enabled === false ? 'secondary' : undefined}>
              {tp('form.workingSchedule.windowEnabled')}
            </Text>
            <Switch
              size='small'
              checked={window.enabled !== false}
              onChange={(checked) => onChange({ ...window, enabled: checked || undefined })}
            />
            <Button size='small' type='text' danger icon={<DeleteOutlined />} onClick={onRemove} />
          </Space>
        </Col>
      </Row>

      <Row gutter={[8, 8]} className='working-schedule__window-row'>
        <Col span={8}>
          <Select
            style={{ width: '100%' }}
            value={window.type}
            onChange={(type) => onChange({ ...newWindow(type), label: window.label })}
            options={[
              { label: tp('form.workingSchedule.typeDaily'), value: 'daily' },
              { label: tp('form.workingSchedule.typeWeekly'), value: 'weekly' },
              { label: tp('form.workingSchedule.typeMonthly'), value: 'monthly' },
              { label: tp('form.workingSchedule.typeDates'), value: 'dates' },
            ]}
          />
        </Col>
        {!isDates && (
          <>
            <Col span={6}>
              <TimePicker
                style={{ width: '100%' }}
                format='HH:mm'
                minuteStep={1}
                value={toDayjsTime(window.start_time)}
                placeholder={tp('form.workingSchedule.startTime')}
                onChange={(t) => onChange({ ...window, start_time: fromDayjsTime(t) })}
              />
            </Col>
            <Col span={6}>
              <TimePicker
                style={{ width: '100%' }}
                format='HH:mm'
                minuteStep={1}
                value={toDayjsTime(window.end_time)}
                placeholder={tp('form.workingSchedule.endTime')}
                onChange={(t) => onChange({ ...window, end_time: fromDayjsTime(t) })}
              />
            </Col>
            <Col>
              <Space size={4}>
                <Button
                  size='small'
                  onClick={() => onChange({ ...window, start_time: '00:00', end_time: '23:59' })}
                >
                  {tp('form.workingSchedule.presetFullDay')}
                </Button>
                <Button
                  size='small'
                  onClick={() => onChange({ ...window, start_time: '22:00', end_time: '06:00' })}
                >
                  {tp('form.workingSchedule.presetNight')}
                </Button>
              </Space>
            </Col>
          </>
        )}
        {isDates && (
          <Col span={14}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(range) => onChange({
                ...window,
                start_date: range?.[0]?.format('YYYY-MM-DD'),
                end_date: range?.[1]?.format('YYYY-MM-DD'),
              })}
            />
          </Col>
        )}
      </Row>

      {isDates && (
        <Row gutter={[8, 8]} className='working-schedule__window-row'>
          <Col>
            <Text type='secondary'>{tp('form.workingSchedule.optionalTime')}</Text>
          </Col>
          <Col span={6}>
            <TimePicker
              style={{ width: '100%' }}
              format='HH:mm'
              value={toDayjsTime(window.start_time)}
              placeholder={tp('form.workingSchedule.allDay')}
              onChange={(t) => onChange({ ...window, start_time: fromDayjsTime(t) })}
            />
          </Col>
          <Col span={6}>
            <TimePicker
              style={{ width: '100%' }}
              format='HH:mm'
              value={toDayjsTime(window.end_time)}
              placeholder={tp('form.workingSchedule.allDay')}
              onChange={(t) => onChange({ ...window, end_time: fromDayjsTime(t) })}
            />
          </Col>
        </Row>
      )}

      {window.type === 'weekly' && (
        <Row gutter={[8, 8]} className='working-schedule__window-row' align='middle'>
          <Col flex='none'>
            <Text type='secondary'>{tp('form.workingSchedule.daysOfWeek')}</Text>
          </Col>
          <Col flex='auto'>
            <Select
              mode='multiple'
              style={{ width: '100%' }}
              placeholder={tp('form.workingSchedule.daysOfWeek')}
              value={window.days_of_week}
              options={WEEKDAY_LABELS.map((label, i) => ({ label, value: i + 1 }))}
              onChange={(days) => onChange({ ...window, days_of_week: days })}
            />
          </Col>
        </Row>
      )}

      {window.type === 'monthly' && (
        <Row gutter={[8, 8]} className='working-schedule__window-row' align='middle'>
          <Col flex='none'>
            <Text type='secondary'>{tp('form.workingSchedule.daysOfMonth')}</Text>
          </Col>
          <Col flex='auto'>
            <Select
              mode='multiple'
              style={{ width: '100%' }}
              placeholder={tp('form.workingSchedule.daysOfMonthHint')}
              value={window.days_of_month}
              options={DAY_OF_MONTH_OPTIONS}
              onChange={(days) => onChange({ ...window, days_of_month: days })}
            />
          </Col>
        </Row>
      )}

      {!isDates && (
        <Row gutter={[8, 8]} className='working-schedule__window-row' align='middle'>
          <Col flex='none'>
            <Text type='secondary'>{tp('form.workingSchedule.months')}</Text>
          </Col>
          <Col flex='auto'>
            <Select
              mode='multiple'
              style={{ width: '100%' }}
              placeholder={tp('form.workingSchedule.monthsAny')}
              value={window.months}
              options={MONTH_LABELS.map((label, i) => ({ label, value: i + 1 }))}
              onChange={(months) => onChange({ ...window, months: months.length ? months : undefined })}
            />
          </Col>
        </Row>
      )}

      {!isDates && (
        <Row gutter={[8, 8]} className='working-schedule__window-row'>
          <Col span={14}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={
                window.start_date || window.end_date
                  ? [
                      window.start_date ? dayjs(window.start_date) : undefined,
                      window.end_date ? dayjs(window.end_date) : undefined,
                    ]
                  : undefined
              }
              placeholder={[tp('form.workingSchedule.validFrom'), tp('form.workingSchedule.validUntil')]}
              onChange={(range) => onChange({
                ...window,
                start_date: range?.[0]?.format('YYYY-MM-DD'),
                end_date: range?.[1]?.format('YYYY-MM-DD'),
              })}
            />
          </Col>
        </Row>
      )}

      <div className='working-schedule__window-hint'>
        <Text type='secondary'>{tp('form.workingSchedule.crossMidnightHint')}</Text>
      </div>
    </Card>
  )
}

export interface WorkingScheduleEditorProps {
  value?: AgentWorkingSchedule | null
  onChange?: (next: AgentWorkingSchedule) => void
  /** 编辑模式下传入 agent id 以启用实时预览 */
  agentId?: number
  disabled?: boolean
}

export function WorkingScheduleEditor({ value, onChange, agentId, disabled }: WorkingScheduleEditorProps) {
  const { tp } = usePageTranslation('agents')
  const schedule: AgentWorkingSchedule = value || {}
  const [preview, setPreview] = useState<{ in_window: boolean; next_window_at?: string | null } | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const emit = (next: AgentWorkingSchedule) => {
    onChange?.(next)
  }

  const scheduleKey = useMemo(() => JSON.stringify(value || {}), [value])

  useEffect(() => {
    if (!agentId || disabled) return
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(async () => {
      try {
        const result = await agentsApi.previewWorkingSchedule(agentId, value || {})
        setPreview({ in_window: result.evaluation.in_window, next_window_at: result.evaluation.next_window_at })
        setPreviewError(false)
      } catch {
        setPreviewError(true)
      }
    }, 500)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, scheduleKey, disabled])

  const renderWindowList = (key: 'includes' | 'excludes') => {
    const windows = schedule[key] || []
    return (
      <div className='working-schedule__section'>
        <div className='working-schedule__section-title'>
          <Text strong>
            {key === 'includes'
              ? tp('form.workingSchedule.includes')
              : tp('form.workingSchedule.excludes')}
          </Text>
          <Text type='secondary' className='working-schedule__section-hint'>
            {key === 'includes'
              ? tp('form.workingSchedule.includesHint')
              : tp('form.workingSchedule.excludesHint')}
          </Text>
        </div>
        {windows.map((window, index) => (
          <WindowEditor
            key={index}
            window={window}
            tp={tp}
            onChange={(next) => {
              const list = [...windows]
              list[index] = next
              emit({ ...schedule, [key]: list })
            }}
            onRemove={() => {
              emit({ ...schedule, [key]: windows.filter((_, i) => i !== index) })
            }}
          />
        ))}
        <Button
          disabled={disabled || windows.length >= 50}
          icon={<PlusOutlined />}
          onClick={() => emit({ ...schedule, [key]: [...windows, newWindow('daily')] })}
        >
          {tp('form.workingSchedule.addWindow')}
        </Button>
      </div>
    )
  }

  return (
    <div className='working-schedule'>
      <Row gutter={[8, 8]} align='middle' className='working-schedule__header'>
        <Col>
          <Switch
            checked={schedule.enabled === true}
            disabled={disabled}
            onChange={(checked) => emit({ ...schedule, enabled: checked })}
          />
        </Col>
        <Col>
          <Text strong>{tp('form.workingSchedule.enabled')}</Text>
        </Col>
        <Col span={10}>
          <Select
            style={{ width: '100%' }}
            showSearch
            optionFilterProp='label'
            disabled={disabled || schedule.enabled !== true}
            value={schedule.timezone || 'UTC'}
            options={TIMEZONE_OPTIONS}
            onChange={(timezone) => emit({ ...schedule, timezone })}
          />
        </Col>
      </Row>
      <div className='working-schedule__hint'>
        <Text type='secondary'>{tp('form.workingSchedule.enabledHint')}</Text>
      </div>

      {schedule.enabled === true && (
        <>
          {renderWindowList('includes')}
          {renderWindowList('excludes')}

          {agentId && !disabled && (
            <div className='working-schedule__preview'>
              {previewError ? (
                <Alert type='warning' showIcon message={tp('form.workingSchedule.previewFailed')} />
              ) : preview ? (
                <Alert
                  type={preview.in_window ? 'success' : 'warning'}
                  showIcon
                  message={
                    preview.in_window
                      ? tp('form.workingSchedule.previewInWindow')
                      : `${tp('form.workingSchedule.previewOutOfWindow')}${
                          preview.next_window_at
                            ? ` · ${tp('form.workingSchedule.nextWindowAt', { time: preview.next_window_at.replace('T', ' ') })}`
                            : ''
                        }`
                  }
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
