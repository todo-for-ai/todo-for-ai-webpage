import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// 获取git信息和构建时间
function getGitInfo() {
  try {
    // 获取最新的git tag
    const gitTag = execSync('git tag --sort=-version:refname | head -1', { encoding: 'utf8' }).trim() || 'v1.0'

    // 获取当前commit id (短版本)
    const commitId = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()

    // 获取构建时间
    const buildTime = new Date().toISOString()

    return {
      gitTag,
      commitId,
      buildTime
    }
  } catch (error) {
    console.warn('Failed to get git info:', error)
    // 如果获取git信息失败，返回默认值
    return {
      gitTag: 'v1.0',
      commitId: 'unknown',
      buildTime: new Date().toISOString()
    }
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  const gitInfo = getGitInfo()

  return {
    plugins: [react()],
    define: {
      __GIT_TAG__: JSON.stringify(gitInfo.gitTag),
      __COMMIT_ID__: JSON.stringify(gitInfo.commitId),
      __BUILD_TIME__: JSON.stringify(gitInfo.buildTime),
    },
    server: {
      port: 50111,
      host: '0.0.0.0',
      proxy: {
        '/todo-for-ai/api': {
          target: 'http://localhost:50110',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    preview: {
      port: 50112,
      host: '0.0.0.0'
    }
  }
})
