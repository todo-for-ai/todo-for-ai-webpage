/**
 * 交互终端（Claude Code 风格）纯逻辑层：
 * 把「任务对话（TaskLog）」与「Agent 运行事件（AgentTaskEvent）」两路数据
 * 归一化为统一时间线，供 AgentTerminal 渲染；附带斜杠命令解析与转录导出。
 */
import type { RuntimeEventItem } from '../../../api/runtimeEvents.js'
import type { ChatMessage } from '../../../api/taskChat.js'

export type TerminalLineKind = 'user' | 'agent' | 'system' | 'progress' | 'status' | 'error'

/** 行来源：chat=任务对话消息，event=运行事件流，local=本地未落库回声/提示 */
export type TerminalLineSource = 'chat' | 'event' | 'local'

export interface TerminalLine {
  /** 稳定去重键：c{chatId} / c{chatId}r{replyId} / e{eventId} / local-{n} */
  key: string
  kind: TerminalLineKind
  text: string
  /** epoch ms，用于跨源排序 */
  ts: number
  source?: TerminalLineSource
}

const toTs = (value?: string | null): number => {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** actor_type 归一化：真实接口返回小写（human/agent/system），统一到大写比较 */
export const normActor = (actor?: string | null): string => (actor || '').toUpperCase()

/** 任务对话消息 → 时间线（顶层消息 + 内联回复，均按 created_at 升序输入） */
export function chatLinesFromMessages(messages: ChatMessage[]): TerminalLine[] {
  const lines: TerminalLine[] = []
  for (const msg of messages || []) {
    const kind: TerminalLineKind =
      normActor(msg.actor_type) === 'HUMAN' ? 'user' : normActor(msg.actor_type) === 'AGENT' ? 'agent' : 'system'
    lines.push({ key: `c${msg.id}`, kind, text: msg.content, ts: toTs(msg.created_at), source: 'chat' })
    for (const reply of msg.replies || []) {
      const replyKind: TerminalLineKind =
        normActor(reply.actor_type) === 'HUMAN' ? 'user' : normActor(reply.actor_type) === 'AGENT' ? 'agent' : 'system'
      lines.push({
        key: `c${msg.id}r${reply.id}`,
        kind: replyKind,
        text: `↳ ${reply.content}`,
        ts: toTs(reply.created_at),
        source: 'chat',
      })
    }
  }
  return lines
}

const STATUS_LABEL: Record<string, string> = {
  started: '开始执行',
  completed: '执行完成',
  cancelled: '已中断',
}

/** 运行事件 → 单条时间线 */
export function eventLineFromEvent(ev: RuntimeEventItem): TerminalLine | null {
  if (!ev || !ev.id) return null
  const type = ev.event_type || 'log'
  if (type in STATUS_LABEL) {
    return { key: `e${ev.id}`, kind: 'status', text: STATUS_LABEL[type], ts: toTs(ev.event_timestamp), source: 'event' }
  }
  if (type === 'error') {
    return { key: `e${ev.id}`, kind: 'error', text: ev.message || '执行出错', ts: toTs(ev.event_timestamp), source: 'event' }
  }
  if (type === 'progress') {
    return { key: `e${ev.id}`, kind: 'progress', text: ev.message, ts: toTs(ev.event_timestamp), source: 'event' }
  }
  // output / log / 未知类型都按 Agent 输出呈现
  return { key: `e${ev.id}`, kind: 'agent', text: ev.message, ts: toTs(ev.event_timestamp), source: 'event' }
}

/**
 * 合并多路时间线：按 key 去重（后写入覆盖，本地回声可被服务端同文消息顶替），
 * 按时间升序排列；无时间戳的行（ts=0，如 /help 提示）沉底，紧跟用户当前操作位置。
 */
export function mergeTerminalLines(...groups: TerminalLine[][]): TerminalLine[] {
  const byKey = new Map<string, TerminalLine>()
  for (const group of groups) {
    for (const line of group || []) {
      if (!line?.key) continue
      byKey.set(line.key, line)
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => ((a.ts || Infinity) - (b.ts || Infinity)) || a.key.localeCompare(b.key)
  )
}

export type TerminalCommand =
  | { type: 'stop' }
  | { type: 'clear' }
  | { type: 'help' }
  | { type: 'unknown'; name: string }

/** 解析斜杠命令；非命令返回 null（原文作为普通消息发送） */
export function parseTerminalCommand(raw: string): TerminalCommand | null {
  const text = (raw || '').trim()
  if (!text.startsWith('/')) return null
  const name = text.slice(1).split(/\s+/)[0].toLowerCase()
  if (name === 'stop') return { type: 'stop' }
  if (name === 'clear') return { type: 'clear' }
  if (name === 'help') return { type: 'help' }
  return { type: 'unknown', name }
}

/** 导出纯文本转录（复制用）：`HH:mm` + 视觉前缀 + 正文 */
export function buildTranscriptText(lines: TerminalLine[]): string {
  const PREFIX: Record<TerminalLineKind, string> = {
    user: '❯',
    agent: '⏺',
    system: '○',
    progress: '·',
    status: '▶',
    error: '✗',
  }
  return (lines || [])
    .map(line => {
      const time = line.ts ? new Date(line.ts).toTimeString().slice(0, 5) : ''
      return `${time ? `${time} ` : ''}${PREFIX[line.kind]} ${line.text}`
    })
    .join('\n')
}

export const TERMINAL_COMMAND_HELP = [
  '/stop  中断当前执行',
  '/clear 清空当前视图（不影响服务端记录）',
  '/help  显示命令列表',
]
