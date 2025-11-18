import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useContextRuleStore } from '../../stores'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { useContextRulesColumns } from './ContextRulesColumns'

interface ContextRulesTabProps {
  projectId: number
}

export const ContextRulesTab: React.FC<ContextRulesTabProps> = ({ projectId }) => {
  const navigate = useNavigate()
  const { tp } = usePageTranslation('projectDetail')
  const {
    contextRules,
    loading,
    fetchContextRules,
    setQueryParams,
    deleteContextRule,
    toggleContextRule
  } = useContextRuleStore()

  useEffect(() => {
    setQueryParams({ project_id: projectId })
    fetchContextRules()
  }, [projectId, setQueryParams, fetchContextRules])

  const handleDelete = async (rule: any) => {
    const success = await deleteContextRule(rule.id)
    if (success) {
      message.success(tp('contextRules.messages.deleteSuccess'))
    }
  }

  const columns = useContextRulesColumns({ onDelete: handleDelete, onToggle: async () => {} })

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>{tp('contextRules.title')}</h4>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`/todo-for-ai/pages/context-rules/create?project_id=${projectId}`)}
        >
          {tp('contextRules.createButton')}
        </Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={contextRules}
          rowKey="id"
          loading={loading}
          pagination={{ showSizeChanger: true }}
        />
      </Card>
    </div>
  )
}
