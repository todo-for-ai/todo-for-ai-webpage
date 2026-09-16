/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAvatar } from '@dicebear/core'
import {
  adventurer, adventurerNeutral,
  avataaars, avataaarsNeutral,
  bigEars, bigEarsNeutral, bigSmile,
  bottts, botttsNeutral,
  croodles, croodlesNeutral,
  dylan,
  funEmoji,
  lorelei, loreleiNeutral,
  micah, miniavs,
  notionists, notionistsNeutral,
  openPeeps,
  personas,
  pixelArt, pixelArtNeutral,
  thumbs,
  toonHead,
} from '@dicebear/collection'

const BUILTIN_AVATAR_PREFIX = 'dicebear:'
const BUILTIN_AVATAR_SIZE = 128
const BUILTIN_AVATAR_COUNT = 1000
const LOCAL_AVATAR_TOKEN_PREFIX = 'todo-for-ai:avatar-token:'

const BUILTIN_STYLE_MAP = {
  adventurer, adventurerNeutral,
  avataaars, avataaarsNeutral,
  bigEars, bigEarsNeutral, bigSmile,
  bottts, botttsNeutral,
  croodles, croodlesNeutral,
  dylan,
  funEmoji,
  lorelei, loreleiNeutral,
  micah, miniavs,
  notionists, notionistsNeutral,
  openPeeps,
  personas,
  pixelArt, pixelArtNeutral,
  thumbs,
  toonHead,
} as const

/** 形象分类（面向用户的筛选维度） */
export const AVATAR_CATEGORY_ROBOT = 'robot'
export const AVATAR_CATEGORY_CUTE = 'cute'
export const AVATAR_CATEGORY_PEOPLE = 'people'
export const AVATAR_CATEGORY_PIXEL = 'pixel'

export const AVATAR_CATEGORIES: Array<{ key: string; label: string; styles: string[] }> = [
  {
    key: AVATAR_CATEGORY_ROBOT,
    label: '机器人',
    styles: ['bottts', 'botttsNeutral', 'thumbs'],
  },
  {
    key: AVATAR_CATEGORY_CUTE,
    label: '萌趣卡通',
    styles: ['bigSmile', 'funEmoji', 'toonHead', 'croodles', 'croodlesNeutral', 'micah', 'miniavs', 'bigEars', 'bigEarsNeutral', 'personas'],
  },
  {
    key: AVATAR_CATEGORY_PEOPLE,
    label: '人物插画',
    styles: ['adventurer', 'adventurerNeutral', 'avataaars', 'avataaarsNeutral', 'dylan', 'lorelei', 'loreleiNeutral', 'notionists', 'notionistsNeutral', 'openPeeps'],
  },
  {
    key: AVATAR_CATEGORY_PIXEL,
    label: '像素复古',
    styles: ['pixelArt', 'pixelArtNeutral'],
  },
]

const BUILTIN_STYLE_SEQUENCE = [
  // 交错排列：连续翻页时风格始终多样
  'bottts', 'bigSmile', 'avataaars', 'pixelArt',
  'funEmoji', 'toonHead', 'adventurer', 'pixelArtNeutral',
  'botttsNeutral', 'croodles', 'lorelei', 'thumbs',
  'micah', 'personas', 'avataaarsNeutral', 'bigEars',
  'croodlesNeutral', 'dylan', 'notionists', 'bigEarsNeutral',
  'loreleiNeutral', 'notionistsNeutral', 'adventurerNeutral', 'miniavs', 'openPeeps',
] as const

const BUILTIN_STYLE_LABELS: Record<BuiltinAvatarStyle, string> = {
  adventurer: 'Adventurer',
  adventurerNeutral: 'Adventurer·N',
  avataaars: 'Avataaars',
  avataaarsNeutral: 'Avataaars·N',
  bigEars: 'Big Ears',
  bigEarsNeutral: 'Big Ears·N',
  bigSmile: 'Big Smile',
  bottts: 'Bottts',
  botttsNeutral: 'Bottts·N',
  croodles: 'Croodles',
  croodlesNeutral: 'Croodles·N',
  dylan: 'Dylan',
  funEmoji: 'Emoji',
  lorelei: 'Lorelei',
  loreleiNeutral: 'Lorelei·N',
  micah: 'Micah',
  miniavs: 'Miniavs',
  notionists: 'Notionists',
  notionistsNeutral: 'Notionists·N',
  openPeeps: 'Open Peeps',
  personas: 'Personas',
  pixelArt: 'Pixel',
  pixelArtNeutral: 'Pixel·N',
  thumbs: 'Thumbs',
  toonHead: 'Toon Head',
}

const BUILTIN_SEED_WORDS = [
  'Aster',
  'Nova',
  'Maple',
  'Orbit',
  'Luna',
  'River',
  'Comet',
  'Mint',
  'Cedar',
  'Coral',
  'Flare',
  'Echo',
  'Aurora',
  'Nimbus',
  'Harbor',
  'Cobalt',
  'Jade',
  'Ember',
  'Willow',
  'Frost',
  'Canyon',
  'Sierra',
  'Prism',
  'Sable',
] as const

const avatarSrcCache = new Map<string, string>()

export type BuiltinAvatarStyle = keyof typeof BUILTIN_STYLE_MAP

export interface BuiltinAvatarOption {
  token: string
  style: BuiltinAvatarStyle
  seed: string
  label: string
  category: string
}

const categoryOfStyle = (style: string): string => {
  const hit = AVATAR_CATEGORIES.find((c) => c.styles.includes(style))
  return hit ? hit.key : AVATAR_CATEGORY_CUTE
}

const getAvatarTokenStorageKey = (userId: number | string): string => {
  return `${LOCAL_AVATAR_TOKEN_PREFIX}${userId}`
}

const parseBuiltinAvatarToken = (avatarValue?: string | null): { style: BuiltinAvatarStyle; seed: string } | null => {
  if (!avatarValue || !avatarValue.startsWith(BUILTIN_AVATAR_PREFIX)) {
    return null
  }

  const payload = avatarValue.slice(BUILTIN_AVATAR_PREFIX.length)
  const separatorIndex = payload.indexOf(':')
  if (separatorIndex < 0) {
    return null
  }

  const styleName = payload.slice(0, separatorIndex) as BuiltinAvatarStyle
  if (!(styleName in BUILTIN_STYLE_MAP)) {
    return null
  }

  const encodedSeed = payload.slice(separatorIndex + 1)
  if (!encodedSeed) {
    return null
  }

  try {
    return {
      style: styleName,
      seed: decodeURIComponent(encodedSeed),
    }
  } catch {
    return null
  }
}

const renderBuiltinAvatar = (style: BuiltinAvatarStyle, seed: string): string => {
  const cacheKey = `${style}:${seed}`
  const cached = avatarSrcCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const source = createAvatar(BUILTIN_STYLE_MAP[style] as any, {
    seed,
    size: BUILTIN_AVATAR_SIZE,
  } as any).toDataUri()

  avatarSrcCache.set(cacheKey, source)
  return source
}

export const createBuiltinAvatarToken = (style: BuiltinAvatarStyle, seed: string): string => {
  return `${BUILTIN_AVATAR_PREFIX}${style}:${encodeURIComponent(seed)}`
}

export const getStoredAvatarToken = (userId?: number | string): string | null => {
  if (!userId || typeof window === 'undefined') {
    return null
  }

  try {
    const value = window.localStorage.getItem(getAvatarTokenStorageKey(userId))
    return value && value.startsWith(BUILTIN_AVATAR_PREFIX) ? value : null
  } catch {
    return null
  }
}

export const setStoredAvatarToken = (userId: number | string, token: string): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(getAvatarTokenStorageKey(userId), token)
  } catch {
    // ignore storage errors
  }
}

export const clearStoredAvatarToken = (userId: number | string): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(getAvatarTokenStorageKey(userId))
  } catch {
    // ignore storage errors
  }
}

export const resolveUserAvatarSrc = (avatarUrl: string | null | undefined, fallbackSeed = 'todo-for-ai-user'): string => {
  const parsed = parseBuiltinAvatarToken(avatarUrl)
  if (parsed) {
    return renderBuiltinAvatar(parsed.style, parsed.seed)
  }

  if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
    return avatarUrl.trim()
  }

  return renderBuiltinAvatar('botttsNeutral', fallbackSeed)
}

/**
 * Agent 形象解析：avatar_url 已配置（http/storage/dicebear token）时用之；
 * 否则按 Agent 身份（id+name）从内置形象库确定性取一个——同一 Agent 永远同一张脸，
 * 不同 Agent 大概率不同脸，协作图/时间线/列表里一眼认出"这是哪个 Agent"。
 */
export const resolveAgentAvatarSrc = (
  avatarUrl: string | null | undefined,
  agentName?: string,
  agentId?: number,
): string => {
  if (avatarUrl && avatarUrl.trim()) {
    return resolveUserAvatarSrc(avatarUrl)
  }
  const parsed = parseBuiltinAvatarToken(getAutoAgentAvatarToken(agentName, agentId))
  if (parsed) {
    return renderBuiltinAvatar(parsed.style, parsed.seed)
  }
  return renderBuiltinAvatar('botttsNeutral', `${agentId ?? 0}-${agentName ?? 'agent'}`)
}

/** 稳定字符串哈希（djb2），用于把 Agent 身份映射到形象库下标 */
const stableHash = (input: string): number => {
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Agent 自动形象分配：按身份从内置形象库确定性挑一个 token。
 * 用户选过头像（avatar_url 非空）时不会被覆盖；创建 Agent 时可直接预填此 token。
 */
export const getAutoAgentAvatarToken = (agentName?: string, agentId?: number): string => {
  const pool = getBuiltinAvatarOptions(`agent-${agentId ?? 0}-${agentName ?? ''}`)
  const index = stableHash(`${agentId ?? 0}:${agentName ?? 'agent'}`) % pool.length
  return pool[index].token
}

export const getBuiltinAvatarOptions = (identitySeed: string): BuiltinAvatarOption[] => {
  const options: BuiltinAvatarOption[] = []
  const tokenSet = new Set<string>()
  let index = 0

  while (options.length < BUILTIN_AVATAR_COUNT) {
    const style = BUILTIN_STYLE_SEQUENCE[index % BUILTIN_STYLE_SEQUENCE.length]
    const word = BUILTIN_SEED_WORDS[index % BUILTIN_SEED_WORDS.length]
    const variant = Math.floor(index / BUILTIN_SEED_WORDS.length) + 1
    const seed = `${identitySeed}-${word}-${style}-${variant}`
    const token = createBuiltinAvatarToken(style, seed)

    if (!tokenSet.has(token)) {
      tokenSet.add(token)
      options.push({
        token,
        style,
        seed,
        label: `${BUILTIN_STYLE_LABELS[style]} ${options.length + 1}`,
        category: categoryOfStyle(style),
      })
    }

    index += 1
  }

  return options
}

export const pickRandomBuiltinAvatar = (
  options: BuiltinAvatarOption[],
  currentAvatarUrl?: string | null
): BuiltinAvatarOption | null => {
  if (!options.length) {
    return null
  }

  const candidates = options.filter((option) => option.token !== (currentAvatarUrl || ''))
  const targetPool = candidates.length ? candidates : options
  const randomIndex = Math.floor(Math.random() * targetPool.length)
  return targetPool[randomIndex] || null
}
