import { createAvatar } from '@dicebear/core'
import {
  adventurerNeutral,
  botttsNeutral,
  funEmoji,
  loreleiNeutral,
  pixelArtNeutral,
  thumbs,
} from '@dicebear/collection'

const BUILTIN_AVATAR_PREFIX = 'dicebear:'
const BUILTIN_AVATAR_SIZE = 128
const BUILTIN_AVATAR_COUNT = 500
const LOCAL_AVATAR_TOKEN_PREFIX = 'todo-for-ai:avatar-token:'

const BUILTIN_STYLE_MAP = {
  adventurerNeutral,
  botttsNeutral,
  funEmoji,
  loreleiNeutral,
  pixelArtNeutral,
  thumbs,
} as const

const BUILTIN_STYLE_SEQUENCE = [
  'adventurerNeutral',
  'botttsNeutral',
  'funEmoji',
  'loreleiNeutral',
  'pixelArtNeutral',
  'thumbs',
] as const

const BUILTIN_STYLE_LABELS: Record<BuiltinAvatarStyle, string> = {
  adventurerNeutral: 'Adventurer',
  botttsNeutral: 'Bottts',
  funEmoji: 'Emoji',
  loreleiNeutral: 'Lorelei',
  pixelArtNeutral: 'Pixel',
  thumbs: 'Thumbs',
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
