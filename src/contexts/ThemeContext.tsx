import React, { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { ThemeContextType, ThemeOptions } from '../types/theme'
import { useTheme } from '../hooks/useTheme'

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 主题Provider组件的Props
interface ThemeProviderProps {
  children: ReactNode
  options?: ThemeOptions
}

// 主题Provider组件
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const themeHook = useTheme(options)
  
  const contextValue: ThemeContextType = {
    currentTheme: themeHook.currentTheme,
    availableThemes: themeHook.availableThemes,
    setTheme: themeHook.setTheme,
    isDarkMode: themeHook.isDarkMode,
    toggleDarkMode: themeHook.toggleDarkMode,
    getThemesByCategory: themeHook.getThemesByCategory,
    getThemesByTag: themeHook.getThemesByTag,
    registerTheme: themeHook.registerTheme,
    unregisterTheme: themeHook.unregisterTheme,
    isTypewriterTheme: themeHook.isTypewriterTheme
  }
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// 使用主题上下文的Hook
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  
  return context
}

// 高阶组件：为组件提供主题支持
export const withTheme = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WithThemeComponent = (props: P) => {
    const theme = useThemeContext()
    return <Component {...props} theme={theme} />
  }
  
  WithThemeComponent.displayName = `withTheme(${Component.displayName || Component.name})`
  
  return WithThemeComponent
}

// 主题样式Hook - 用于在组件中获取主题相关的样式
export const useThemeStyles = () => {
  const { currentTheme } = useThemeContext()
  
  // 生成常用的样式对象
  const styles = {
    // 编辑器容器样式
    editorContainer: {
      backgroundColor: currentTheme.colors.editorBackground || currentTheme.colors.background,
      border: `${currentTheme.borders?.width || '1px'} solid ${currentTheme.colors.editorBorder || currentTheme.colors.border}`,
      borderRadius: currentTheme.effects?.borderRadius?.base || '4px',
      boxShadow: currentTheme.shadows?.level1,
      fontFamily: currentTheme.fonts?.body || currentTheme.typography?.fontFamily?.base,
      fontSize: currentTheme.typography?.fontSize?.base || '14px',
      lineHeight: currentTheme.typography?.lineHeight?.normal || 1.5,
      color: currentTheme.colors.textPrimary,
      transition: `all 0.3s ease`
    },

    // 编辑器聚焦样式
    editorFocused: {
      backgroundColor: currentTheme.colors.focus || currentTheme.colors.hover,
      borderColor: currentTheme.colors.focus || currentTheme.colors.primary,
      boxShadow: currentTheme.shadows?.level2
    },

    // 代码块样式
    codeBlock: {
      background: currentTheme.colors.surface || currentTheme.colors.background,
      border: `${currentTheme.borders?.width || '1px'} solid ${currentTheme.colors.border}`,
      borderRadius: currentTheme.effects?.borderRadius?.md || '6px',
      boxShadow: currentTheme.shadows?.level1,
      fontFamily: currentTheme.fonts?.monospace || currentTheme.typography?.fontFamily?.mono,
      fontSize: currentTheme.typography?.fontSize?.sm || '13px',
      padding: '12px',
      margin: '8px 0'
    },

    // 引用块样式
    blockquote: {
      background: currentTheme.colors.surface || currentTheme.colors.background,
      borderLeft: `5px solid ${currentTheme.colors.secondary || currentTheme.colors.primary}`,
      borderRadius: currentTheme.effects?.borderRadius?.base || '4px',
      color: currentTheme.colors.textSecondary || currentTheme.colors.textPrimary,
      padding: '12px',
      margin: '8px 0'
    },

    // 链接样式
    link: {
      color: currentTheme.colors.primary,
      textDecoration: 'none',
      transition: `color 0.3s ease`
    },

    // 链接悬停样式
    linkHover: {
      color: currentTheme.colors.secondary || currentTheme.colors.primary
    }
  }
  
  return { styles, theme: currentTheme }
}

// 主题CSS类名生成器
export const useThemeClasses = () => {
  const { currentTheme } = useThemeContext()
  
  const getThemeClass = (baseClass: string = '') => {
    const classes = [baseClass, `theme-${currentTheme.id}`]
    
    if (currentTheme.isDark) {
      classes.push('dark-theme')
    }
    
    return classes.filter(Boolean).join(' ')
  }
  
  return { getThemeClass, themeId: currentTheme.id, isDark: currentTheme.isDark }
}

// 导出主题上下文
export { ThemeContext }
export default ThemeProvider
