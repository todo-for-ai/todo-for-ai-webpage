import React from 'react'
import { Select } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from '../i18n/hooks/useTranslation'
import { getLanguageDisplayName, type SupportedLanguage } from '../i18n'
import { useLanguage } from '../contexts/LanguageContext'

const { Option } = Select

interface LanguageSwitchProps {
  style?: React.CSSProperties
  size?: 'small' | 'middle' | 'large'
  showIcon?: boolean
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  style,
  size = 'middle',
  showIcon = true
}) => {
  const { language: currentLanguage, setLanguage, isLoading } = useLanguage()

  const handleLanguageChange = async (newLanguage: SupportedLanguage) => {
    try {
      await setLanguage(newLanguage)
      // 不需要手动刷新页面，LanguageContext会处理语言切换
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  return (
    <Select
      value={currentLanguage}
      onChange={handleLanguageChange}
      style={{ minWidth: 120, ...style }}
      size={size}
      suffixIcon={showIcon ? <GlobalOutlined /> : undefined}
      loading={isLoading}
      disabled={isLoading}
    >
      <Option value="zh-CN">{getLanguageDisplayName('zh-CN')}</Option>
      <Option value="en">{getLanguageDisplayName('en')}</Option>
    </Select>
  )
}

export default LanguageSwitch
