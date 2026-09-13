import type { CollaborationGraph } from '../../api/agents'

// 协作关系图导出与筛选的纯逻辑（从 useDashboardData 沉淀，可单测）。
// DOM 下载/序列化助手也在此，便于 mock URL.createObjectURL 做单测。

// CSV 单元转义：含逗号/引号/换行的值加引号，内部引号翻倍
export const escapeCsvValue = (v: unknown): string => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export interface GraphFilterOptions {
  kinds: string[]
  minCount: number | null
}

// 按面板筛选（kind 集合 + 最小协作次数）过滤图：先滤边、再丢弃孤立节点
export function filterGraph(graph: CollaborationGraph, opts: GraphFilterOptions) {
  const kindSet = opts.kinds.length > 0 ? new Set(opts.kinds) : null
  const kindNodes = kindSet ? graph.nodes.filter((n) => n.kind && kindSet.has(n.kind)) : graph.nodes
  const kindIds = new Set(kindNodes.map((n) => n.id))
  const minC = opts.minCount && opts.minCount > 0 ? opts.minCount : 0
  const edges = graph.edges.filter((e) => {
    if (kindSet && !(kindIds.has(e.source) && kindIds.has(e.target))) return false
    if (minC && e.count < minC) return false
    return true
  })
  const usedIds = new Set<number>()
  edges.forEach((e) => { usedIds.add(e.source); usedIds.add(e.target) })
  const nodes = kindNodes.filter((n) => usedIds.has(n.id))
  return { nodes, edges }
}

// 生成协作图 CSV 文本（节点段 + 边段），BOM 头保证 Excel 识别 UTF-8
export function buildCollabGraphCsv(graph: CollaborationGraph, opts: GraphFilterOptions): string {
  const { nodes, edges } = filterGraph(graph, opts)
  const lines: string[] = []
  lines.push('# 节点')
  lines.push(['id', 'name', 'kind', 'messages'].map(escapeCsvValue).join(','))
  nodes.forEach((n) => lines.push([n.id, n.name, n.kind ?? '', n.messages].map(escapeCsvValue).join(',')))
  lines.push('')
  lines.push('# 边')
  lines.push(['source', 'target', 'count', 'source_to_target', 'target_to_source'].map(escapeCsvValue).join(','))
  edges.forEach((e) => lines.push([e.source, e.target, e.count, e.source_to_target ?? 0, e.target_to_source ?? 0].map(escapeCsvValue).join(',')))
  return '﻿' + lines.join('\n')
}

// 触发浏览器下载（创建临时 <a> 点击后清理）
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 克隆 SVG 并补 xmlns，序列化为字符串（导出 SVG 用）
export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

// 为 PNG 导出准备 SVG 源：克隆 + xmlns + 显式宽高（viewBox 优先，退回 clientWidth，再退回 380）
export function preparePngSvgSource(svg: SVGSVGElement): { text: string; width: number; height: number } {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(svg.viewBox.baseVal.width || svg.clientWidth || 380))
  clone.setAttribute('height', String(svg.viewBox.baseVal.height || svg.clientHeight || 380))
  return {
    text: new XMLSerializer().serializeToString(clone),
    width: Number(clone.getAttribute('width')) || 380,
    height: Number(clone.getAttribute('height')) || 380,
  }
}
