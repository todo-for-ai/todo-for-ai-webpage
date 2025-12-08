// 占位文件 - useMarketplaceStore
import { create } from 'zustand'

export const useMarketplaceStore = create(() => ({
  rules: [],
  loading: false,
  fetchRules: () => Promise.resolve()
}))
