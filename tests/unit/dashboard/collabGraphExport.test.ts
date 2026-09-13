import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  buildCollabGraphCsv,
  downloadBlob,
  escapeCsvValue,
  filterGraph,
  preparePngSvgSource,
  serializeSvg,
} from '../../../src/pages/dashboard/collabGraphExport'
import type { CollaborationGraph } from '../../../src/api/agents'

const graph: CollaborationGraph = {
  nodes: [
    { id: 1, name: 'alice', kind: 'assistant', messages: 10 },
    { id: 2, name: 'bob', kind: 'coordinator', messages: 8 },
    { id: 3, name: 'carol', kind: 'assistant', messages: 0 },
  ],
  edges: [
    { source: 1, target: 2, count: 5, source_to_target: 3, target_to_source: 2 },
    { source: 1, target: 3, count: 1 },
  ],
  total_edges: 2,
} as unknown as CollaborationGraph

describe('escapeCsvValue CSV 转义', () => {
  it('普通值原样，逗号/引号/换行加引号且引号翻倍，空值空串', () => {
    expect(escapeCsvValue('plain')).toBe('plain')
    expect(escapeCsvValue('a,b')).toBe('"a,b"')
    expect(escapeCsvValue('he said "hi"')).toBe('"he said ""hi"""')
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"')
    expect(escapeCsvValue(null)).toBe('')
    expect(escapeCsvValue(undefined)).toBe('')
    expect(escapeCsvValue(42)).toBe('42')
  })
})

describe('filterGraph 面板筛选', () => {
  it('无筛选返回全部边与被边引用的节点', () => {
    const r = filterGraph(graph, { kinds: [], minCount: null })
    expect(r.edges).toHaveLength(2)
    expect(r.nodes.map((n) => n.id).sort()).toEqual([1, 2, 3])
  })

  it('kind 筛选滤掉跨 kind 边与孤立节点', () => {
    // 只保留 assistant：1-2 边跨 kind 被滤，剩 1-3
    const r = filterGraph(graph, { kinds: ['assistant'], minCount: null })
    expect(r.edges).toHaveLength(1)
    expect(r.edges[0].source).toBe(1)
    expect(r.edges[0].target).toBe(3)
    expect(r.nodes.map((n) => n.id)).toEqual([1, 3])
  })

  it('minCount 滤掉低协作次数边', () => {
    const r = filterGraph(graph, { kinds: [], minCount: 3 })
    expect(r.edges).toHaveLength(1)
    expect(r.edges[0].count).toBe(5)
    expect(r.nodes.map((n) => n.id)).toEqual([1, 2])
  })

  it('minCount 传 0/负数视为不筛选', () => {
    expect(filterGraph(graph, { kinds: [], minCount: 0 }).edges).toHaveLength(2)
    expect(filterGraph(graph, { kinds: [], minCount: -1 }).edges).toHaveLength(2)
  })
})

describe('buildCollabGraphCsv CSV 文本', () => {
  it('带 BOM 与节点/边两段，缺省方向流量补 0', () => {
    const text = buildCollabGraphCsv(graph, { kinds: [], minCount: null })
    expect(text.charCodeAt(0)).toBe(0xfeff)
    expect(text).toContain('# 节点')
    expect(text).toContain('id,name,kind,messages')
    expect(text).toContain('1,alice,assistant,10')
    expect(text).toContain('# 边')
    expect(text).toContain('source,target,count,source_to_target,target_to_source')
    // 第二条边没有方向流量字段 → 补 0
    expect(text).toContain('1,3,1,0,0')
  })
})

describe('downloadBlob 浏览器下载', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url')
    revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL
    vi.spyOn(document.body, 'appendChild').mockImplementation(((node: Node) => node) as never)
    vi.spyOn(document.body, 'removeChild').mockImplementation(((node: Node) => node) as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('创建临时 <a> 触发点击后清理', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadBlob(new Blob(['x']), 'file.csv')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})

describe('SVG 序列化助手', () => {
  it('serializeSvg 克隆并补 xmlns', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.innerHTML = '<circle r="1" />'
    const out = serializeSvg(svg as unknown as SVGSVGElement)
    expect(out).toContain('<svg')
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(out).toContain('<circle')
  })

  it('preparePngSvgSource 取 viewBox 尺寸，缺失时回退 380', () => {
    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const fakeSvg = {
      cloneNode: () => clone,
      viewBox: { baseVal: { width: 100, height: 50 } },
      clientWidth: 0,
      clientHeight: 0,
    } as unknown as SVGSVGElement
    const r = preparePngSvgSource(fakeSvg)
    expect(r.width).toBe(100)
    expect(r.height).toBe(50)
    expect(r.text).toContain('width="100"')
    expect(r.text).toContain('height="50"')

    const clone2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const fakeSvg2 = {
      cloneNode: () => clone2,
      viewBox: { baseVal: { width: 0, height: 0 } },
      clientWidth: 0,
      clientHeight: 0,
    } as unknown as SVGSVGElement
    const r2 = preparePngSvgSource(fakeSvg2)
    expect(r2.width).toBe(380)
    expect(r2.height).toBe(380)
  })
})
