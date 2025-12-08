/**
 * 主题管理器 - 负责主题的注册、加载、切换和管理
 */
import type { Theme, ThemeManagerConfig, ThemeChangeEvent } from './types'
import { DEFAULT_CONFIG } from './constants'
import { ThemeManagerCore } from './ThemeManagerCore'
import { ThemeRegistry } from './ThemeRegistry'
import { ThemePersistence } from './ThemePersistence'
import { ThemeChangeListeners } from './ThemeChangeListeners'

export class ThemeManager {
  private core: ThemeManagerCore
  private registry: ThemeRegistry
  private persistence: ThemePersistence
  private listeners: ThemeChangeListeners

  constructor(config: Partial<ThemeManagerConfig> = {}) {
    this.core = new ThemeManagerCore(config)
    this.registry = new ThemeRegistry()
    this.persistence = new ThemePersistence()
    this.listeners = new ThemeChangeListeners()
  }

  registerTheme(id: string, theme: Theme): void {
    this.registry.register(id, theme)
  }

  loadTheme(id: string): Promise<Theme> {
    return this.core.loadTheme(id, this.registry)
  }

  applyTheme(theme: Theme): void {
    this.core.applyTheme(theme, this.listeners)
  }

  getCurrentTheme(): Theme | null {
    return this.core.getCurrentTheme()
  }

  subscribe(listener: (event: ThemeChangeEvent) => void): () => void {
    return this.listeners.subscribe(listener)
  }

  persist(): void {
    this.persistence.persist(this.core.getCurrentTheme())
  }

  loadPersisted(): Promise<void> {
    return this.persistence.load().then(theme => {
      if (theme) {
        this.loadTheme(theme.id).then(this.core.applyTheme.bind(this.core))
      }
    })
  }
}

export * from './types'
export * from './constants'
