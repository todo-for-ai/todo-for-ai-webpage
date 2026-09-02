import { describe, it, expect } from 'vitest'
import { parseTaskDocument, taskContentForEditing, AGENT_SECTION_MARK } from '../../../src/utils/taskContent'

describe('parseTaskDocument', () => {
  it('handles empty content', () => {
    expect(parseTaskDocument(null)).toEqual({ body: '', sections: [] })
    expect(parseTaskDocument('   ')).toEqual({ body: '', sections: [] })
  })

  it('parses plain markdown without sections', () => {
    const doc = parseTaskDocument('# 标题\n\n正文内容')
    expect(doc.body).toBe('# 标题\n\n正文内容')
    expect(doc.sections).toEqual([])
  })

  it('splits human body and agent sections', () => {
    const raw = [
      '# 需求',
      '',
      '实现登录页',
      '',
      '---',
      '',
      `${AGENT_SECTION_MARK}（claude-code · 2026-09-02）`,
      '',
      '已完成登录页，测试全绿。',
    ].join('\n')
    const doc = parseTaskDocument(raw)
    expect(doc.body).toBe('# 需求\n\n实现登录页')
    expect(doc.sections).toHaveLength(1)
    expect(doc.sections[0].label).toBe('claude-code · 2026-09-02')
    expect(doc.sections[0].content).toBe('已完成登录页，测试全绿。')
  })

  it('restores legacy JSON envelope (agent_output + metadata)', () => {
    const raw = JSON.stringify({
      content: '# 人类需求',
      agent_output: '已完成登录页',
      agent_metadata: { agent_name: 'openclaw' },
      processed_by: 'agent',
    })
    const doc = parseTaskDocument(raw)
    expect(doc.body).toBe('# 人类需求')
    expect(doc.sections).toHaveLength(1)
    expect(doc.sections[0].label).toBe('openclaw')
    expect(doc.sections[0].content).toBe('已完成登录页')
  })

  it('treats non-envelope JSON as markdown', () => {
    const raw = JSON.stringify([1, 2, 3])
    const doc = parseTaskDocument(raw)
    expect(doc.sections).toEqual([])
    expect(doc.body).toBe(raw)
  })
})

describe('taskContentForEditing', () => {
  it('normalizes legacy envelope into editable markdown', () => {
    const raw = JSON.stringify({ content: '# 需求', agent_output: '旧产出', agent_metadata: {} })
    const editable = taskContentForEditing(raw)
    expect(editable).toContain('# 需求')
    expect(editable).toContain(AGENT_SECTION_MARK)
    expect(editable).toContain('旧产出')
    expect(editable.trimStart().startsWith('{')).toBe(false)
  })

  it('returns empty string for empty content', () => {
    expect(taskContentForEditing(null)).toBe('')
    expect(taskContentForEditing('')).toBe('')
  })

  it('keeps existing sections when re-editing a co-authored document', () => {
    const first = taskContentForEditing('# 需求') + '\n\n---\n\n' +
      `${AGENT_SECTION_MARK}（agent-a）\n\n产出 1`
    const editable = taskContentForEditing(first)
    expect(editable).toContain('产出 1')
    expect(editable).toContain('agent-a')
  })
})
