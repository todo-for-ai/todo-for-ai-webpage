import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import type { SupportedLanguage } from '../i18n'
import { apiClient } from '../api'

// AntDesign语言包映射
const antdLocales = {
  'zh-CN': zhCN,
  'en': enUS,
}

// 语言上下文类型
interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => Promise<void>
  isLoading: boolean
  antdLocale: typeof zhCN | typeof enUS
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Provider组件属性
interface LanguageProviderProps {
  children: React.ReactNode
}

// 语言Provider组件
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation()
  // 初始化时使用i18n当前语言，如果不支持则使用英文
  const initialLanguage = (['zh-CN', 'en'].includes(i18n.language) ? i18n.language : 'en') as SupportedLanguage
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage)
  const [isLoading, setIsLoading] = useState(false)
  const [antdLocale, setAntdLocale] = useState(antdLocales[initialLanguage] || enUS)

  // 从用户设置加载语言
  const loadUserLanguage = useCallback(async () => {
    try {
      const response = await apiClient.get('/user-settings') as any
      const userLanguage = response.data?.language

      if (userLanguage && (userLanguage === 'zh-CN' || userLanguage === 'en')) {
        await i18n.changeLanguage(userLanguage)
        setLanguageState(userLanguage)
        setAntdLocale(antdLocales[userLanguage as SupportedLanguage])
        return
      }
    } catch (error) {
      console.warn('Failed to load user language settings:', error)
    }

    // 如果API调用失败或没有用户设置，使用i18n检测到的语言
    const detectedLanguage = i18n.language as SupportedLanguage
    // 确保检测到的语言是支持的语言
    const validLanguage = ['zh-CN', 'en'].includes(detectedLanguage) ? detectedLanguage : 'en'
    setLanguageState(validLanguage)
    setAntdLocale(antdLocales[validLanguage])
  }, [i18n])

  // 保存语言到用户设置
  const saveUserLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    try {
      await apiClient.put('/user-settings', { language: newLanguage })
    } catch (error) {
      console.warn('Failed to save user language settings:', error)
    }
  }, [])

  // 设置语言
  const setLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage === language) {
      console.log(`Language already set to ${newLanguage}, skipping`)
      return
    }

    console.log(`Changing language from ${language} to ${newLanguage}`)
    setIsLoading(true)
    try {
      // 1. 更新i18n语言
      await i18n.changeLanguage(newLanguage)
      console.log(`i18n language changed to ${newLanguage}`)

      // 2. 更新状态
      setLanguageState(newLanguage)
      setAntdLocale(antdLocales[newLanguage])
      console.log(`State updated to ${newLanguage}`)

      // 3. 保存到用户设置
      await saveUserLanguage(newLanguage)
      console.log(`User language saved to API`)

      // 4. 保存到本地存储
      localStorage.setItem('i18nextLng', newLanguage)
      console.log(`Language saved to localStorage`)

    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsLoading(false)
    }
  }, [language, i18n, saveUserLanguage])

  // 初始化语言设置
  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true)
      try {
        // 尝试从用户设置加载语言
        await loadUserLanguage()
      } catch (error) {
        console.warn('Failed to initialize language:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeLanguage()
  }, [loadUserLanguage])

  // 监听i18n语言变化
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      const newLanguage = lng as SupportedLanguage
      // 只有当语言确实不同且是支持的语言时才更新
      if (['zh-CN', 'en'].includes(newLanguage) && newLanguage !== language) {
        setLanguageState(newLanguage)
        setAntdLocale(antdLocales[newLanguage] || enUS)
      }
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n, language])

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    isLoading,
    antdLocale,
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      <ConfigProvider locale={antdLocale}>
        {children}
      </ConfigProvider>
    </LanguageContext.Provider>
  )
}

// 使用语言上下文的hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageProvider
