import React from 'react'
import { Button, Descriptions, Empty, List, Modal, Popconfirm, Space, Spin, Tag, Typography } from 'antd'
const { Text } = Typography

export interface WorkflowVersionDiffData {
  added_steps?: string[]
  removed_steps?: string[]
  modified_steps?: string[]
}

export interface WorkflowVersionItem {
  version_number: number
  change_summary?: string
  created_at?: string
  created_by?: string
}

interface WorkflowVersionModalsProps {
  versionModalOpen: boolean
  onCloseVersions: () => void
  versions: WorkflowVersionItem[]
  versionLoading: boolean
  currentVersion: number
  onDiff: (v1: number, v2: number) => void
  onRollback: (v: number) => void
  diffModalOpen: boolean
  onCloseDiff: () => void
  diffV1: number
  diffV2: number
  diffData: WorkflowVersionDiffData | null
}

/** 版本历史 + 版本差异两个弹窗（同一入口域，合并一个文件） */
const WorkflowVersionModals: React.FC<WorkflowVersionModalsProps> = ({
  versionModalOpen, onCloseVersions, versions, versionLoading, currentVersion,
  onDiff, onRollback,
  diffModalOpen, onCloseDiff, diffV1, diffV2, diffData,
}) => (
  <>
    <Modal
      title={`版本历史 (当前: v${currentVersion})`}
      open={versionModalOpen}
      onCancel={onCloseVersions}
      footer={null}
      width={700}
    >
      <Spin spinning={versionLoading}>
        {versions.length === 0 && !versionLoading ? (
          <Empty description="暂无版本记录" />
        ) : (
          <List
            size="small"
            dataSource={versions}
            renderItem={(v: WorkflowVersionItem) => (
              <List.Item
                actions={[
                  v.version_number !== currentVersion && (
                    <Button key="diff" size="small" onClick={() => onDiff(v.version_number, currentVersion)}>
                      对比当前
                    </Button>
                  ),
                  v.version_number !== currentVersion && (
                    <Popconfirm key="rollback" title={`确定回滚到 v${v.version_number}？`} onConfirm={() => onRollback(v.version_number)}>
                      <Button size="small" type="primary">回滚</Button>
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={<Space><Tag color={v.version_number === currentVersion ? 'green' : 'default'}>v{v.version_number}</Tag> {v.version_number === currentVersion && <Tag color="green">当前</Tag>}</Space>}
                  description={
                    <div>
                      <div>{v.change_summary || '无变更说明'}</div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{v.created_at ? new Date(v.created_at).toLocaleString() : ''} {v.created_by ? `by ${v.created_by}` : ''}</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Modal>

    <Modal
      title={`版本差异: v${diffV1} → v${diffV2}`}
      open={diffModalOpen}
      onCancel={onCloseDiff}
      footer={null}
      width={600}
    >
      {diffData && (
        <div>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="新增步骤">
              {diffData.added_steps?.length ? diffData.added_steps.map(s => <Tag key={s} color="green">{s}</Tag>) : '无'}
            </Descriptions.Item>
            <Descriptions.Item label="删除步骤">
              {diffData.removed_steps?.length ? diffData.removed_steps.map(s => <Tag key={s} color="red">{s}</Tag>) : '无'}
            </Descriptions.Item>
            <Descriptions.Item label="修改步骤">
              {diffData.modified_steps?.length ? diffData.modified_steps.map(s => <Tag key={s} color="orange">{s}</Tag>) : '无'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Modal>
  </>
)

export default WorkflowVersionModals
