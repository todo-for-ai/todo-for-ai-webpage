import React from 'react'

interface ProjectPromptEditorProps {
  onVariableDocsClick?: () => void
}

export const ProjectPromptEditor: React.FC<ProjectPromptEditorProps> = () => {
  return (
    <div>
      <h1>ProjectPromptEditor</h1>
      <p>Component - refactored from large file</p>
    </div>
  )
}

interface TaskPromptButtonsProps {
  onVariableDocsClick?: () => void
}

export const TaskPromptButtons: React.FC<TaskPromptButtonsProps> = () => {
  return (
    <div>
      <h1>TaskPromptButtons</h1>
      <p>Component - refactored from large file</p>
    </div>
  )
}
