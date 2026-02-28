import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Space, Tag, Input, Select, message, Spin } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores'
import type { Project } from '../api/projects'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const Search = Input.Search

const Projects: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const { tp, pageTitle, i18n } = usePageTranslation('projects')

  const { projects, fetchProjects } = useProjectStore()

  useEffect(() => {
    loadProjects()
  }, [statusFilter])

  useEffect(() => {
    document.title = `${tp('pageTitle')}`
    return () => {
      document.title = 'Todo for AI'
    }
  }, [tp, pageTitle])

  const loadProjects = async () => {
    setLoading(true)
    try {
      await fetchProjects({ status: statusFilter === 'all' ? undefined : statusFilter })
    } catch (error) {
      message.error(tp('messages.loadFailed', { defaultValue: 'Failed to load projects' }))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    navigate('/todo-for-ai/pages/projects/create')
  }

  const handleProjectClick = (project: Project) => {
    navigate(`/todo-for-ai/pages/projects/${project.id}`)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: tp('table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <a onClick={() => handleProjectClick(record)}>{text}</a>
      ),
    },
    {
      title: tp('table.columns.description', { defaultValue: 'Description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: tp('table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? tp('status.active') : tp('status.archived')}
        </Tag>
      ),
    },
    {
      title: tp('table.columns.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(i18n.language || 'en-US'),
    },
  ]

  const filteredProjects = projects.filter(project => {
    const matchSearch = !searchText || 
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchText.toLowerCase()))
    
    const matchStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchSearch && matchStatus
  })

  if (loading && projects.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{tp('title')}</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadProjects}>
            {tp('buttons.refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject}>
            {tp('buttons.createProject')}
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
          <Search
            placeholder={tp('search.placeholder')}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Select.Option value="all">{tp('filters.options.allStatus')}</Select.Option>
            <Select.Option value="active">{tp('status.active')}</Select.Option>
            <Select.Option value="archived">{tp('status.archived')}</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          locale={{ emptyText: tp('empty.noData') }}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) =>
              tp('pagination.showTotal', {
                start: range[0],
                end: range[1],
                total
              })
          }}
        />
      </Card>
    </div>
  )
}

export default Projects
