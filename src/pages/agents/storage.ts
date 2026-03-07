export type AgentsViewMode = 'list' | 'card'

const AGENTS_VIEW_MODE_KEY = 'agents-view-mode'
const FALLBACK_KEY = 'agents-view-mode-fallback'
const DB_NAME = 'todo-for-ai-preferences'
const STORE_NAME = 'ui_preferences'

let dbPromise: Promise<IDBDatabase> | null = null

function openPreferencesDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'))
  })

  return dbPromise
}

export async function loadAgentsViewModeFromIndexedDb(): Promise<AgentsViewMode> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return 'list'
  }

  try {
    const db = await openPreferencesDb()

    const mode = await new Promise<AgentsViewMode | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(AGENTS_VIEW_MODE_KEY)

      request.onsuccess = () => {
        const value = request.result
        resolve(value === 'card' ? 'card' : value === 'list' ? 'list' : null)
      }
      request.onerror = () => reject(request.error || new Error('Failed to read IndexedDB value'))
    })

    if (mode) {
      return mode
    }
  } catch (error) {
    console.warn('Failed to load agents view mode from IndexedDB:', error)
  }

  try {
    const fallback = window.localStorage.getItem(FALLBACK_KEY)
    return fallback === 'card' ? 'card' : 'list'
  } catch (error) {
    console.warn('Failed to load fallback agents view mode from localStorage:', error)
    return 'list'
  }
}

export async function saveAgentsViewModeToIndexedDb(mode: AgentsViewMode): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return
  }

  try {
    const db = await openPreferencesDb()

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(mode, AGENTS_VIEW_MODE_KEY)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error || new Error('Failed to write IndexedDB value'))
    })
  } catch (error) {
    console.warn('Failed to save agents view mode to IndexedDB:', error)
  }

  try {
    window.localStorage.setItem(FALLBACK_KEY, mode)
  } catch (error) {
    console.warn('Failed to save fallback agents view mode to localStorage:', error)
  }
}
