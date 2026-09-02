/**
 * 任务协同文档解析（人与 Agent 协同写作）
 *
 * 与后端 services/task_content.py 共用同一分节标记约定：
 * Agent 产出以 `## 🤖 Agent 产出（标签）` 标题分节追加在人类正文之后。
 * 历史遗留的 JSON 信封（{"content":..., "agent_output":...}）在此无损还原为正文 + 分节，
 * 避免人类在详情页/编辑器里看到原始 JSON 串、或编辑保存覆盖 Agent 产出。
 */

export const AGENT_SECTION_MARK = '## 🤖 Agent 产出'

export interface AgentSection {
  label: string
  content: string
  heading: string
}

export interface TaskDocument {
  body: string
  sections: AgentSection[]
}

function makeHeading(label: string): string {
  return `${AGENT_SECTION_MARK}（${label}）`
}

function labelFromMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object') return 'agent'
  const parts: string[] = []
  for (const key of ['agent_name', 'agent', 'processed_by']) {
    const value = (metadata as Record<string, unknown>)[key]
    if (value) parts.push(String(value))
  }
  return parts.length ? parts.join(' · ') : 'agent'
}

/** 把 task.content 原始字符串解析为正文 + Agent 分节（兼容纯 Markdown / 历史 JSON 信封） */
export function parseTaskDocument(raw?: string | null): TaskDocument {
  if (!raw || !String(raw).trim()) {
    return { body: '', sections: [] }
  }
  const text = String(raw)

  // 历史 JSON 信封：commit 曾把 Agent 产出以 JSON blob 写回
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
        ('agent_output' in parsed || 'content' in parsed)) {
      const record = parsed as Record<string, unknown>
      const body = typeof record.content === 'string' ? record.content : ''
      const sections: AgentSection[] = []
      if (record.agent_output) {
        sections.push({
          label: labelFromMetadata(record.agent_metadata) ||
            (typeof record.processed_by === 'string' ? record.processed_by : 'agent'),
          content: String(record.agent_output),
          heading: '',
        })
      }
      sections.forEach(s => { if (!s.heading) s.heading = makeHeading(s.label) })
      return { body, sections }
    }
  } catch {
    // 非 JSON，按纯 Markdown 处理
  }

  // 纯 Markdown：按分节标题切分
  const headingRegex = /^## 🤖 Agent 产出[（(](.*?)[)）][ \t]*$/gm
  const matches: { label: string; start: number; end: number }[] = []
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(text)) !== null) {
    matches.push({ label: match[1].trim(), start: match.index, end: match.index + match[0].length })
  }
  if (!matches.length) {
    return { body: text, sections: [] }
  }

  const stripBoundary = (value: string) => {
    let stripped = value.trim()
    while (stripped.endsWith('---')) stripped = stripped.slice(0, -3).trim()
    return stripped
  }

  const body = stripBoundary(text.slice(0, matches[0].start))
  const sections: AgentSection[] = matches.map((m, i) => ({
    label: m.label,
    content: stripBoundary(text.slice(m.end, i + 1 < matches.length ? matches[i + 1].start : text.length)),
    heading: makeHeading(m.label),
  }))
  return { body, sections }
}

/** 编辑器加载用：任何形态都归一化为完整 Markdown（正文 + Agent 分节），人类可继续书写 */
export function taskContentForEditing(raw?: string | null): string {
  const doc = parseTaskDocument(raw)
  if (!doc.body.trim() && !doc.sections.length) return ''
  const parts: string[] = []
  if (doc.body.trim()) parts.push(doc.body.replace(/\s+$/, ''))
  for (const section of doc.sections) {
    parts.push(`---\n\n${section.heading}\n\n${section.content.trim()}`)
  }
  return parts.join('\n\n')
}
