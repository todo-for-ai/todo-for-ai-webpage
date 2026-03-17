import React, { useState, useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Card, Button, Space, Slider, Tooltip, Badge, Segmented } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  CodeOutlined,
  EyeOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import './CommandLinePlayer.css'

export interface CommandLineFrame {
  timestamp: number
  content: string
  type: 'output' | 'input' | 'error'
}

export interface CommandLineScript {
  title: string
  description?: string
  frames: CommandLineFrame[]
  totalDuration: number
}

interface CommandLinePlayerProps {
  script: CommandLineScript
  onScriptChange?: (script: CommandLineScript) => void
  height?: string | number
  autoPlay?: boolean
}

type ViewMode = 'preview' | 'source'
type PlayState = 'playing' | 'paused' | 'stopped'

export const CommandLinePlayer: React.FC<CommandLinePlayerProps> = ({
  script,
  onScriptChange,
  height = 500,
  autoPlay = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [playState, setPlayState] = useState<PlayState>(autoPlay ? 'playing' : 'stopped')
  const [currentTime, setCurrentTime] = useState(0)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [editedScript, setEditedScript] = useState(script)
  const [isVimMode, setIsVimMode] = useState(true)

  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // 播放控制
  const startPlayback = useCallback(() => {
    setPlayState('playing')
    playIntervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 100
        if (next >= script.totalDuration) {
          setPlayState('paused')
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current)
          }
          return script.totalDuration
        }
        return next
      })
    }, 100)
  }, [script.totalDuration])

  const pausePlayback = useCallback(() => {
    setPlayState('paused')
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }
  }, [])

  const stopPlayback = useCallback(() => {
    setPlayState('stopped')
    setCurrentTime(0)
    setCurrentFrameIndex(0)
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }
  }, [])

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, script.totalDuration)))
  }, [script.totalDuration])

  // 计算当前应该显示的帧
  useEffect(() => {
    const frameIndex = script.frames.findIndex(
      (frame, index) => {
        const nextFrame = script.frames[index + 1]
        if (!nextFrame) return true
        return currentTime >= frame.timestamp && currentTime < nextFrame.timestamp
      }
    )
    if (frameIndex !== -1) {
      setCurrentFrameIndex(frameIndex)
    }
  }, [currentTime, script.frames])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // 处理脚本编辑
  const handleScriptEdit = (value: string | undefined) => {
    if (!value) return
    try {
      const parsed = JSON.parse(value)
      setEditedScript(parsed)
      if (onScriptChange) {
        onScriptChange(parsed)
      }
    } catch (e) {
      // 解析错误时不更新
    }
  }

  // 格式化时间显示
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    const remainingMs = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`
  }

  // 获取当前显示的内容
  const getVisibleContent = () => {
    const visibleFrames: CommandLineFrame[] = []
    for (let i = 0; i <= currentFrameIndex; i++) {
      if (script.frames[i]) {
        visibleFrames.push(script.frames[i])
      }
    }
    return visibleFrames
  }

  return (
    <Card
      className="command-line-player"
      title={
        <Space>
          <span>{script.title}</span>
          <Badge
            status={playState === 'playing' ? 'processing' : 'default'}
            text={playState === 'playing' ? 'Playing' : playState === 'paused' ? 'Paused' : 'Stopped'}
          />
        </Space>
      }
      extra={
        <Space>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              { label: <><EyeOutlined /> Preview</>, value: 'preview' },
              { label: <><CodeOutlined /> Source</>, value: 'source' },
            ]}
          />
          {viewMode === 'source' && (
            <Tooltip title={isVimMode ? 'Switch to Normal Mode' : 'Switch to VIM Mode'}>
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={() => setIsVimMode(!isVimMode)}
                type={isVimMode ? 'primary' : 'default'}
              >
                {isVimMode ? 'VIM' : 'Normal'}
              </Button>
            </Tooltip>
          )}
        </Space>
      }
    >
      {viewMode === 'preview' ? (
        <>
          {/* 终端显示区域 */}
          <div
            ref={terminalRef}
            className="command-line-terminal"
            style={{ height: typeof height === 'number' ? height - 120 : height }}
          >
            <div className="terminal-header">
              <div className="terminal-title">
                <span className="terminal-icon">⚡</span>
                Command Line Preview
              </div>
              <div className="terminal-controls">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
              </div>
            </div>
            <div className="terminal-content">
              {getVisibleContent().map((frame, index) => (
                <div
                  key={index}
                  className={`terminal-line terminal-${frame.type}`}
                >
                  {frame.type === 'input' && (
                    <span className="terminal-prompt">$ </span>
                  )}
                  {frame.type === 'error' && (
                    <span className="terminal-error-icon">✗ </span>
                  )}
                  <span className="terminal-text">{frame.content}</span>
                </div>
              ))}
              {playState === 'playing' && (
                <div className="terminal-cursor blink" />
              )}
            </div>
          </div>

          {/* 播放控制区域 */}
          <div className="playback-controls">
            <Space className="control-buttons" size="small">
              <Tooltip title="Stop">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={stopPlayback}
                  disabled={playState === 'stopped'}
                />
              </Tooltip>
              <Tooltip title="Step Backward">
                <Button
                  icon={<StepBackwardOutlined />}
                  onClick={() => seekTo(Math.max(0, currentTime - 1000))}
                />
              </Tooltip>
              {playState === 'playing' ? (
                <Tooltip title="Pause">
                  <Button
                    icon={<PauseCircleOutlined />}
                    onClick={pausePlayback}
                    type="primary"
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Play">
                  <Button
                    icon={<PlayCircleOutlined />}
                    onClick={startPlayback}
                    type="primary"
                  />
                </Tooltip>
              )}
              <Tooltip title="Step Forward">
                <Button
                  icon={<StepForwardOutlined />}
                  onClick={() => seekTo(Math.min(script.totalDuration, currentTime + 1000))}
                />
              </Tooltip>
            </Space>

            <div className="timeline-container">
              <span className="time-display">{formatTime(currentTime)}</span>
              <Slider
                className="timeline-slider"
                min={0}
                max={script.totalDuration}
                value={currentTime}
                onChange={seekTo}
                tooltip={{ formatter: (value) => formatTime(value || 0) }}
              />
              <span className="time-display">{formatTime(script.totalDuration)}</span>
            </div>

            <div className="frame-info">
              Frame {currentFrameIndex + 1} / {script.frames.length}
            </div>
          </div>
        </>
      ) : (
        /* 源码编辑模式 */
        <div className="source-editor-container" style={{ height }}>
          <Editor
            height="100%"
            defaultLanguage="json"
            value={JSON.stringify(editedScript, null, 2)}
            onChange={handleScriptEdit}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              readOnly: false,
              domReadOnly: false,
              // VIM 模式配置
              cursorStyle: isVimMode ? 'block' : 'line',
              cursorBlinking: isVimMode ? 'solid' : 'blink',
            }}
            onMount={(editor, monaco) => {
              // 注册 BATCH 语言支持
              monaco.languages.register({ id: 'batch' })
              monaco.languages.setMonarchTokensProvider('batch', {
                tokenizer: {
                  root: [
                    [/\b(?:echo|set|if|else|for|goto|call|start|rem|pause|exit)\b/, 'keyword'],
                    [/\b(?:@echo off|cls|dir|cd|md|rd|del|copy|move|ren)\b/, 'command'],
                    [/%[\w-]+%/, 'variable'],
                    [/\$[\w-]+/, 'variable'],
                    [/"[^"]*"/, 'string'],
                    [/[0-9]+/, 'number'],
                    [/::.*$/, 'comment'],
                    [/@.*$/, 'annotation'],
                  ],
                },
              })

              // 如果切换到 BATCH 文件，可以使用 batch 语言
              // editor.setModel(monaco.editor.createModel(value, 'batch'))

              // 配置 VIM 风格
              if (isVimMode) {
                editor.updateOptions({
                  cursorStyle: 'block',
                  cursorBlinking: 'solid',
                })
              }
            }}
          />
        </div>
      )}
    </Card>
  )
}

export default CommandLinePlayer
