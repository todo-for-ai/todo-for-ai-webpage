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

  const version = 'v1.0'

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
            {tc('footer.version')} {version}
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
          </span>
        </div>
      </div>
    </AntFooter>
  )
}

export default Footer
