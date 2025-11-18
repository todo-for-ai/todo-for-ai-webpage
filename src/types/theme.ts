/**
 * 主题相关类型定义
 */

// 基础主题接口
export interface Theme {
  id: string
  name: string
  description: string
  isDark: boolean
  colors: ThemeColors
  typography?: ThemeTypography
  effects?: ThemeEffects
  tags?: string[]
  category?: string
  borders?: {
    width?: string
    style?: string
    color?: string
    borderWidth?: string
    blockquoteRadius?: string
    codeBlockRadius?: string
    [key: string]: string | undefined
  }
  shadows?: {
    level1?: string
    level2?: string
    level3?: string
    small?: string
    editorShadow?: string
    editorFocusShadow?: string
    codeBlockShadow?: string
    [key: string]: string | undefined
  }
  fonts?: {
    body?: string
    heading?: string
    monospace?: string
    fontFamily?: string
    codeFontFamily?: string
    fontSize?: string
    codeSize?: string
    h1Size?: string
    h2Size?: string
    h3Size?: string
    h4Size?: string
    h5Size?: string
    h6Size?: string
    fontWeight?: string
    boldWeight?: string
    headingWeight?: string
    lineHeight?: string
    headingLineHeight?: string
    letterSpacing?: string
    headingLetterSpacing?: string
    [key: string]: string | undefined
  }
  spacing?: {
    [key: string]: string
  }
  animations?: {
    [key: string]: string
  }
}

// 主题颜色配置
export interface ThemeColors {
  // 主要颜色
  primary: string
  secondary: string

  // 背景色
  background: string
  surface: string
  overlay?: string
  editorBackground?: string
  editorBorder?: string
  editorFocusBackground?: string
  editorFocusBorder?: string

  // 文本色
  textPrimary: string
  textSecondary: string
  textMuted?: string

  // 边框和分割线
  border: string
  divider?: string

  // 状态色
  success: string
  warning: string
  error: string
  info?: string

  // 特殊元素
  highlight?: string
  selection?: string

  // 交互状态
  hover?: string
  active?: string
  focus?: string

  // 代码相关
  codeBackground?: string
  codeText?: string
  codeBlockBackground?: string
  codeBlockBorder?: string

  // 引用块相关
  blockquoteBackground?: string
  blockquoteBorder?: string
  blockquoteText?: string

  // 链接相关
  linkColor?: string
  linkHoverColor?: string

  // 选择和插入符
  selectionBackground?: string
  caretColor?: string

  // 允许其他自定义属性
  [key: string]: string | undefined
}

// 主题字体配置
export interface ThemeTypography {
  fontFamily?: {
    base?: string
    mono?: string
    display?: string
  }
  fontSize?: {
    xs?: string
    sm?: string
    base?: string
    lg?: string
    xl?: string
    '2xl'?: string
    '3xl'?: string
  }
  fontWeight?: {
    normal?: number
    medium?: number
    semibold?: number
    bold?: number
  }
  lineHeight?: {
    tight?: number
    normal?: number
    relaxed?: number
  }
}

// 主题特效配置
export interface ThemeEffects {
  shadow?: {
    sm?: string
    base?: string
    md?: string
    lg?: string
    xl?: string
  }
  borderRadius?: {
    sm?: string
    base?: string
    md?: string
    lg?: string
    full?: string
  }
  animation?: {
    duration?: {
      fast?: string
      normal?: string
      slow?: string
    }
    easing?: string
  }
}

// 打字机主题
export interface TypewriterTheme extends Theme {
  typewriter?: {
    fontFamily: string
    fontSize: number
    lineHeight: number
    letterSpacing: number
    cursorColor: string
    caretColor?: string
    backgroundColor: string
    textColor: string
    effects?: {
      caretBlink?: boolean
      textReveal?: boolean
      noise?: boolean
      paperTexture?: boolean
    }
  }
  typewriterEffects?: {
    [key: string]: any
  }
}

// 主题类别
export type ThemeCategory = 'modern' | 'classic' | 'minimal' | 'vintage' | 'colorful' | 'dark' | 'light' | 'typewriter' | 'handwriting'

// 主题标签
export type ThemeTag = 'typewriter' | 'handwriting' | 'minimal' | 'dark' | 'colorful' | 'professional' | 'casual'

// 主题过滤器
export interface ThemeFilter {
  category?: ThemeCategory
  tags?: ThemeTag[]
  isDark?: boolean
  search?: string
}

// 主题注册信息
export interface ThemeRegistration {
  theme: Theme
  assets?: ThemeAssets
  metadata?: {
    author?: string
    version?: string
    license?: string
    homepage?: string
  }
}

// 主题资源
export interface ThemeAssets {
  fonts?: string[]
  images?: string[]
  sounds?: string[]
}

// 主题管理器配置
export interface ThemeManagerConfig {
  enablePersistence: boolean
  enableDynamicLoading: boolean
  enableTypewriterEffects: boolean
  enableAudioEffects: boolean
  defaultCategory: ThemeCategory
  maxCachedThemes: number
}

// 主题变更事件
export interface ThemeChangeEvent {
  previousTheme: Theme | null
  currentTheme: Theme
  timestamp: number
  reason: 'init' | 'user' | 'system' | 'auto'
}

// Theme上下文类型
export interface ThemeContextType {
  currentTheme: Theme | null
  availableThemes: Theme[]
  setTheme: (themeId: string) => Promise<boolean>
  isDarkMode: boolean
  toggleDarkMode: () => void
  getThemesByCategory: (category: ThemeCategory) => Theme[]
  getThemesByTag: (tag: ThemeTag) => Theme[]
  registerTheme: (registration: ThemeRegistration) => void
  unregisterTheme: (themeId: string) => boolean
  isTypewriterTheme: (themeId: string) => boolean
}

// Theme选项类型
export type ThemeOptions = {
  enablePersistence?: boolean
  defaultThemeId?: string
  followSystemDarkMode?: boolean
  storageKey?: string
}

// Theme变更监听器类型
export type ThemeChangeListener = (event: ThemeChangeEvent) => void
