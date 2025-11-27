import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Space, Tag, Input, Select, message, Spin } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores'
import type { Project } from '../api/projects'

const Search = Input.Search

const Projects: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  const { projects, fetchProjects } = useProjectStore()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      await fetchProjects()
    } catch (error) {
      message.error('加载项目失败')
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
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <a onClick={() => handleProjectClick(record)}>{text}</a>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '活跃' : '归档'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
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
        <h1>项目列表</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadProjects}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject}>
            创建项目
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
          <Search
            placeholder="搜索项目"
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Select.Option value="all">所有状态</Select.Option>
            <Select.Option value="active">活跃</Select.Option>
            <Select.Option value="archived">已归档</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default Projects
