import { describe, expect, it } from 'vitest'
import {
  KIND_LABELS,
  formatDate,
  formatDuration,
  getStatusColor,
  stageColor,
  stageZh,
} from '../../../src/pages/dashboard/dashboardFormatters'

describe('formatDuration 时长格式化', () => {
  it('秒/分/时三段边界', () => {
    expect(formatDuration(30)).toBe('30秒')
    expect(formatDuration(59.6)).toBe('60秒')
    expect(formatDuration(60)).toBe('1分钟')
    expect(formatDuration(3599)).toBe('60分钟')
    expect(formatDuration(3600)).toBe('1.0小时')
    expect(formatDuration(5400)).toBe('1.5小时')
  })
})

describe('getStatusColor 任务状态语义色', () => {
  it('五种已知状态映射，未知状态回退 default', () => {
    expect(getStatusColor('todo')).toBe('default')
    expect(getStatusColor('in_progress')).toBe('processing')
    expect(getStatusColor('review')).toBe('warning')
    expect(getStatusColor('done')).toBe('success')
    expect(getStatusColor('cancelled')).toBe('error')
    expect(getStatusColor('mystery')).toBe('default')
  })
})

describe('Agent 阶段中文与配色', () => {
  it('已知阶段取表值，未知回退', () => {
    expect(stageColor('active')).toBe('#52c41a')
    expect(stageColor('never')).toBe('#8c8c8c')
    expect(stageColor('whatever')).toBe('#8c8c8c')
    expect(stageZh('idle')).toBe('空闲')
    expect(stageZh('unknown-stage')).toBe('unknown-stage')
  })

  it('kind 标签表内容', () => {
    expect(KIND_LABELS.assistant).toBe('助手')
    expect(KIND_LABELS.external).toBe('外部')
    expect(Object.keys(KIND_LABELS)).toHaveLength(4)
  })
})

describe('formatDate 日期格式化', () => {
  it('按 zh-CN 短格式输出月/日', () => {
    const input = '2026-09-14T02:00:00Z'
    const expected = new Date(input).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    expect(formatDate(input)).toBe(expected)
  })
})
