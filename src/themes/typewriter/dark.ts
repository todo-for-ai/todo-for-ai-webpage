/**
 * 暗黑打字机主题 - Dark Typewriter Theme
 * 
 * 核心特点：
 * - 深色背景减少眼睛疲劳
 * - 荧光绿/青柠色文字
 * - 焦点行微光效果
 * - CRT显示器扫描线纹理
 * - 复古终端风格
 */
import type { TypewriterTheme } from '../../types/theme'
export const darkTypewriterTheme: TypewriterTheme = {
  id: 'typewriter-dark',
  name: '暗黑打字机',
  description: '复古终端风格的暗黑主题，荧光绿文字配合CRT扫描线效果',
  isDark: true,
  category: 'typewriter',
  tags: ['focus', 'dark', 'immersive', 'retro'],
  colors: {
    primary: '#00ff41', // 荧光绿
    secondary: '#00ffff', // 青色
    background: '#0a0a0a', // 深黑背景
    surface: '#1a1a1a', // 深灰表面
    textPrimary: '#00ff41', // 荧光绿文字
    textSecondary: '#00cc33', // 深绿文字
    textMuted: '#006600', // 暗绿文字
    border: '#333333', // 深灰边框
    divider: '#222222', // 分割线
    success: '#00ff00', // 亮绿
    warning: '#ffff00', // 黄色
    error: '#ff6b6b', // 珊瑚红
    info: '#00ffff', // 青色
    editorBackground: '#0a0a0a', // 深黑编辑器背景
    editorFocusBackground: '#1a1a1a', // 焦点行深灰背景
    editorBorder: '#333333', // 编辑器边框
    editorFocusBorder: '#00ff41', // 焦点边框荧光绿
    codeBackground: '#1a1a1a', // 深灰代码背景
    codeText: '#ffff00', // 黄色代码文字
    codeBlockBackground: '#0f0f0f', // 代码块背景
    codeBlockBorder: '#333333', // 代码块边框
    blockquoteBackground: '#1a1a1a', // 引用背景
    blockquoteBorder: '#00ff41', // 引用边框荧光绿
    blockquoteText: '#00cc33', // 引用文字
    linkColor: '#00ffff', // 青色链接
    linkHoverColor: '#66ffff', // 悬停浅青色
    selectionBackground: '#004400', // 深绿选中背景
    caretColor: '#00ff41' // 荧光绿光标
  },
  fonts: {
    fontFamily: '"Courier New", "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace',
    codeFontFamily: '"Courier New", "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace',
    fontSize: '16px',
    codeSize: '14px',
    h1Size: '28px',
    h2Size: '24px',
    h3Size: '20px',
    h4Size: '18px',
    h5Size: '16px',
    h6Size: '14px',
    fontWeight: '400',
    boldWeight: '700',
    headingWeight: '700',
    lineHeight: '1.6',
    headingLineHeight: '1.4',
    letterSpacing: '0.5px',
    headingLetterSpacing: '1px'
  },
  spacing: {
    unit: '8px',
    editorPadding: '40px 60px',
    paragraphMargin: '20px 0',
    headingMarginTop: '32px',
    headingMarginBottom: '16px',
    listMargin: '16px 0',
    listItemMargin: '8px 0',
    codeBlockMargin: '24px 0',
    codeBlockPadding: '16px 20px',
    blockquoteMargin: '24px 0',
    blockquotePadding: '16px 20px',
    tableMargin: '24px 0',
    tableCellPadding: '12px 16px'
  },
  borders: {
    borderWidth: '1px',
    focusBorderWidth: '2px',
    borderRadius: '2px',
    smallRadius: '1px',
    largeRadius: '4px',
    codeBlockRadius: '2px',
    blockquoteRadius: '2px'
  },
  shadows: {
    small: '0 1px 3px rgba(0, 255, 65, 0.2)',
    medium: '0 2px 6px rgba(0, 255, 65, 0.3)',
    large: '0 4px 12px rgba(0, 255, 65, 0.4)',
    editorShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
    editorHoverShadow: '0 0 20px rgba(0, 255, 65, 0.4)',
    editorFocusShadow: '0 0 30px rgba(0, 255, 65, 0.5)',
    codeBlockShadow: '0 0 5px rgba(0, 255, 65, 0.2)'
  },
  animations: {
    transitionDuration: '0.2s',
    fastTransition: '0.1s',
    slowTransition: '0.4s',
    easing: 'ease-out',
    typingGlow: '0 0 10px rgba(0, 255, 65, 0.8)',
    hoverTransform: 'none'
  },
  typewriterEffects: {
    focusLine: {
      enabled: true,
      highlightColor: '#1a1a1a',
      fadeDistance: 120,
      centerOnFocus: true,
      gradientIntensity: 0.8,
      markerColor: '#00ff41',
      markerWidth: '3px'
    },
    fadeEffect: {
      enabled: true,
      fadeOpacity: 0.2,
      fadeDistance: '180px',
      animationDuration: '0.2s',
      easing: 'ease-out'
    },
    visualEffects: {
      scanLines: true, // 启用CRT扫描线
      scanLineOpacity: 0.03,
      scanLineSpeed: '2s',
      paperTexture: null, // 不使用纸质纹理
      glowEffect: true, // 启用发光效果
      glowColor: '#00ff41',
      glowIntensity: 0.6,
      breathingCursor: true,
      breathingDuration: '1s',
      pageFlipAnimation: false,
      noiseTexture: true // 启用电子噪音纹理
    },
    dynamicEffects: {
      colorTemperature: false,
      autoAdjustBrightness: false,
      timeBasedTheme: false,
      smartFocus: true,
      paragraphExpansion: false
    },
    audioEffects: {
      enabled: false,
      typingSound: '/assets/sounds/typewriter-electronic.mp3',
      volume: 0.2,
      soundSet: 'modern'
    }
  }
}
export default darkTypewriterTheme
