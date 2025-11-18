import React from 'react'
import { Button } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  children: string
  language?: string
  copyable?: boolean
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, language = 'bash', copyable = true }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // message.success('已复制到剪贴板')
    }).catch(() => {
      // message.error('复制失败')
    })
  }

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        customStyle={{
          backgroundColor: '#f6f8fa',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          lineHeight: '1.45',
          margin: 0
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
      {copyable && (
        <Button
          type="text"
          icon={<CopyOutlined />}
          size="small"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            opacity: 0.7,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
          onClick={() => copyToClipboard(children)}
        />
      )}
    </div>
  )
}

export default CodeBlock
export { CodeBlock }
