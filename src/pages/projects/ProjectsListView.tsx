import { Button, Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Project } from '../../api/projects'
import type { ProjectPagination, ProjectTranslate } from './types'

interface ProjectsListViewProps {
  t: ProjectTranslate
  columns: ColumnsType<Project>
  projects: Project[]
  loading: boolean
  pagination: ProjectPagination | null
  searchKeyword: string
  onSearchClear: () => void
  onCreate: () => void
  onTableChange: (tablePagination: any, filters: any, sorter: any) => void
}

export const ProjectsListView = ({
  t,
  columns,
  projects,
  loading,
  pagination,
  searchKeyword,
  onSearchClear,
  onCreate,
  onTableChange,
}: ProjectsListViewProps) => {
  return (
    <Table
      columns={columns}
      dataSource={projects}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination?.page || 1,
        pageSize: pagination?.per_page || 20,
        total: pagination?.total || 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => t('pagination.showTotal', { start: range[0], end: range[1], total }),
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      onChange={onTableChange}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchKeyword ? (
                <span>
                  {t('empty.noSearchResults', { keyword: searchKeyword })}
                  <br />
                  <Button
                    type="link"
                    size="small"
                    onClick={onSearchClear}
                    style={{ padding: 0, marginTop: '8px' }}
                  >
                    {t('buttons.clearSearch')}
                  </Button>
                </span>
              ) : (
                <span>
                  {t('empty.noData')}
                  <br />
                  <Button type="link" size="small" onClick={onCreate} style={{ padding: 0, marginTop: '8px' }}>
                    {t('buttons.createFirst')}
                  </Button>
                </span>
              )
            }
          />
        ),
      }}
    />
  )
}
