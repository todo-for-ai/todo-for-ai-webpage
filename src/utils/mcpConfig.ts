import { getApiBaseUrl, getMcpServerUrl } from './apiConfig'

export const generateMcpConfig = (apiToken: string = 'your-api-token-here', withLogLevel: boolean = false) => {
  const baseUrl = getMcpServerUrl()
  return JSON.stringify({
    "mcpServers": {
      "todo-for-ai": {
        "command": "npx",
        "args": ["@todo-for-ai/mcp"],
        "env": {
          "TODO_API_BASE_URL": baseUrl,
          "TODO_API_TOKEN": apiToken,
          ...(withLogLevel && { "LOG_LEVEL": "info" })
        }
      }
    }
  }, null, 2)
}

export const generateMcpConfigWithArgs = (apiToken: string = 'your-api-token-here', withLogLevel: boolean = false) => {
  const baseUrl = getApiBaseUrl()
  return JSON.stringify({
    "mcpServers": {
      "todo-for-ai": {
        "command": "npx",
        "args": [
          "-y",
          "@todo-for-ai/mcp@latest",
          "--api-base-url",
          baseUrl,
          "--api-token",
          apiToken,
          ...(withLogLevel ? ["--log-level", "debug"] : [])
        ]
      }
    }
  }, null, 2)
}
