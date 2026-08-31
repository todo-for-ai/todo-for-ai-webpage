/**
 * 任务参与者解析工具函数
 */

export interface Participant {
  type: 'human' | 'agent'
  id: number
}

export const parseParticipants = (raw: unknown): Participant[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'object' && item?.type && item?.id) {
        return { type: item.type, id: Number(item.id) }
      }
      if (typeof item !== 'string' || !item.includes(':')) return null
      const [type, idStr] = item.split(':')
      const normalizedType = type === 'agent' ? 'agent' : type === 'human' ? 'human' : null
      const id = Number(idStr)
      if (!normalizedType || Number.isNaN(id)) return null
      return { type: normalizedType as 'human' | 'agent', id }
    })
    .filter((item): item is Participant => Boolean(item))
}

export const formatParticipantsForForm = (raw: unknown): string[] => {
  const parsed = parseParticipants(raw)
  return parsed.map((item) => `${item.type}:${item.id}`)
}
