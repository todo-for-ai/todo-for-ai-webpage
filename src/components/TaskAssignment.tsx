import { useState } from 'react'
import { Select, Avatar, Tag } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { userSearchApi } from '../api/userSearch'
import type { UserSearchResult } from '../api/userSearch'

interface Assignee {
  id: number
  type: string
  name: string
  avatar?: string
}

export type { Assignee }

interface TaskAssignmentProps {
  value?: Assignee[]
  onChange?: (value: Assignee[]) => void
  projectId?: number
}

const TaskAssignment: React.FC<TaskAssignmentProps> = ({
  value = [], onChange, projectId
}) => {
  const [options, setOptions] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) { setOptions([]); return }
    try {
      setSearching(true)
      const results = await userSearchApi.search(query, projectId)
      setOptions(results)
    } catch {
      setOptions([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <Select
      mode="multiple"
      value={value.map((v) => v.id)}
      onSearch={handleSearch}
      onChange={(selectedIds: number[]) => {
        const newValue = selectedIds.map((id) => {
          const existing = value.find((v) => v.id === id)
          const option = options.find((o) => o.id === id)
          return {
            id,
            type: 'human',
            name: existing?.name || option?.nickname || option?.username || String(id),
            avatar: existing?.avatar || option?.avatar_url || undefined,
          }
        })
        onChange?.(newValue)
      }}
      filterOption={false}
      loading={searching}
      placeholder="搜索并选择成员..."
      style={{ width: '100%' }}
      options={options.map((u) => ({
        value: u.id,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={20} icon={<UserOutlined />} src={u.avatar_url} />
            <span>{u.nickname || u.username}</span>
          </div>
        ),
      }))}
      tagRender={(props) => {
        const assignee = value.find((v) => v.id === props.value)
        return (
          <Tag closable={props.closable} onClose={props.onClose} style={{ marginRight: 3 }}>
            {assignee?.name || props.label}
          </Tag>
        )
      }}
    />
  )
}

export default TaskAssignment
