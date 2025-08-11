import React, { useState, useRef, useEffect } from 'react'
import { MessageOutlined, CloseOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { useLanguage } from '../../contexts/LanguageContext'
import { analytics } from '../../utils/analytics'
import './TelegramGroup.css'

interface TelegramGroupProps {
  className?: string
}

const TelegramGroup: React.FC<TelegramGroupProps> = ({ className }) => {
  const { t } = useTranslation('telegramGroup')
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

  const handleJoinTelegram = () => {
    // 追踪Telegram群交互事件
    analytics.social.joinTelegramGroup()
    // 打开Telegram群链接
    window.open('https://t.me/+uyFQbcQqNipjNWQ1', '_blank', 'noopener,noreferrer')
    setIsVisible(false)
  }

  // 只在英文模式下显示
  if (language !== 'en') {
    return null
  }

  return (
    <div
      ref={widgetRef}
      className={`telegram-group-widget ${className || ''}`}
    >
      <Tooltip
        title={t('tooltip')}
        placement="left"
      >
        <div
          className="telegram-group-icon"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <MessageOutlined />
          <span className="telegram-group-text">{t('buttonText')}</span>
        </div>
      </Tooltip>

      {isVisible && (
        <div
          className="telegram-group-popup"
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <div className="popup-content">
            <div className="popup-header">
              <h4>{t('title')}</h4>
              <button
                className="popup-close"
                onClick={handleClosePopup}
                aria-label="Close"
              >
                <CloseOutlined />
              </button>
            </div>
            <div className="popup-body">
              <div className="telegram-info">
                <div className="telegram-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-.38.24-1.07.7-.96.66-1.97 1.35-1.97 1.35s-.22.14-.63.02c-.4-.12-.9-.28-1.44-.52-.66-.29-1.18-.45-1.13-.94.03-.26.31-.52.93-.8 2.52-1.1 4.2-1.84 5.05-2.23 2.02-.93 2.44-1.09 2.71-1.09.06 0 .19.01.28.09.07.06.09.14.1.19-.01.03-.01.08-.01.13z"/>
                  </svg>
                </div>
                <p className="telegram-description">
                  {t('description')}
                </p>
                <button
                  className="join-telegram-btn"
                  onClick={handleJoinTelegram}
                >
                  {t('joinButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TelegramGroup
