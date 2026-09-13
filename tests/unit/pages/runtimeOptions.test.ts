import { describe, expect, it, vi } from 'vitest'
import {
  createRuntimeOptions,
  executionModeOptions,
  sandboxProfileOptions,
  networkModeOptions,
} from '../../../src/pages/agents/components/detailTabs/runtimeOptions'

const tp = vi.fn((key: string, opts?: any) => opts?.defaultValue ?? key)

describe('runtimeOptions 运行时选项配置', () => {
  it('executionModeOptions 含两种执行模式与描述', () => {
    const opts = executionModeOptions(tp)
    expect(opts.map((o) => o.value)).toEqual(['external_pull', 'managed_runner'])
    expect(opts.every((o) => typeof o.label === 'string' && typeof o.description === 'string')).toBe(true)
  })

  it('sandboxProfileOptions 含三种沙箱档位', () => {
    const opts = sandboxProfileOptions(tp)
    expect(opts.map((o) => o.value)).toEqual(['strict', 'standard', 'permissive'])
    expect(opts.every((o) => typeof o.label === 'string')).toBe(true)
  })

  it('networkModeOptions 含三种网络模式', () => {
    const opts = networkModeOptions(tp)
    expect(opts.map((o) => o.value)).toEqual(['whitelist', 'isolated', 'full'])
  })

  it('createRuntimeOptions 聚合三组选项', () => {
    const r = createRuntimeOptions(tp)
    expect(r.executionModeOptions).toHaveLength(2)
    expect(r.sandboxProfileOptions).toHaveLength(3)
    expect(r.networkModeOptions).toHaveLength(3)
    // tp 以 defaultValue 兜底
    expect(tp).toHaveBeenCalledWith(expect.stringContaining('executionMode.options'), expect.objectContaining({ defaultValue: expect.any(String) }))
  })
})
