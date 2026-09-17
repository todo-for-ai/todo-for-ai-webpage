import { describe, expect, it } from 'vitest'
import {
  buildTranscriptText,
  chatLinesFromMessages,
  eventLineFromEvent,
  mergeTerminalLines,
  parseTerminalCommand,
} from '../../../src/pages/components/TaskDetail/agentTerminalCore'
import type { ChatMessage } from '../../../src/api/taskChat.js'
import type { RuntimeEventItem } from '../../../src/api/runtimeEvents.js'

const chat = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 1,
  task_id: 1,
  actor_type: 'HUMAN',
  content: 'hello',
  content_type: 'text',
  created_at: '2026-09-17T10:00:00',
  ...over,
})

const event = (over: Partial<RuntimeEventItem>): RuntimeEventItem => ({
  id: 1,
  attempt_id: 'att-1',
  event_type: 'output',
  seq: 1,
  message: 'line',
  event_timestamp: '2026-09-17T10:00:01',
  ...over,
})

describe('chatLinesFromMessages', () => {
  it('maps actor types to line kinds and flattens replies with ↳', () => {
    const lines = chatLinesFromMessages([
      chat({ id: 1, actor_type: 'HUMAN', content: '请继续', replies: [
        chat({ id: 2, actor_type: 'AGENT', content: '收到', created_at: '2026-09-17T10:00:05' }),
      ] }),
      chat({ id: 3, actor_type: 'AGENT', content: '已完成', created_at: '2026-09-17T10:01:00' }),
      chat({ id: 4, actor_type: 'SYSTEM', content: '提示', created_at: '2026-09-17T10:02:00' }),
    ])
    expect(lines.map(l => [l.key, l.kind, l.text])).toEqual([
      ['c1', 'user', '请继续'],
      ['c1r2', 'agent', '↳ 收到'],
      ['c3', 'agent', '已完成'],
      ['c4', 'system', '提示'],
    ])
  })
})

describe('eventLineFromEvent', () => {
  it('maps terminal statuses, errors, progress and default output', () => {
    expect(eventLineFromEvent(event({ id: 1, event_type: 'started' })))
      .toMatchObject({ kind: 'status', text: '开始执行' })
    expect(eventLineFromEvent(event({ id: 2, event_type: 'completed' })))
      .toMatchObject({ kind: 'status', text: '执行完成' })
    expect(eventLineFromEvent(event({ id: 3, event_type: 'cancelled' })))
      .toMatchObject({ kind: 'status', text: '已中断' })
    expect(eventLineFromEvent(event({ id: 4, event_type: 'error', message: 'boom' })))
      .toMatchObject({ kind: 'error', text: 'boom' })
    expect(eventLineFromEvent(event({ id: 5, event_type: 'progress', message: '50%' })))
      .toMatchObject({ kind: 'progress', text: '50%' })
    expect(eventLineFromEvent(event({ id: 6, event_type: 'output', message: 'text' })))
      .toMatchObject({ kind: 'agent', text: 'text' })
    expect(eventLineFromEvent(event({ id: 7, event_type: 'mystery' })))
      .toMatchObject({ kind: 'agent' })
    expect(eventLineFromEvent(null)).toBeNull()
  })
})

describe('mergeTerminalLines', () => {
  it('merges chat + events chronologically and dedupes by key', () => {
    const chatLines = chatLinesFromMessages([
      chat({ id: 1, content: 'earlier', created_at: '2026-09-17T10:00:00' }),
    ])
    const eventLines = [
      eventLineFromEvent(event({ id: 9, message: 'mid', event_timestamp: '2026-09-17T10:00:30' }))!,
      eventLineFromEvent(event({ id: 10, message: 'late', event_timestamp: '2026-09-17T10:01:00' }))!,
    ]
    const merged = mergeTerminalLines(
      [{ key: 'c1', kind: 'user', text: 'pending-echo', ts: 0 }],
      chatLines,
      eventLines,
    )
    expect(merged.map(l => l.key)).toEqual(['c1', 'e9', 'e10'])
    // 同 key 后写覆盖：服务端记录顶替本地回声
    expect(merged[0].text).toBe('earlier')
  })

  it('sinks ts=0 lines after timestamped ones with stable key order', () => {
    const merged = mergeTerminalLines([
      { key: 'local-2', kind: 'system', text: 'b', ts: 0 },
      { key: 'local-1', kind: 'user', text: 'a', ts: 0 },
      { key: 'e1', kind: 'agent', text: 'x', ts: 100 },
    ])
    expect(merged.map(l => l.key)).toEqual(['e1', 'local-1', 'local-2'])
  })
})

describe('parseTerminalCommand', () => {
  it('recognizes known commands case-insensitively', () => {
    expect(parseTerminalCommand('/stop')).toEqual({ type: 'stop' })
    expect(parseTerminalCommand('  /Clear ')).toEqual({ type: 'clear' })
    expect(parseTerminalCommand('/HELP')).toEqual({ type: 'help' })
  })

  it('flags unknown commands and passes plain text through', () => {
    expect(parseTerminalCommand('/foo bar')).toEqual({ type: 'unknown', name: 'foo' })
    expect(parseTerminalCommand('普通消息')).toBeNull()
    expect(parseTerminalCommand('/')).toMatchObject({ type: 'unknown' })
  })
})

describe('buildTranscriptText', () => {
  it('renders prefixed lines with HH:mm timestamps', () => {
    const text = buildTranscriptText([
      { key: 'c1', kind: 'user', text: '你好', ts: Date.parse('2026-09-17T10:03:00') },
      { key: 'e1', kind: 'error', text: 'boom', ts: 0 },
    ])
    expect(text.split('\n')).toEqual(['10:03 ❯ 你好', '✗ boom'])
  })
})
