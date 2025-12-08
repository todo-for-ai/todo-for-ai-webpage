import React from 'react'

interface CodeBlockProps {
  language?: string
  children: React.ReactNode
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  return (
    <pre>
      <code className={language ? `language-${language}` : ''}>
        {children}
      </code>
    </pre>
  )
}

export default CodeBlock
