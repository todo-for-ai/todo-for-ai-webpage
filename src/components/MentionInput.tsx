/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Input, Popover, Avatar, List } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { userSearchApi } from '../api/userSearch'
import type { UserSearchResult } from '../api/userSearch'

const { TextArea } = Input

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: UserSearchResult[]) => void
  placeholder?: string
  projectId?: number
  rows?: number
}

const MentionInput: React.FC<MentionInputProps> = ({
  value, onChange, placeholder, projectId, rows = 3,
}) => {
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionQuery, setMentionQuery] = useState('')
  const [detectedMentions, setDetectedMentions] = useState<UserSearchResult[]>([])
  const textAreaRef = useRef<any>(null)

  const handleChange = useCallback((text: string) => {
    const el = textAreaRef.current?.resizableTextArea?.textArea
    const cursorPos = el?.selectionStart ?? text.length
    const textBeforeCursor = text.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex >= 0) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1)
      if (!textAfterAt.includes(' ') && textAfterAt.length > 0) {
        setMentionStart(atIndex)
        setMentionQuery(textAfterAt)
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
    onChange(text, detectedMentions)
  }, [detectedMentions, onChange])

  useEffect(() => {
    if (!showSuggestions || mentionQuery.length < 1) return
    const timer = setTimeout(async () => {
      try {
        const results = await userSearchApi.search(mentionQuery, projectId)
        setSuggestions(results)
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [mentionQuery, showSuggestions, projectId])

  const insertMention = (user: UserSearchResult) => {
    const before = value.substring(0, mentionStart)
    const after = value.substring(mentionStart + 1 + mentionQuery.length)
    const newValue = `${before}@${user.nickname || user.username} ${after}`
    const newMentions = [...detectedMentions.filter((m) => m.id !== user.id), user]
    setDetectedMentions(newMentions)
    setShowSuggestions(false)
    onChange(newValue, newMentions)
  }

  const suggestionsContent = suggestions.length > 0 ? (
    <List
      size="small"
      dataSource={suggestions}
      renderItem={(user: UserSearchResult) => (
        <List.Item
          style={{ padding: '4px 8px', cursor: 'pointer' }}
          onClick={() => insertMention(user)}
        >
          <List.Item.Meta
            avatar={<Avatar size={20} icon={<UserOutlined />} src={user.avatar_url} />}
            title={<span style={{ fontSize: 13 }}>{user.nickname || user.username}</span>}
          />
        </List.Item>
      )}
      style={{ maxHeight: 200, overflow: 'auto', minWidth: 200 }}
    />
  ) : null

  return (
    <Popover
      content={suggestionsContent}
      open={showSuggestions && suggestions.length > 0}
      placement="bottomLeft"
      trigger={[]}
    >
      <TextArea
        ref={textAreaRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || '输入内容，@提及成员...'}
        autoSize={{ minRows: rows, maxRows: 8 }}
      />
    </Popover>
  )
}

export default MentionInput
