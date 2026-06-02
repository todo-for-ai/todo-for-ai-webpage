/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react'
import { Card, Descriptions, Tag, Typography } from 'antd'
import { MarkdownEditor } from '../../../components/MarkdownEditor'
import dayjs from 'dayjs'

const { Paragraph } = Typography

interface TaskDetailContentProps {
  task: any
  tp: (key: string) => string
}

interface ParsedTaskContent {
  prompt?: string
  context?: Record<string, any>
  agent_output?: string
  agent_metadata?: Record<string, any>
  processed_by?: string
  originalContent: string
}

const parseTaskContent = (content: string): ParsedTaskContent => {
  try {
    const parsed = JSON.parse(content)
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        prompt: parsed.prompt,
        context: parsed.context,
        agent_output: parsed.agent_output,
        agent_metadata: parsed.agent_metadata,
        processed_by: parsed.processed_by,
        originalContent: content,
      }
    }
  } catch {
    // Not JSON, treat as plain text
  }
  return {
    originalContent: content,
  }
}

export const TaskDetailContent: React.FC<TaskDetailContentProps> = ({
  task,
  tp
}) => {
  const parsedContent = useMemo(() => task ? parseTaskContent(task.content) : { originalContent: '' }, [task])

  if (!task) return null

  const hasAgentOutput = !!parsedContent.agent_output

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 3 }}>
        <Card title={tp('content.title')} style={{ marginBottom: '16px' }}>
          <div className="markdown-content">
            {parsedContent.prompt ? (
              <div>
                <Paragraph><strong>Prompt:</strong> {parsedContent.prompt}</Paragraph>
                {parsedContent.context && Object.keys(parsedContent.context).length > 0 && (
                  <details>
                    <summary style={{ cursor: 'pointer', color: '#00b96b' }}>Context</summary>
                    <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                      <code>{JSON.stringify(parsedContent.context, null, 2)}</code>
                    </pre>
                  </details>
                )}
              </div>
            ) : task.content ? (
              // NOTE: dangerouslySetInnerHTML exists in legacy code; replacing it is out of scope here.
              <div dangerouslySetInnerHTML={{ __html: task.content }} />
            ) : (
              <Paragraph type="secondary">{tp('content.empty')}</Paragraph>
            )}
          </div>
        </Card>

        {hasAgentOutput && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Agent Output</span>
                {parsedContent.processed_by && (
                  <Tag size="small" color="blue">Processed by: {parsedContent.processed_by}</Tag>
                )}
              </div>
            }
            style={{ marginBottom: '16px' }}
            className="agent-output-card"
          >
            <div className="agent-output-content">
              <MarkdownEditor
                value={parsedContent.agent_output || ''}
                readOnly
                height={400}
                hideToolbar
                preview="preview"
              />
            </div>
            {parsedContent.agent_metadata && Object.keys(parsedContent.agent_metadata).length > 0 && (
              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', color: '#00b96b', fontSize: '12px' }}>Metadata</summary>
                <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '8px', fontSize: '12px' }}>
                  <code>{JSON.stringify(parsedContent.agent_metadata, null, 2)}</code>
                </pre>
              </details>
            )}
          </Card>
        )}
      </div>

      <div style={{ flex: 2 }}>
        <Card title={tp('info.title')}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={tp('info.taskId')}>
              <span>#{task.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.project')}>
              {task.project_id}
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.status')}>
              <Tag color={task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'blue' : 'default'}>
                {tp(`status.${task.status}`)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.priority')}>
              <Tag color={task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'blue'}>
                {tp(`priority.${task.priority}`)}
              </Tag>
            </Descriptions.Item>
            {task.due_date && (
              <Descriptions.Item label={tp('info.dueDate')}>
                {dayjs(task.due_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={tp('info.createdAt')}>
              {dayjs(task.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.updatedAt')}>
              {dayjs(task.updated_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  )
}
