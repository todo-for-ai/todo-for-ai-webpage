/**
 * 组织详情页头部组件
 */

import { Button, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import './OrgHeader.css'

const { Title, Paragraph } = Typography

interface OrgHeaderProps {
  title: string
  subtitle: string
  backText: string
  onBack: () => void
}

export const OrgHeader: React.FC<OrgHeaderProps> = ({
  title,
  subtitle,
  backText,
  onBack,
}) => {
  return (
    <div className="org-header">
      <div className="org-header__content">
        <div>
          <Title level={2} className="org-header__title">{title}</Title>
          <Paragraph className="org-header__subtitle">{subtitle}</Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {backText}
        </Button>
      </div>
    </div>
  )
}
