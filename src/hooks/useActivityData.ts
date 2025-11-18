// 占位文件 - useActivityData hook
export const useActivityData = (userId?: number, dateRange?: any) => {
  return {
    data: [],
    loading: false,
    stats: {},
    heatmapData: [],
    colorScale: [],
    getColorForValue: (value: number) => '#eee'
  }
}
