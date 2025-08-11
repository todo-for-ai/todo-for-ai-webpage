import React, { useState, useEffect } from 'react'
import { Button, Tooltip, Space } from 'antd'
import { GithubOutlined, StarOutlined, LoadingOutlined } from '@ant-design/icons'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { githubService, DEFAULT_REPO, type GitHubRepoInfo } from '../../services/githubService'
import './GitHubBadge.css'

interface GitHubBadgeProps {
  owner?: string
  repo?: string
  repositoryUrl?: string // 保持向后兼容
  size?: 'small' | 'middle' | 'large'
  showStars?: boolean
  showForks?: boolean
  variant?: 'triangle' | 'button' // 支持两种样式
  className?: string
  style?: React.CSSProperties
}

const GitHubBadge: React.FC<GitHubBadgeProps> = ({
  owner,
  repo,
  repositoryUrl,
  size = 'middle',
  showStars = true,
  showForks = false,
  variant = 'triangle',
  className,
  style
}) => {
  const { tc } = useTranslation()
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 解析owner和repo从repositoryUrl（向后兼容）
  const parseRepoFromUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    return match ? { owner: match[1], repo: match[2] } : null
  }

  const finalOwner = owner || (repositoryUrl ? parseRepoFromUrl(repositoryUrl)?.owner : DEFAULT_REPO.owner) || DEFAULT_REPO.owner
  const finalRepo = repo || (repositoryUrl ? parseRepoFromUrl(repositoryUrl)?.repo : DEFAULT_REPO.repo) || DEFAULT_REPO.repo
  const finalUrl = repositoryUrl || `https://github.com/${finalOwner}/${finalRepo}`

  useEffect(() => {
    if (showStars || showForks) {
      const loadRepoInfo = async () => {
        try {
          setLoading(true)
          setError(null)
          const info = await githubService.getRepoInfo(finalOwner, finalRepo)
          setRepoInfo(info)
        } catch (err) {
          console.error('Failed to load GitHub repo info:', err)
          setError(err instanceof Error ? err.message : '获取仓库信息失败')
        } finally {
          setLoading(false)
        }
      }

      loadRepoInfo()
    }
  }, [finalOwner, finalRepo, showStars, showForks])

  const handleClick = () => {
    window.open(finalUrl, '_blank', 'noopener,noreferrer')
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 'small' as const
      case 'large':
        return 'large' as const
      default:
        return 'middle' as const
    }
  }

  const tooltipTitle = repoInfo
    ? `${repoInfo.full_name}\n${repoInfo.description}\n⭐ ${repoInfo.stargazers_count} stars`
    : `${finalOwner}/${finalRepo}\n${tc('github.starRepository')}`

  // 三角形样式（原有样式，保持向后兼容）
  if (variant === 'triangle') {
    return (
      <Tooltip title={tooltipTitle} placement="bottom">
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
              marginTop: '-23px',
              marginLeft: '17px'
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

  // 按钮样式（新样式，支持显示star数）
  const renderContent = () => {
    if (loading) {
      return (
        <Space size="small">
          <LoadingOutlined />
          <span>加载中...</span>
        </Space>
      )
    }

    return (
      <Space size="small" className="github-badge-content">
        <GithubOutlined className="github-badge-icon" />
        <span className="github-badge-text">GitHub</span>
        {showStars && repoInfo && (
          <Space size={2} className="github-badge-stats">
            <StarOutlined className="github-badge-star-icon" />
            <span className="github-badge-star-count">
              {formatNumber(repoInfo.stargazers_count)}
            </span>
          </Space>
        )}
        {showForks && repoInfo && repoInfo.forks_count > 0 && (
          <Space size={2} className="github-badge-stats">
            <span className="github-badge-fork-icon">⑂</span>
            <span className="github-badge-fork-count">
              {formatNumber(repoInfo.forks_count)}
            </span>
          </Space>
        )}
      </Space>
    )
  }

  return (
    <Tooltip title={tooltipTitle} placement="top">
      <Button
        type="default"
        size={getButtonSize()}
        onClick={handleClick}
        className={`github-badge ${className || ''}`}
        style={style}
        loading={loading}
      >
        {renderContent()}
      </Button>
    </Tooltip>
  )
}

export default GitHubBadge
