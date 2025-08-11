import React, { useState, useRef, useEffect } from 'react'
import { MessageOutlined, CloseOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { useLanguage } from '../../contexts/LanguageContext'
import { analytics } from '../../utils/analytics'
import './WeChatGroup.css'

interface WeChatGroupProps {
  className?: string
}

const WeChatGroup: React.FC<WeChatGroupProps> = ({ className }) => {
  const { t } = useTranslation('wechatGroup')
  const { language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<number | null>(null)

  // 点击外部区域关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    // 清除之前的隐藏定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsVisible(true)
    // 追踪微信群交互事件
    analytics.social.joinWeChatGroup()
  }

  const handleMouseLeave = () => {
    // 延迟隐藏弹窗，给用户时间移动到弹窗上
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  const handlePopupMouseEnter = () => {
    // 鼠标进入弹窗时，取消隐藏
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  const handlePopupMouseLeave = () => {
    // 鼠标离开弹窗时，隐藏弹窗
    setIsVisible(false)
  }

  const handleClosePopup = () => {
    setIsVisible(false)
  }

  // 只在简体中文模式下显示
  if (language !== 'zh-CN') {
    return null
  }

  return (
    <div
      ref={widgetRef}
      className={`wechat-group-widget ${className || ''}`}
    >
      <Tooltip
        title={t('tooltip')}
        placement="left"
      >
        <div
          className="wechat-group-icon"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <MessageOutlined />
          <span className="wechat-group-text">{t('buttonText')}</span>
        </div>
      </Tooltip>

      {isVisible && (
        <div
          className="wechat-group-qr-popup"
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <div className="qr-popup-content">
            <div className="qr-popup-header">
              <h4>{t('title')}</h4>
              <button
                className="qr-popup-close"
                onClick={handleClosePopup}
                aria-label="关闭"
              >
                <CloseOutlined />
              </button>
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
