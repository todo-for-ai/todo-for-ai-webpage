type Tp = (key: string, opts?: any) => string

export const executionModeOptions = (tp: Tp) => [
    {
      value: 'external_pull',
      label: tp('detail.runtime.fields.executionMode.options.external_pull', { defaultValue: 'External Pull Mode' }),
      description: tp('detail.runtime.fields.executionMode.descriptions.external_pull', {
        defaultValue: 'Agent actively polls the platform API for tasks. Suitable for self-hosted agents.',
      }),
    },
    {
      value: 'managed_runner',
      label: tp('detail.runtime.fields.executionMode.options.managed_runner', { defaultValue: 'Managed Runner Mode' }),
      description: tp('detail.runtime.fields.executionMode.descriptions.managed_runner', {
        defaultValue: 'Platform pushes tasks to the agent via webhook. Requires the agent to be reachable from the internet.',
      }),
    },
  ]

export const sandboxProfileOptions = (tp: Tp) => [
    {
      value: 'strict',
      label: tp('detail.runtime.fields.sandboxProfile.options.strict', { defaultValue: 'Strict Isolation (nsjail)' }),
      description: tp('detail.runtime.fields.sandboxProfile.descriptions.strict', {
        defaultValue: 'Full system isolation using nsjail. Blocks all system calls except whitelisted ones. Recommended for untrusted code.',
      }),
    },
    {
      value: 'standard',
      label: tp('detail.runtime.fields.sandboxProfile.options.standard', { defaultValue: 'Standard (RestrictedPython)' }),
      description: tp('detail.runtime.fields.sandboxProfile.descriptions.standard', {
        defaultValue: 'Python-level restrictions using RestrictedPython. Prevents dangerous Python operations while maintaining performance.',
      }),
    },
    {
      value: 'permissive',
      label: tp('detail.runtime.fields.sandboxProfile.options.permissive', { defaultValue: 'Permissive (Basic)' }),
      description: tp('detail.runtime.fields.sandboxProfile.descriptions.permissive', {
        defaultValue: 'Minimal isolation. Only basic resource limits applied. Suitable for trusted internal scripts.',
      }),
    },
  ]

export const networkModeOptions = (tp: Tp) => [
    {
      value: 'whitelist',
      label: tp('detail.runtime.fields.networkMode.options.whitelist', { defaultValue: 'Whitelist Mode' }),
      description: tp('detail.runtime.fields.networkMode.descriptions.whitelist', {
        defaultValue: 'Only allows connections to explicitly listed domains. Most secure option.',
      }),
    },
    {
      value: 'isolated',
      label: tp('detail.runtime.fields.networkMode.options.isolated', { defaultValue: 'Complete Isolation' }),
      description: tp('detail.runtime.fields.networkMode.descriptions.isolated', {
        defaultValue: 'Blocks all network access. Code cannot make any external connections.',
      }),
    },
    {
      value: 'full',
      label: tp('detail.runtime.fields.networkMode.options.full', { defaultValue: 'Full Access' }),
      description: tp('detail.runtime.fields.networkMode.descriptions.full', {
        defaultValue: 'Unrestricted network access. Use with caution.',
      }),
    },
  ]

export function createRuntimeOptions(tp: Tp) {
  return {
    executionModeOptions: executionModeOptions(tp),
    sandboxProfileOptions: sandboxProfileOptions(tp),
    networkModeOptions: networkModeOptions(tp),
  }
}
