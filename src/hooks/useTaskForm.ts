import { useState, useEffect, useCallback } from 'react'

export const useTaskForm = () => {
const [loading, setLoading] = useState(false)
const [isEditMode, setIsEditMode] = useState(false)
const [editorContent, setEditorContent] = useState('')
const [taskLoaded, setTaskLoaded] = useState(false)
const [originalTaskContent, setOriginalTaskContent] = useState('')
const [isAutoSaving, setIsAutoSaving] = useState(false)
const [lastSavedTime, setLastSavedTime] = useState<string>()

}
