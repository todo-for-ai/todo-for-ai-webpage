import type { ChangeEvent } from 'react'
import { AppstoreOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Col, Input, Row, Space, Typography } from 'antd'
import type { ProjectFilters, ProjectsViewMode, ProjectTranslate } from './types'

const { Title, Paragraph } = Typography
const { Search } = Input

interface ProjectsHeaderProps {
  t: ProjectTranslate
  viewMode: ProjectsViewMode
  filters: ProjectFilters
  searchValue: string
  loading: boolean
  total: number
  onViewModeChange: (mode: ProjectsViewMode) => void
  onRefresh: () => void
  onCreate: () => void
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSearchSubmit: (value: string) => void
  onSearchClear: () => void
}

export const ProjectsHeader = ({
  t,
  viewMode,
  filters,
  searchValue,
  loading,
  total,
  onViewModeChange,
  onRefresh,
  onCreate,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
}: ProjectsHeaderProps) => {
  return (
    <div className="page-header">
      <div className="flex-between">
        <div>
          <Title level={2} className="page-title">
            {t('title')}
          </Title>
          <Paragraph className="page-description">{t('subtitle')}</Paragraph>
        </div>
        <Space>
          <Space.Compact>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => onViewModeChange('list')}
              size="small"
            >
              {t('buttons.list')}
            </Button>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => onViewModeChange('card')}
              size="small"
            >
              {t('buttons.card')}
            </Button>
          </Space.Compact>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            {t('buttons.refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            {t('buttons.createProject')}
          </Button>
        </Space>
      </div>

      <div style={{ marginTop: '16px', marginBottom: '8px' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder={t('search.placeholder')}
              value={searchValue}
              onChange={onSearchChange}
              onSearch={onSearchSubmit}
              onClear={onSearchClear}
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: '100%' }}
              loading={loading}
            />
          </Col>
          <Col span={16}>
            <div
              style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'right',
                lineHeight: '32px',
              }}
            >
              {loading ? (
                <span style={{ color: '#1890ff' }}>{t('search.searching')}</span>
              ) : total ? (
                <>
                  {t('search.totalFound', { total })}
                  {filters.search && (
                    <span style={{ marginLeft: '8px' }}>
                      {t('search.keyword', { keyword: filters.search })}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: filters.search ? '#ff4d4f' : '#8c8c8c' }}>
                  {filters.search
                    ? t('search.noResults', { keyword: filters.search })
                    : t('search.noProjects')}
                </span>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  )
}
