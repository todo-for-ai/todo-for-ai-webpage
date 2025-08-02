import React from 'react'
import { Button, Tooltip } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import './GitHubBadge.css'

interface GitHubBadgeProps {
  repositoryUrl?: string
  className?: string
  style?: React.CSSProperties
}

const GitHubBadge: React.FC<GitHubBadgeProps> = ({
  repositoryUrl = 'https://github.com/todo-for-ai/todo-for-ai',
  className,
  style
}) => {
  const { tc } = useTranslation()

  const handleClick = () => {
    window.open(repositoryUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Tooltip title={tc('github.starRepository')} placement="bottom">
      <div
        className={`github-badge-triangle ${className || ''}`}
        style={{
          width: '50px',
          height: '50px',
          background: 'rgba(102, 102, 102, 0.08)',
          clipPath: 'polygon(100% 0%, 0% 0%, 100% 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ...style
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(24, 144, 255, 0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(102, 102, 102, 0.08)'
        }}
        aria-label={tc('github.starRepository')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <GithubOutlined
          style={{
            fontSize: '18px',
            color: '#666',
            transition: 'color 0.2s ease',
            marginTop: '-23px', // 继续往角落里移动15px，保证GitHub徽标能完全展示
            marginLeft: '17px' // 向右移动40px：-23px + 40px = 17px，确保GitHub徽标完全显示不被遮挡
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1890ff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#666'
          }}
        />
      </div>
    </Tooltip>
  )
}

export default GitHubBadge
