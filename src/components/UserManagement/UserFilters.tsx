import React from 'react'
import { Card, Row, Col, Input, Select, Button } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { UserListParams } from '../../api/auth'

const Search = Input.Search
const { Option } = Select

interface UserFiltersProps {
  filters: UserListParams
  loading: boolean
  onSearch: (value: string) => void
  onStatusFilter: (status: string | undefined) => void
  onRoleFilter: (role: string | undefined) => void
  onRefresh: () => void
  tp: (key: string) => string
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  loading,
  onSearch,
  onStatusFilter,
  onRoleFilter,
  onRefresh,
  tp
}) => {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Search
            placeholder={tp('search.placeholder')}
            allowClear
            onSearch={onSearch}
            style={{ width: 300 }}
            enterButton={<SearchOutlined />}
          />
        </Col>
        <Col>
          <Select
            placeholder={tp('filters.status')}
            allowClear
            style={{ width: 120 }}
            onChange={onStatusFilter}
            value={filters.status}
          >
            <Option value="active">{tp('status.active')}</Option>
            <Option value="suspended">{tp('status.suspended')}</Option>
            <Option value="inactive">{tp('status.inactive')}</Option>
          </Select>
        </Col>
        <Col>
          <Select
            placeholder={tp('filters.role')}
            allowClear
            style={{ width: 120 }}
            onChange={onRoleFilter}
            value={filters.role}
          >
            <Option value="admin">{tp('roles.admin')}</Option>
            <Option value="user">{tp('roles.user')}</Option>
          </Select>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            {tp('actions.refresh')}
          </Button>
        </Col>
      </Row>
    </Card>
  )
}

export default UserFilters
