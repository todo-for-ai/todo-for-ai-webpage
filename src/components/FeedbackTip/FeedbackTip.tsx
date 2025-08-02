import React, { useState, useEffect } from 'react'
import { Card, Button, Collapse } from 'antd'
import { BulbOutlined, GithubOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import './FeedbackTip.css'

interface FeedbackTipProps {
  className?: string
  style?: React.CSSProperties
  showIcon?: boolean
  closable?: boolean
}

const STORAGE_KEY = 'feedbackTip_collapsed'

const FeedbackTip: React.FC<FeedbackTipProps> = ({
  className,
  style,
  showIcon = true,
  closable = true
}) => {
  const { tc } = useTranslation()

  // 从localStorage读取折叠状态，默认为展开（false表示展开，true表示折叠）
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : false
  })

  // 保存折叠状态到localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleGitHubClick = () => {
    window.open('https://github.com/todo-for-ai/todo-for-ai/issues/new', '_blank', 'noopener,noreferrer')
  }

  return (
    <Card
      className={`feedback-tip-card ${isCollapsed ? 'collapsed' : ''} ${className || ''}`}
      style={style}
      size="small"
    >
      <div className="feedback-tip-header" onClick={handleToggle}>
        <div className="feedback-tip-title">
          {showIcon && <BulbOutlined className="feedback-tip-icon" />}
          <span>{tc('feedbackTip.title')}</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
          className="feedback-tip-toggle"
        />
      </div>

      {!isCollapsed && (
        <div className="feedback-tip-content">
          <p>{tc('feedbackTip.description')}</p>
          <div className="feedback-tip-actions">
            <a
              href="https://github.com/todo-for-ai/todo-for-ai/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="feedback-tip-github-link"
              onClick={(e) => {
                e.preventDefault()
                handleGitHubClick()
              }}
            >
              <GithubOutlined />
              <span>{tc('feedbackTip.submitIssue')}</span>
            </a>
          </div>
        </div>
      )}
    </Card>
  )
}

export default FeedbackTip
