import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { contextRulesApi } from '../api/contextRules'
import type {
  ContextRule,
  ContextRuleQueryParams,
  CreateContextRuleData,
  UpdateContextRuleData
} from '../api/contextRules'

interface ContextRulePagination {
  page: number
  per_page: number
  total: number
  pages: number
  has_prev: boolean
  has_next: boolean
}

interface ContextRuleState {
  contextRules: ContextRule[]
  currentContextRule: ContextRule | null
  loading: boolean
  error: string | null
  pagination: ContextRulePagination | null
  queryParams: ContextRuleQueryParams

  previewContent: string
  previewRules: ContextRule[]
  previewLoading: boolean

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setQueryParams: (params: Partial<ContextRuleQueryParams>) => void

  fetchContextRules: () => Promise<void>
  fetchContextRule: (id: number) => Promise<void>
  createContextRule: (data: CreateContextRuleData) => Promise<ContextRule | null>
  updateContextRule: (id: number, data: UpdateContextRuleData) => Promise<ContextRule | null>
  deleteContextRule: (id: number) => Promise<boolean>
  toggleContextRule: (id: number, isActive: boolean) => Promise<boolean>
  copyContextRule: (id: number, data: { name: string; project_id?: number }) => Promise<ContextRule | null>
  copyRuleFromMarketplace: (
    id: number,
    data: { name: string; copy_as_global: boolean; target_project_id?: number }
  ) => Promise<ContextRule | null>

  previewMergedRules: (projectId?: number) => Promise<void>
  getMergedContextRules: (projectId?: number) => Promise<{ content: string; rules: ContextRule[] } | null>

  clearError: () => void
  reset: () => void
}

const initialQueryParams: ContextRuleQueryParams = {
  page: 1,
  per_page: 20,
  sort_by: 'priority',
  sort_order: 'desc',
}

const initialState: Pick<
  ContextRuleState,
  | 'contextRules'
  | 'currentContextRule'
  | 'loading'
  | 'error'
  | 'pagination'
  | 'queryParams'
  | 'previewContent'
  | 'previewRules'
  | 'previewLoading'
> = {
  contextRules: [],
  currentContextRule: null,
  loading: false,
  error: null,
  pagination: null,
  queryParams: initialQueryParams,
  previewContent: '',
  previewRules: [],
  previewLoading: false,
}

const parseContextRuleList = (
  payload: any
): { items: ContextRule[]; pagination: ContextRulePagination | null } => {
  if (!payload || typeof payload !== 'object') {
    return { items: [], pagination: null }
  }

  if (Array.isArray(payload)) {
    return { items: payload as ContextRule[], pagination: null }
  }

  if (Array.isArray(payload.items)) {
    return {
      items: payload.items as ContextRule[],
      pagination: (payload.pagination as ContextRulePagination) || null,
    }
  }

  if (Array.isArray(payload.data)) {
    return {
      items: payload.data as ContextRule[],
      pagination: (payload.pagination as ContextRulePagination) || null,
    }
  }

  return { items: [], pagination: (payload.pagination as ContextRulePagination) || null }
}

const parseSingleContextRule = (payload: any): ContextRule | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  if ('id' in payload) {
    return payload as ContextRule
  }
  if (payload.item && typeof payload.item === 'object' && 'id' in payload.item) {
    return payload.item as ContextRule
  }
  if (payload.rule && typeof payload.rule === 'object' && 'id' in payload.rule) {
    return payload.rule as ContextRule
  }
  return null
}

export const useContextRuleStore = create<ContextRuleState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setQueryParams: (params) =>
        set((state) => ({
          queryParams: { ...state.queryParams, ...params }
        })),

      fetchContextRules: async () => {
        const { queryParams } = get()
        set({ loading: true, error: null })

        try {
          const response = await contextRulesApi.getContextRules(queryParams)
          const parsed = parseContextRuleList(response)
          set({
            contextRules: parsed.items,
            pagination: parsed.pagination,
            loading: false,
          })
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to fetch context rules',
            loading: false,
          })
          throw error
        }
      },

      fetchContextRule: async (id) => {
        set({ loading: true, error: null })

        try {
          const response = await contextRulesApi.getContextRule(id)
          set({
            currentContextRule: parseSingleContextRule(response),
            loading: false,
          })
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to fetch context rule',
            loading: false,
          })
          throw error
        }
      },

      createContextRule: async (data) => {
        set({ loading: true, error: null })

        try {
          const response = await contextRulesApi.createContextRule(data)
          const newRule = parseSingleContextRule(response)

          if (newRule) {
            set((state) => ({
              contextRules: [newRule, ...state.contextRules],
              loading: false,
            }))
            return newRule
          }

          set({ loading: false })
          return null
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to create context rule',
            loading: false,
          })
          throw error
        }
      },

      updateContextRule: async (id, data) => {
        set({ loading: true, error: null })

        try {
          const response = await contextRulesApi.updateContextRule(id, data)
          const updatedRule = parseSingleContextRule(response)

          if (updatedRule) {
            set((state) => ({
              contextRules: state.contextRules.map((rule) => (rule.id === id ? updatedRule : rule)),
              currentContextRule: state.currentContextRule?.id === id ? updatedRule : state.currentContextRule,
              loading: false,
            }))
            return updatedRule
          }

          set({ loading: false })
          return null
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to update context rule',
            loading: false,
          })
          throw error
        }
      },

      deleteContextRule: async (id) => {
        set({ loading: true, error: null })

        try {
          await contextRulesApi.deleteContextRule(id)
          set((state) => ({
            contextRules: state.contextRules.filter((rule) => rule.id !== id),
            currentContextRule: state.currentContextRule?.id === id ? null : state.currentContextRule,
            loading: false,
          }))
          return true
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to delete context rule',
            loading: false,
          })
          return false
        }
      },

      toggleContextRule: async (id, isActive) => {
        try {
          const response = await contextRulesApi.toggleContextRule(id, isActive)
          const updatedRule = parseSingleContextRule(response)

          if (updatedRule) {
            set((state) => ({
              contextRules: state.contextRules.map((rule) => (rule.id === id ? updatedRule : rule)),
              currentContextRule: state.currentContextRule?.id === id ? updatedRule : state.currentContextRule,
            }))
            return true
          }
          return false
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to toggle context rule status',
          })
          return false
        }
      },

      copyContextRule: async (id, data) => {
        set({ loading: true, error: null })

        try {
          const response = await contextRulesApi.copyContextRule(id, data)
          const newRule = parseSingleContextRule(response)

          if (newRule) {
            set((state) => ({
              contextRules: [newRule, ...state.contextRules],
              loading: false,
            }))
            return newRule
          }

          set({ loading: false })
          return null
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to copy context rule',
            loading: false,
          })
          return null
        }
      },

      copyRuleFromMarketplace: async (id, data) => {
        set({ loading: true, error: null })

        try {
          const response = await contextRulesApi.copyRuleFromMarketplace(id, data)
          const newRule = parseSingleContextRule(response)

          if (newRule) {
            set((state) => ({
              contextRules: [newRule, ...state.contextRules],
              loading: false,
            }))
            return newRule
          }

          set({ loading: false })
          return null
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to copy rule from marketplace',
            loading: false,
          })
          return null
        }
      },

      previewMergedRules: async (projectId) => {
        set({ previewLoading: true, error: null })

        try {
          const response = await contextRulesApi.previewMergedRules(projectId)
          set({
            previewContent: (response as any)?.content || '',
            previewRules: (response as any)?.rules || [],
            previewLoading: false,
          })
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to preview merged context rules',
            previewLoading: false,
          })
          throw error
        }
      },

      getMergedContextRules: async (projectId) => {
        try {
          const response = await contextRulesApi.getMergedContextRules(projectId)
          return (response as any) || null
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to get merged context rules',
          })
          return null
        }
      },

      clearError: () => set({ error: null }),

      reset: () =>
        set({
          ...initialState,
          queryParams: { ...initialQueryParams }
        }),
    }),
    { name: 'context-rule-store' }
  )
)

