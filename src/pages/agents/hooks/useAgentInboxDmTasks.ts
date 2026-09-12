/**
 * Agents.tsx 低耦合三小块：收件箱/通知、直接消息、推荐任务。
 * 从 Agents.tsx 原样抽出，逻辑零改动。派发（dispatch）高耦合函数
 * 留主文件，另行处理。
 */

import { useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'
import type { Agent, TaskEvent } from '../../../api/agents'

export function useAgentInboxDmTasks() {
  const [inboxItems, setInboxItems] = useState<TaskEvent[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [dmOpen, setDmOpen] = useState(false)
  const [dmFrom, setDmFrom] = useState<Agent | null>(null)
  const [dmTo, setDmTo] = useState<Agent | null>(null)
  const [dmContent, setDmContent] = useState('')
  const [dmSending, setDmSending] = useState(false)
  const [recTasksOpen, setRecTasksOpen] = useState(false)
  const [recTasksAgent, setRecTasksAgent] = useState<Agent | null>(null)
  const [recTasks, setRecTasks] = useState<any[]>([])
  const [recTasksLoading, setRecTasksLoading] = useState(false)

  const sendDirectMessage = async () => {
    if (!dmFrom || !dmTo || !dmContent.trim()) {
      message.warning('请选择发送方和接收方，并输入消息内容')
      return
    }
    setDmSending(true)
    try {
      await agentsApi.sendAgentMessage(dmFrom.id, dmTo.id, { content: dmContent.trim() })
      message.success(`消息已发送给 ${dmTo.name}`)
      setDmOpen(false)
      setDmFrom(null)
      setDmTo(null)
      setDmContent('')
    } catch {
      message.error('消息发送失败')
    } finally {
      setDmSending(false)
    }
  }

  const loadRecommendedTasks = async (agent: Agent) => {
    setRecTasksAgent(agent)
    setRecTasksOpen(true)
    setRecTasksLoading(true)
    try {
      const result = await agentsApi.getRecommendedTasks(agent.id, { limit: 20 })
      setRecTasks(Array.isArray(result) ? result : [])
    } catch {
      message.error('加载推荐任务失败')
      setRecTasks([])
    } finally {
      setRecTasksLoading(false)
    }
  }

  const loadInbox = async (agent: Agent) => {
    setInboxLoading(true)
    try {
      const result = await agentsApi.getAgentInbox(agent.id, { per_page: 20 })
      setInboxItems(result.items || [])
    } catch {
      message.error('加载收件箱失败')
    } finally {
      setInboxLoading(false)
    }
  }

  const loadNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const result = await agentsApi.getNotifications({ per_page: 30 })
      setNotifications(result.items || [])
      setUnreadCount(result.unread_count || 0)
    } catch {
      // silent
    } finally {
      setNotificationsLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await agentsApi.markNotificationsRead({ all: true })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      message.error('标记已读失败')
    }
  }

  return {
    inboxItems, setInboxItems, inboxLoading, notifications, setNotifications,
    unreadCount, setUnreadCount, notificationsLoading,
    dmOpen, setDmOpen, dmFrom, setDmFrom, dmTo, setDmTo, dmContent, setDmContent,
    dmSending, recTasksOpen, setRecTasksOpen, recTasksAgent, setRecTasksAgent,
    recTasks, setRecTasks, recTasksLoading,
    sendDirectMessage, loadRecommendedTasks,
    loadInbox, loadNotifications, markAllRead,
  }
}
