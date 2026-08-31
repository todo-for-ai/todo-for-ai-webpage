import { Input, InputNumber, Select, Space } from 'antd'
import { usePageTranslation } from '../../../../../../i18n/hooks/useTranslation'
import type { ActivityFilters as ActivityFiltersType } from '../types'
import './ActivityFilters.css'

const { Search } = Input

interface ActivityFiltersProps extends ActivityFiltersType {
  activitySourceOptions: { value: string; label: string }[]
  activityLevelOptions: { value: string; label: string }[]
  onSourceChange: (value: string | undefined) => void
  onLevelChange: (value: string | undefined) => void
  onEventTypeChange: (value: string) => void
  onEventTypeInputChange: (value: string) => void
  onTaskIdChange: (value: number | undefined) => void
  onProjectIdChange: (value: number | undefined) => void
  onRunIdChange: (value: string) => void
  onRunIdInputChange: (value: string) => void
  onAttemptIdChange: (value: string) => void
  onAttemptIdInputChange: (value: string) => void
  onRiskMinChange: (value: number | undefined) => void
  onRiskMaxChange: (value: number | undefined) => void
  onQueryChange: (value: string) => void
  onQueryInputChange: (value: string) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onResetPagination: () => void
}

export function ActivityFilters({
  source,
  level,
  eventTypeInput,
  taskId,
  projectId,
  runIdInput,
  attemptIdInput,
  riskMin,
  riskMax,
  queryInput,
  from,
  to,
  activitySourceOptions,
  activityLevelOptions,
  onSourceChange,
  onLevelChange,
  onEventTypeChange,
  onEventTypeInputChange,
  onTaskIdChange,
  onProjectIdChange,
  onRunIdChange,
  onRunIdInputChange,
  onAttemptIdChange,
  onAttemptIdInputChange,
  onRiskMinChange,
  onRiskMaxChange,
  onQueryChange,
  onQueryInputChange,
  onFromChange,
  onToChange,
  onResetPagination,
}: ActivityFiltersProps) {
  const { tp } = usePageTranslation('agents')

  const handleEventTypeSubmit = () => {
    onEventTypeChange(eventTypeInput.trim())
    onResetPagination()
  }

  const handleRunIdSubmit = () => {
    onRunIdChange(runIdInput.trim())
    onResetPagination()
  }

  const handleAttemptIdSubmit = () => {
    onAttemptIdChange(attemptIdInput.trim())
    onResetPagination()
  }

  return (
    <Space wrap className='activity-filters'>
      <Select
        allowClear
        placeholder={tp('detail.activity.sourceFilter', { defaultValue: 'Source' })}
        options={activitySourceOptions}
        value={source}
        className='activity-filters__source'
        onChange={(value) => {
          onSourceChange(value)
          onResetPagination()
        }}
      />
      <Select
        allowClear
        placeholder={tp('detail.activity.levelFilter', { defaultValue: 'Level' })}
        options={activityLevelOptions}
        value={level}
        className='activity-filters__level'
        onChange={(value) => {
          onLevelChange(value)
          onResetPagination()
        }}
      />
      <Input
        placeholder={tp('detail.activity.eventTypeFilter', { defaultValue: 'Event Type Contains' })}
        value={eventTypeInput}
        className='activity-filters__text'
        onChange={(event) => onEventTypeInputChange(event.target.value)}
        onPressEnter={handleEventTypeSubmit}
        onBlur={handleEventTypeSubmit}
      />
      <InputNumber
        min={1}
        value={taskId}
        placeholder={tp('detail.activity.taskIdFilter', { defaultValue: 'Task ID' })}
        onChange={(value) => {
          onTaskIdChange(typeof value === 'number' ? value : undefined)
          onResetPagination()
        }}
        className='activity-filters__number'
      />
      <InputNumber
        min={1}
        value={projectId}
        placeholder={tp('detail.activity.projectIdFilter', { defaultValue: 'Project ID' })}
        onChange={(value) => {
          onProjectIdChange(typeof value === 'number' ? value : undefined)
          onResetPagination()
        }}
        className='activity-filters__number'
      />
      <Input
        placeholder={tp('detail.activity.runIdFilter', { defaultValue: 'Run ID Contains' })}
        value={runIdInput}
        className='activity-filters__text'
        onChange={(event) => onRunIdInputChange(event.target.value)}
        onPressEnter={handleRunIdSubmit}
        onBlur={handleRunIdSubmit}
      />
      <Input
        placeholder={tp('detail.activity.attemptIdFilter', { defaultValue: 'Attempt ID Contains' })}
        value={attemptIdInput}
        className='activity-filters__text'
        onChange={(event) => onAttemptIdInputChange(event.target.value)}
        onPressEnter={handleAttemptIdSubmit}
        onBlur={handleAttemptIdSubmit}
      />
      <InputNumber
        min={0}
        value={riskMin}
        placeholder={tp('detail.activity.minRiskFilter', { defaultValue: 'Min Risk' })}
        onChange={(value) => {
          onRiskMinChange(typeof value === 'number' ? value : undefined)
          onResetPagination()
        }}
        className='activity-filters__number'
      />
      <InputNumber
        min={0}
        value={riskMax}
        placeholder={tp('detail.activity.maxRiskFilter', { defaultValue: 'Max Risk' })}
        onChange={(value) => {
          onRiskMaxChange(typeof value === 'number' ? value : undefined)
          onResetPagination()
        }}
        className='activity-filters__number'
      />
      <Search
        placeholder={tp('detail.activity.search', { defaultValue: 'Search message / payload' })}
        allowClear
        value={queryInput}
        className='activity-filters__search'
        onChange={(event) => onQueryInputChange(event.target.value)}
        onSearch={(value) => {
          onQueryChange(value)
          onResetPagination()
        }}
      />
      <Input
        type='datetime-local'
        value={from}
        placeholder={tp('detail.activity.from', { defaultValue: 'From' })}
        className='activity-filters__datetime'
        onChange={(event) => {
          onFromChange(event.target.value)
          onResetPagination()
        }}
      />
      <Input
        type='datetime-local'
        value={to}
        placeholder={tp('detail.activity.to', { defaultValue: 'To' })}
        className='activity-filters__datetime'
        onChange={(event) => {
          onToChange(event.target.value)
          onResetPagination()
        }}
      />
    </Space>
  )
}
