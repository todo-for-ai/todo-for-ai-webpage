import React, { useState } from 'react'
import { MessageOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { useLanguage } from '../../contexts/LanguageContext'
import './WeChatGroup.css'

interface WeChatGroupProps {
  className?: string
}

const WeChatGroup: React.FC<WeChatGroupProps> = ({ className }) => {
  const { t } = useTranslation('wechatGroup')
  const { language } = useLanguage()
  const [isHovered, setIsHovered] = useState(false)

  // 只在简体中文模式下显示
  if (language !== 'zh-CN') {
    return null
  }

  return (
    <div 
      className={`wechat-group-widget ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip
        title={t('tooltip')}
        placement="left"
      >
        <div className="wechat-group-icon">
          <MessageOutlined />
          <span className="wechat-group-text">{t('buttonText')}</span>
        </div>
      </Tooltip>

      {isHovered && (
        <div className="wechat-group-qr-popup">
          <div className="qr-popup-content">
            <div className="qr-popup-header">
              <h4>{t('title')}</h4>
            </div>
            <div className="qr-popup-body">
              <img
                src="/images/wechat-group-qr.png"
                alt={t('qrAlt')}
                className="qr-code-image"
              />
              <p className="qr-popup-description">
                {t('description')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeChatGroup
