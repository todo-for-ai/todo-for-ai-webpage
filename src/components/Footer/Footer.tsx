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

  // 获取环境变量中的版本信息
  const appVersion = import.meta.env.VITE_APP_VERSION || 'v1.0'
  const buildTimeEnv = import.meta.env.VITE_BUILD_TIME
  const commitIdEnv = import.meta.env.VITE_COMMIT_ID

  // 格式化构建时间
  const formatBuildTime = (timeString: string) => {
    try {
      // 如果是时间戳格式 (YYYYMMDD_HHMMSS)
      if (timeString && timeString.match(/^\d{8}_\d{6}$/)) {
        const year = timeString.substring(0, 4)
        const month = timeString.substring(4, 6)
        const day = timeString.substring(6, 8)
        const hour = timeString.substring(9, 11)
        const minute = timeString.substring(11, 13)
        return `${year}/${month}/${day} ${hour}:${minute}`
      }
      // 如果是ISO字符串
      const date = new Date(timeString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai'
      })
    } catch {
      return timeString || buildTime
    }
  }

  // 构建版本信息字符串 - 使用实际的构建信息
  const finalCommitId = commitIdEnv || commitId || 'unknown'
  const finalBuildTime = buildTimeEnv || buildTime
  const versionInfo = `Version ${appVersion}, build ${finalCommitId} at ${formatBuildTime(finalBuildTime)}`

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
