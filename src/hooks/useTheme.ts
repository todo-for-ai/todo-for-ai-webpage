import { useState, useCallback, useEffect } from 'react'
import type {
  Theme,
  ThemeCategory,
  ThemeTag,
  ThemeContextType,
  ThemeOptions,
  ThemeRegistration
} from '../types/theme'
import { themes, getThemeById, getDefaultTheme } from '../themes/presets'

export const useTheme = (options?: ThemeOptions): ThemeContextType => {
  const enablePersistence = options?.enablePersistence ?? true
  const defaultThemeId = options?.defaultThemeId ?? 'default'
  const followSystemDarkMode = options?.followSystemDarkMode ?? false
  const storageKey = options?.storageKey ?? 'milkdown-theme-id'

  const resolveInitialTheme = useCallback((): Theme => {
    const defaultTheme = getThemeById(defaultThemeId) || getDefaultTheme()

    if (typeof window === 'undefined') {
      return defaultTheme
    }

    if (enablePersistence) {
      const savedThemeId = window.localStorage.getItem(storageKey)
      if (savedThemeId) {
        const savedTheme = getThemeById(savedThemeId)
        if (savedTheme) {
          return savedTheme
        }
      }
    }

    if (followSystemDarkMode && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return getThemeById('dark') || themes.find(theme => theme.isDark) || defaultTheme
    }

    return defaultTheme
  }, [defaultThemeId, enablePersistence, followSystemDarkMode, storageKey])

  const [currentTheme, setCurrentTheme] = useState<Theme | null>(resolveInitialTheme)
  const [availableThemes, setAvailableThemes] = useState<Theme[]>(themes)
  const [isDarkMode, setIsDarkMode] = useState(() => resolveInitialTheme().isDark)

  const setTheme = useCallback(async (themeId: string): Promise<boolean> => {
    const targetTheme = availableThemes.find(theme => theme.id === themeId)
    if (!targetTheme) {
      return false
    }

    setCurrentTheme(targetTheme)
    setIsDarkMode(targetTheme.isDark)

    if (enablePersistence && typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, targetTheme.id)
    }

    return true
  }, [availableThemes, enablePersistence, storageKey])

  const toggleDarkMode = useCallback(() => {
    const shouldUseDark = !isDarkMode
    const fallbackTheme = getThemeById(defaultThemeId) || getDefaultTheme()
    const targetTheme = shouldUseDark
      ? availableThemes.find(theme => theme.id === 'dark') || availableThemes.find(theme => theme.isDark) || fallbackTheme
      : availableThemes.find(theme => theme.id === defaultThemeId) || availableThemes.find(theme => !theme.isDark) || fallbackTheme

    setCurrentTheme(targetTheme)
    setIsDarkMode(targetTheme.isDark)

    if (enablePersistence && typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, targetTheme.id)
    }
  }, [availableThemes, defaultThemeId, enablePersistence, isDarkMode, storageKey])

  const getThemesByCategory = useCallback((category: ThemeCategory): Theme[] => {
    return availableThemes.filter(theme => theme.category === category || theme.tags?.includes(category as ThemeTag))
  }, [availableThemes])

  const getThemesByTag = useCallback((tag: ThemeTag): Theme[] => {
    return availableThemes.filter(theme => theme.tags?.includes(tag))
  }, [availableThemes])

  const registerTheme = useCallback((registration: ThemeRegistration) => {
    const nextTheme = registration.theme
    setAvailableThemes(prevThemes => {
      const exists = prevThemes.some(theme => theme.id === nextTheme.id)
      if (exists) {
        return prevThemes.map(theme => (theme.id === nextTheme.id ? nextTheme : theme))
      }
      return [...prevThemes, nextTheme]
    })
  }, [])

  const unregisterTheme = useCallback((themeId: string): boolean => {
    const isBuiltInTheme = themes.some(theme => theme.id === themeId)
    if (isBuiltInTheme) {
      return false
    }

    setAvailableThemes(prevThemes => prevThemes.filter(theme => theme.id !== themeId))

    if (currentTheme?.id === themeId) {
      const fallbackTheme = getThemeById(defaultThemeId) || getDefaultTheme()
      setCurrentTheme(fallbackTheme)
      setIsDarkMode(fallbackTheme.isDark)
      if (enablePersistence && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, fallbackTheme.id)
      }
    }

    return true
  }, [currentTheme?.id, defaultThemeId, enablePersistence, storageKey])

  const isTypewriterTheme = useCallback((themeId: string): boolean => {
    const targetTheme = availableThemes.find(theme => theme.id === themeId)
    if (!targetTheme) {
      return false
    }
    return (
      targetTheme.category === 'typewriter' ||
      targetTheme.tags?.includes('typewriter') === true ||
      themeId.startsWith('typewriter-')
    )
  }, [availableThemes])

  useEffect(() => {
    if (currentTheme || availableThemes.length === 0) {
      return
    }
    const fallbackTheme = getThemeById(defaultThemeId) || availableThemes[0]
    setCurrentTheme(fallbackTheme)
    setIsDarkMode(fallbackTheme.isDark)
  }, [availableThemes, currentTheme, defaultThemeId])

  return {
    currentTheme,
    availableThemes,
    setTheme,
    isDarkMode,
    toggleDarkMode,
    getThemesByCategory,
    getThemesByTag,
    registerTheme,
    unregisterTheme,
    isTypewriterTheme
  }
}
