import React, { useState } from 'react'
import { Typography, Space, Button, Card } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import CommandLinePlayer, { CommandLineScript } from '../components/CommandLinePlayer/CommandLinePlayer'

const { Title, Text } = Typography

// 示例脚本 - 构建过程演示
const demoScript: CommandLineScript = {
  title: 'Build Process Demo',
  description: '演示项目构建过程的命令行输出',
  frames: [
    { timestamp: 0, content: 'npm run build', type: 'input' },
    { timestamp: 500, content: '', type: 'output' },
    { timestamp: 800, content: '> todo-for-ai-webpage@0.0.0 build', type: 'output' },
    { timestamp: 1000, content: '> tsc -b && vite build', type: 'output' },
    { timestamp: 1500, content: '', type: 'output' },
    { timestamp: 2000, content: 'vite v6.4.1 building for production...', type: 'output' },
    { timestamp: 2500, content: '✓ 124 modules transformed.', type: 'output' },
    { timestamp: 3000, content: 'rendering chunks...', type: 'output' },
    { timestamp: 3500, content: 'dist/                     0.05 kB │ gzip: 0.07 kB', type: 'output' },
    { timestamp: 4000, content: 'dist/assets/index-xxx.js  156.45 kB │ gzip: 45.23 kB', type: 'output' },
    { timestamp: 4500, content: 'dist/assets/index-xxx.css  23.12 kB │ gzip: 5.67 kB', type: 'output' },
    { timestamp: 5000, content: '', type: 'output' },
    { timestamp: 5500, content: 'Build completed successfully!', type: 'output' },
    { timestamp: 6000, content: 'Total build time: 4.23s', type: 'output' },
  ],
  totalDuration: 6500,
}

// 示例脚本 - Git 操作演示
const gitScript: CommandLineScript = {
  title: 'Git Workflow Demo',
  description: '演示 Git 工作流程',
  frames: [
    { timestamp: 0, content: 'git status', type: 'input' },
    { timestamp: 500, content: 'On branch feature/command-line-player', type: 'output' },
    { timestamp: 800, content: 'Changes to be committed:', type: 'output' },
    { timestamp: 1000, content: '  (use "git restore --staged <file>..." to unstage)', type: 'output' },
    { timestamp: 1200, content: '        new file:   src/components/CommandLinePlayer/CommandLinePlayer.tsx', type: 'output' },
    { timestamp: 1400, content: '        new file:   src/components/CommandLinePlayer/CommandLinePlayer.css', type: 'output' },
    { timestamp: 1600, content: '', type: 'output' },
    { timestamp: 1800, content: 'git commit -m "feat: add command line player component"', type: 'input' },
    { timestamp: 2200, content: '[feature/command-line-player abc1234] feat: add command line player component', type: 'output' },
    { timestamp: 2500, content: ' 2 files changed, 451 insertions(+)', type: 'output' },
    { timestamp: 2800, content: ' create mode 100644 src/components/CommandLinePlayer/CommandLinePlayer.tsx', type: 'output' },
    { timestamp: 3100, content: ' create mode 100644 src/components/CommandLinePlayer/CommandLinePlayer.css', type: 'output' },
  ],
  totalDuration: 3500,
}

// 示例脚本 - 带错误的演示
const errorScript: CommandLineScript = {
  title: 'Error Handling Demo',
  description: '演示命令行错误处理',
  frames: [
    { timestamp: 0, content: 'npm install unknown-package', type: 'input' },
    { timestamp: 500, content: '', type: 'output' },
    { timestamp: 800, content: 'npm ERR! code E404', type: 'error' },
    { timestamp: 1000, content: 'npm ERR! 404 Not Found - GET https://registry.npmjs.org/unknown-package', type: 'error' },
    { timestamp: 1200, content: 'npm ERR! 404', type: 'error' },
    { timestamp: 1400, content: 'npm ERR! 404  \'unknown-package@*\' is not in this registry.', type: 'error' },
    { timestamp: 1600, content: 'npm ERR! 404', type: 'error' },
    { timestamp: 1800, content: 'npm ERR! 404 Note that you can also install from a', type: 'error' },
    { timestamp: 2000, content: 'npm ERR! 404 tarball, folder, http url, or git url.', type: 'error' },
    { timestamp: 2200, content: '', type: 'output' },
    { timestamp: 2400, content: 'npm ERR! A complete log of this run can be found in:', type: 'error' },
    { timestamp: 2600, content: 'npm ERR!     /home/user/.npm/_logs/2024-01-01T00_00_00_000Z-debug.log', type: 'error' },
  ],
  totalDuration: 3000,
}

const CommandLineDemoPage: React.FC = () => {
  const [currentScript, setCurrentScript] = useState<CommandLineScript>(demoScript)
  const [scripts, setScripts] = useState<CommandLineScript[]>([demoScript, gitScript, errorScript])

  const handleScriptChange = (updatedScript: CommandLineScript) => {
    setScripts((prev) =>
      prev.map((s) => (s.title === updatedScript.title ? updatedScript : s))
    )
    if (currentScript.title === updatedScript.title) {
      setCurrentScript(updatedScript)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            <CodeOutlined /> Command Line Player Demo
          </Title>
          <Text type="secondary">
            A powerful command line demo player with source editing capabilities.
            Supports BATCH syntax highlighting and VIM-style editing.
          </Text>
        </div>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text strong>Select Demo Script:</Text>
            <Space>
              {scripts.map((script) => (
                <Button
                  key={script.title}
                  type={currentScript.title === script.title ? 'primary' : 'default'}
                  onClick={() => setCurrentScript(script)}
                >
                  {script.title}
                </Button>
              ))}
            </Space>
          </Space>
        </Card>

        <CommandLinePlayer
          script={currentScript}
          onScriptChange={handleScriptChange}
          height={500}
          autoPlay={false}
        />

        <Card title="Features">
          <ul>
            <li><strong>Preview Mode:</strong> Watch command line execution with realistic terminal styling</li>
            <li><strong>Playback Controls:</strong> Play, pause, stop, step forward/backward, and timeline seeking</li>
            <li><strong>Source Mode:</strong> Edit the script in real-time with Monaco Editor</li>
            <li><strong>BATCH Syntax:</strong> Full syntax highlighting for BATCH commands</li>
            <li><strong>VIM Style:</strong> Toggle VIM editing mode with block cursor</li>
            <li><strong>Real-time Preview:</strong> Changes in source mode reflect immediately in preview</li>
          </ul>
        </Card>

        <Card title="Script Format">
          <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
{`{
  "title": "Demo Script",
  "description": "Description of the script",
  "frames": [
    { "timestamp": 0, "content": "command", "type": "input" },
    { "timestamp": 500, "content": "output line 1", "type": "output" },
    { "timestamp": 1000, "content": "error message", "type": "error" }
  ],
  "totalDuration": 1500
}`}
          </pre>
        </Card>
      </Space>
    </div>
  )
}

export default CommandLineDemoPage
