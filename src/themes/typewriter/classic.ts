/**
 * 经典打字机主题 - Classic Typewriter Theme
 * 
 * 核心特点：
 * - 焦点行高亮（当前编辑行居中+上下渐变淡化）
 * - 仿纸质背景（米黄/浅灰纹理）
 * - 等宽字体（Courier New, Monaco）
 * - 段落两侧留白（模拟纸张边界）
 * - 打字机音效支持（可选）
 */
import type { TypewriterTheme } from '../../types/theme'
export const classicTypewriterTheme: TypewriterTheme = {
  id: 'typewriter-classic',
  name: '经典打字机',
  description: '模拟传统打字机的经典体验，专注写作的沉浸式环境',
  isDark: false,
  category: 'typewriter',
  tags: ['focus', 'retro', 'immersive'],
  colors: {
    primary: '#d2691e', // 橙棕色
    secondary: '#8b4513', // 深棕色
    background: '#f5f5dc', // 米黄色背景
    surface: '#ffffff', // 纯白表面
    textPrimary: '#2c2c2c', // 深灰文字
    textSecondary: '#4a4a4a', // 中灰文字
    textMuted: '#808080', // 浅灰文字
    border: '#d3d3d3', // 浅灰边框
    divider: '#e6e6e6', // 分割线
    success: '#228b22', // 森林绿
    warning: '#daa520', // 金黄色
    error: '#b22222', // 火砖红
    info: '#4682b4', // 钢蓝色
    editorBackground: '#f5f5dc', // 米黄色编辑器背景
    editorFocusBackground: '#ffffff', // 焦点行纯白背景
    editorBorder: '#d3d3d3', // 编辑器边框
    editorFocusBorder: '#d2691e', // 焦点边框
    codeBackground: '#f0f0f0', // 浅灰代码背景
    codeText: '#8b0000', // 深红代码文字
    codeBlockBackground: '#f8f8f8', // 代码块背景
    codeBlockBorder: '#d3d3d3', // 代码块边框
    blockquoteBackground: '#f9f9f9', // 引用背景
    blockquoteBorder: '#d2691e', // 引用边框（橙棕色）
    blockquoteText: '#555555', // 引用文字
    linkColor: '#b8860b', // 深金色链接
    linkHoverColor: '#daa520', // 悬停金黄色
    selectionBackground: '#ffe4b5', // 浅橙色选中背景
    caretColor: '#d2691e' // 橙棕色光标
  },
  fonts: {
    fontFamily: '"Courier New", "Monaco", "Menlo", "Ubuntu Mono", monospace',
    codeFontFamily: '"Courier New", "Monaco", "Menlo", "Ubuntu Mono", monospace',
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
    lineHeight: '1.8',
    headingLineHeight: '1.4',
    letterSpacing: '0.5px',
    headingLetterSpacing: '1px'
  },
  spacing: {
    unit: '8px',
    editorPadding: '60px 80px',
    paragraphMargin: '24px 0',
    headingMarginTop: '32px',
    headingMarginBottom: '16px',
    listMargin: '16px 0',
    listItemMargin: '8px 0',
    codeBlockMargin: '24px 0',
    codeBlockPadding: '16px 20px',
    blockquoteMargin: '24px 0',
    blockquotePadding: '16px 20px 16px 40px',
    tableMargin: '24px 0',
    tableCellPadding: '12px 16px'
  },
  borders: {
    borderWidth: '1px',
    focusBorderWidth: '2px',
    borderRadius: '4px',
    smallRadius: '2px',
    largeRadius: '8px',
    codeBlockRadius: '4px',
    blockquoteRadius: '4px'
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 2px 6px rgba(0, 0, 0, 0.15)',
    large: '0 4px 12px rgba(0, 0, 0, 0.2)',
    editorShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    editorHoverShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    editorFocusShadow: '0 0 8px rgba(210, 105, 30, 0.3)',
    codeBlockShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  animations: {
    transitionDuration: '0.3s',
    fastTransition: '0.15s',
    slowTransition: '0.6s',
    easing: 'ease-out',
    typingGlow: '0 0 5px rgba(210, 105, 30, 0.5)',
    hoverTransform: 'translateY(-1px)'
  },
  typewriterEffects: {
    focusLine: {
      enabled: true,
      highlightColor: '#ffffff',
      fadeDistance: 150, // 渐变淡化距离（像素）
      centerOnFocus: true, // 焦点行居中
      gradientIntensity: 0.7, // 渐变强度
      markerColor: '#d2691e', // 左侧标记颜色
      markerWidth: '4px' // 左侧标记宽度
    },
    fadeEffect: {
      enabled: true,
      fadeOpacity: 0.3, // 非焦点内容透明度
      fadeDistance: '200px', // 淡化距离
      animationDuration: '0.3s', // 动画持续时间
      easing: 'ease-out' // 缓动函数
    },
    visualEffects: {
      scanLines: false, // 不使用扫描线（现代打字机风格）
      paperTexture: '/assets/textures/paper-texture.png', // 纸质纹理
      glowEffect: false, // 不使用发光效果
      breathingCursor: true, // 呼吸灯光标
      breathingDuration: '1.5s', // 呼吸周期
      pageFlipAnimation: true, // 翻页动画
      noiseTexture: false // 不使用噪点纹理
    },
    dynamicEffects: {
      colorTemperature: false, // 不使用色温调节
      autoAdjustBrightness: false, // 不自动调节亮度
      timeBasedTheme: false, // 不使用时间主题
      smartFocus: true, // 智能焦点
      paragraphExpansion: false // 不使用段落展开
    },
    audioEffects: {
      enabled: false, // 默认关闭音效
      typingSound: '/assets/sounds/typewriter-classic.mp3',
      volume: 0.3,
      soundSet: 'vintage'
    }
  }
}
export default classicTypewriterTheme
