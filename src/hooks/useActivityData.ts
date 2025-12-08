// 占位文件 - useActivityData hook
export const useActivityData = (externalData?: any, externalLoading?: any) => {
  return {
    data: [],
    loading: false,
    stats: { max: 0, total: 0, average: 0 },
    heatmapData: [],
    colorScale: [],
    getColorForValue: (value: number) => '#eee'
  }
}
