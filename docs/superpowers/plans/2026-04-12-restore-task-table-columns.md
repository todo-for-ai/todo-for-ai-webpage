# Restore Task Table Missing Columns

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 恢复任务表格在 commit `1f4c8f3` 重构时丢失的 3 个列（Last Modified、Task Content、Actions），使表格恢复到原始的 5 列完整状态。

**Architecture:** 修改 `useTaskTableConfig.tsx` 的 `getTaskColumns()` 函数，在现有 Title 和 Status 列之后，恢复 Last Modified（`updated_at`）、Content（`content`）和 Actions 三列。数据流不变：API → useTaskStore → useProjectTasks → getTaskColumns() → Table。复用现有的 `TaskContentSummary` 组件渲染内容预览，复用 `useTaskOperations` 的 `handleDelete` 处理删除，复用 i18n 中已有的 key。

**Tech Stack:** React 18, Ant Design 5, TypeScript 5

**Risks:**
- `handleDelete` 在 `useTaskOperations` 中调用 `fetchTasks()` 但不传参数，可能不会刷新项目级任务列表 → 缓解：检查 `useTaskStore` 当前 state 中的 queryParams 是否保留了 project_id 筛选
- `updateTaskStatus` 返回值可能是 undefined（API 响应格式不确定），`useTaskOperations` 用 `if (success)` 判断 → 缓解：这是现有代码，本次不改

---

### Task 1: Restore Missing Columns in useTaskTableConfig

**Depends on:** None
**Files:**
- Modify: `src/components/ProjectDetail/hooks/useTaskTableConfig.tsx` (全文替换)

- [ ] **Step 1: 修改 getTaskColumns() — 恢复 Last Modified、Content、Actions 三列**

文件: `src/components/ProjectDetail/hooks/useTaskTableConfig.tsx`（替换整个文件）

```typescript
import { useCallback } from 'react'
import { Select, Tag, Space, Button, Popconfirm } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import type { Task } from '../../../api/tasks'
import TaskIdBadge from '../../../components/TaskIdBadge'
import { LinkButton } from '../../../components/SmartLink'
import { TaskContentSummary } from '../../../components/TaskContentPreview'
import { useTaskOperations } from './useTaskOperations'

const { Option } = Select

const getTaskTitleColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    todo: '#000000',
    in_progress: '#1890ff',
    review: '#faad14',
    done: '#52c41a',
    cancelled: '#ff4d4f',
  }
  return statusColors[status] || '#000000'
}

export const useTaskTableConfig = () => {
  const { tp } = usePageTranslation('projectDetail')
  const { handleStatusChange, handleDelete } = useTaskOperations()

  const getTaskColumns = useCallback(() => {
    const columns = [
      {
        title: tp('tasks.table.columns.title'),
        dataIndex: 'title',
        key: 'title',
        width: 200,
        render: (text: string, record: Task) => (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <TaskIdBadge taskId={record.id} size="medium" />
            <div style={{ flex: 1, minWidth: 0, color: getTaskTitleColor(record.status) }}>
              <LinkButton
                to={`/todo-for-ai/pages/tasks/${record.id}`}
                type="link"
                style={{ padding: 0, fontWeight: 500, height: 'auto', color: 'inherit' }}
              >
                {text}
              </LinkButton>
              {record.description && (
                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                  {record.description.length > 50
                    ? record.description.substring(0, 50) + '...'
                    : record.description}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: tp('tasks.table.columns.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        sorter: true,
        render: (status: string, record: Task) => (
          <Select
            value={status}
            size="small"
            style={{ width: 100 }}
            onChange={(newStatus) => handleStatusChange(record, newStatus as Task['status'])}
          >
            <Option value="todo">{tp('tasks.table.status.todo')}</Option>
            <Option value="in_progress">{tp('tasks.table.status.inProgress')}</Option>
            <Option value="review">{tp('tasks.table.status.review')}</Option>
            <Option value="done">{tp('tasks.table.status.done')}</Option>
            <Option value="cancelled">{tp('tasks.table.status.cancelled')}</Option>
          </Select>
        ),
      },
      {
        title: tp('tasks.table.columns.lastModified'),
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 160,
        sorter: true,
        render: (date: string) => {
          if (!date) return null
          const dateObj = new Date(date)
          return (
            <div style={{ fontSize: '12px' }}>
              <div>{dateObj.toLocaleDateString('zh-CN')}</div>
              <div style={{ color: '#999' }}>{dateObj.toLocaleTimeString('zh-CN', { hour12: false })}</div>
            </div>
          )
        },
      },
      {
        title: tp('tasks.table.columns.content'),
        dataIndex: 'content',
        key: 'content',
        width: 400,
        render: (content: string) => (
          <TaskContentSummary
            content={content}
            maxLength={120}
            showPreview={true}
          />
        ),
      },
      {
        title: tp('tasks.table.columns.actions'),
        key: 'action',
        width: 180,
        render: (_: unknown, record: Task) => (
          <Space size="small">
            <LinkButton
              to={`/todo-for-ai/pages/tasks/${record.id}`}
              type="text"
              icon={<EyeOutlined />}
              size="small"
            >
              {tp('tasks.table.actions.view')}
            </LinkButton>
            <LinkButton
              to={`/todo-for-ai/pages/tasks/${record.id}/edit`}
              type="text"
              icon={<EditOutlined />}
              size="small"
            >
              {tp('tasks.table.actions.edit')}
            </LinkButton>
            <Popconfirm
              title={tp('tasks.confirm.delete.title')}
              description={tp('tasks.confirm.delete.description')}
              onConfirm={() => handleDelete(record)}
              okText={tp('tasks.confirm.delete.ok')}
              cancelText={tp('tasks.confirm.delete.cancel')}
            >
              <Button type="text" icon={<DeleteOutlined />} size="small" danger>
                {tp('tasks.table.actions.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]
    return columns
  }, [tp, handleStatusChange, handleDelete])

  return {
    getTaskColumns
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**
Run: `cd /Users/cc11001100/github/todo-for-ai/todo-for-ai/todo-for-ai-webpage && npx tsc --noEmit --pretty src/components/ProjectDetail/hooks/useTaskTableConfig.tsx 2>&1 | head -30`
Expected:
  - Exit code: 0
  - Output does NOT contain: "error TS"

- [ ] **Step 3: 验证 Vite 构建**
Run: `cd /Users/cc11001100/github/todo-for-ai/todo-for-ai/todo-for-ai-webpage && npx vite build 2>&1 | tail -10`
Expected:
  - Exit code: 0
  - Output contains: "built in"

- [ ] **Step 4: 提交**
Run: `cd /Users/cc11001100/github/todo-for-ai/todo-for-ai/todo-for-ai-webpage && git add src/components/ProjectDetail/hooks/useTaskTableConfig.tsx && git commit -m "fix(tasks): restore 3 missing columns (lastModified, content, actions) lost in refactor commit 1f4c8f3"`
