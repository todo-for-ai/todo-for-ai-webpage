/**
 * Agents.tsx 频道/聊天领域块：频道列表与创建、频道消息聊天。
 * 从 Agents.tsx 原样抽出（状态 + 处理函数），逻辑零改动。
 */

import { useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'
import type { ChannelActivityTrend } from '../../../api/agents'

export function useAgentChannelsPanel() {
  const [channels, setChannels] = useState<any[]>([])
  const [channelActivityTrend, setChannelActivityTrend] = useState<ChannelActivityTrend | null>(null)
  const [channelsOpen, setChannelsOpen] = useState(false)
  const [channelCreateOpen, setChannelCreateOpen] = useState(false)
  const [channelForm, setChannelForm] = useState<any>({ name: '', description: '', agent_ids: [] })
  const [chatOpen, setChatOpen] = useState(false)
  const [chatChannel, setChatChannel] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)

  // --- Channels ---
  const loadChannels = async () => {
    try {
      const result = await agentsApi.listChannels()
      setChannels(Array.isArray(result) ? result : [])
      agentsApi.getChannelActivityTrend(14, 10).then(setChannelActivityTrend).catch(() => {})
    } catch { message.error('加载频道失败') }
  }

  const openChannels = () => {
    setChannelsOpen(true)
    loadChannels()
  }

  const createChannel = async () => {
    if (!channelForm.name.trim()) { message.warning('请输入频道名称'); return }
    try {
      await agentsApi.createChannel(channelForm)
      message.success('频道已创建')
      setChannelCreateOpen(false)
      setChannelForm({ name: '', description: '', agent_ids: [] })
      loadChannels()
    } catch { message.error('创建频道失败') }
  }

  const openChat = async (channel: any) => {
    setChatChannel(channel)
    setChatOpen(true)
    setChatInput('')
    try {
      const msgs = await agentsApi.listChannelMessages(channel.id)
      setChatMessages(Array.isArray(msgs) ? msgs : [])
    } catch { setChatMessages([]) }
  }

  const sendChatMessage = async () => {
    if (!chatChannel || !chatInput.trim()) return
    setChatSending(true)
    try {
      await agentsApi.sendChannelMessage(chatChannel.id, { content: chatInput.trim() })
      setChatInput('')
      const msgs = await agentsApi.listChannelMessages(chatChannel.id)
      setChatMessages(Array.isArray(msgs) ? msgs : [])
    } catch { message.error('发送失败') }
    finally { setChatSending(false) }
  }

  return {
    channels, setChannels,
    channelActivityTrend, setChannelActivityTrend,
    channelsOpen, setChannelsOpen,
    channelCreateOpen, setChannelCreateOpen,
    channelForm, setChannelForm,
    chatOpen, setChatOpen,
    chatChannel, setChatChannel,
    chatMessages, setChatMessages,
    chatInput, setChatInput,
    chatSending, setChatSending,
    loadChannels, openChannels, createChannel, openChat, sendChatMessage,
  }
}
