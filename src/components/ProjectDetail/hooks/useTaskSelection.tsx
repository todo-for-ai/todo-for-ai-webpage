import { useState, useCallback } from 'react'

export const useTaskSelection = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([])

  const handleTaskSelection = useCallback(() => ({

    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedTaskIds(selectedRowKeys as number[])
    },
    selectedRowKeys
  }), [selectedRowKeys])

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds([])
  }, []) as any

  return {
    selectedTaskIds,
    handleTaskSelection,
    handleClearSelection
  }
}
