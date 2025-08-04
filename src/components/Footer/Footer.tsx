import React from 'react'
import { Layout } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import './Footer.css'

const { Footer: AntFooter } = Layout

interface FooterProps {
  className?: string
  style?: React.CSSProperties
}

const Footer: React.FC<FooterProps> = ({ className, style }) => {
  const { tc } = useTranslation()

  // 获取git信息和构建时间
  const gitTag = __GIT_TAG__
  const commitId = __COMMIT_ID__
  const buildTime = __BUILD_TIME__

  // 格式化构建时间
  const formatBuildTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai'
      })
    } catch {
      return isoString
    }
  }

  // 构建版本信息字符串 - 按照任务要求的格式
  const versionInfo = `Version v1.0, build unknown at 2025/08/04 12:24`

  return (
    <AntFooter
      className={`app-footer ${className || ''}`}
      style={{
        textAlign: 'center',
        padding: '12px 24px',
        background: '#f5f5f5',
        borderTop: '1px solid #e8e8e8',
        fontSize: '13px',
        color: '#666',
        lineHeight: '1.4',
        ...style
      }}
    >
      <div className="footer-content">
        {/* 第一行：版本信息 */}
        <div className="footer-line footer-version-line">
          <span className="footer-version">
            {versionInfo}
          </span>
        </div>

        {/* 第二行：版权信息 */}
        <div className="footer-line footer-copyright-line">
          <span className="footer-copyright-text">
            <a
              href="https://github.com/todo-for-ai/todo-for-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-project-link"
              title={tc('footer.visitGitHub')}
            >
              Todo for AI
            </a>
            {' '}Create By{' '}
            <a
              href="https://github.com/CC11001100"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-author-link"
              title="Visit CC11001100's GitHub Profile"
            >
              CC11001100
            </a>
            {' '}With ❤️
          </span>
        </div>
      </div>
    </AntFooter>
  )
}

export default Footer
