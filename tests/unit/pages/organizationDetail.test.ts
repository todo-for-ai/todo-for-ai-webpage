import { describe, expect, it } from 'vitest'
import {
  extractProjectItems,
  getProjectTaskCount,
  ORG_STATUS_COLORS,
  PROJECT_STATUS_COLORS,
} from '../../../src/pages/OrganizationDetailData'

describe('extractProjectItems 兼容多形载荷', () => {
  const p = { id: 1, name: 'a' }

  it('非对象/空值返回空数组', () => {
    expect(extractProjectItems(null)).toEqual([])
    expect(extractProjectItems(undefined)).toEqual([])
    expect(extractProjectItems('str')).toEqual([])
    expect(extractProjectItems(42)).toEqual([])
  })

  it('支持 items / data / data.items 三种形态', () => {
    expect(extractProjectItems({ items: [p] })).toEqual([p])
    expect(extractProjectItems({ data: [p] })).toEqual([p])
    expect(extractProjectItems({ data: { items: [p] } })).toEqual([p])
  })

  it('无已知形态返回空数组', () => {
    expect(extractProjectItems({})).toEqual([])
    expect(extractProjectItems({ items: 'not-array' })).toEqual([])
  })
})

describe('getProjectTaskCount 任务数取值口径', () => {
  it('total_tasks 优先，其次 stats.total_tasks，最后 0', () => {
    expect(getProjectTaskCount({ total_tasks: 5 } as never)).toBe(5)
    expect(getProjectTaskCount({ stats: { total_tasks: 7 } } as never)).toBe(7)
    expect(getProjectTaskCount({ total_tasks: 0, stats: { total_tasks: 7 } } as never)).toBe(0)
    expect(getProjectTaskCount({} as never)).toBe(0)
  })
})

describe('状态配色表', () => {
  it('活跃/归档等语义色齐全', () => {
    expect(ORG_STATUS_COLORS.active).toBe('green')
    expect(ORG_STATUS_COLORS.invited).toBe('blue')
    expect(ORG_STATUS_COLORS.removed).toBe('default')
    expect(PROJECT_STATUS_COLORS.active).toBeDefined()
    expect(PROJECT_STATUS_COLORS.archived).toBeDefined()
  })
})
