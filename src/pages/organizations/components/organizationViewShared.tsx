import {
  FolderOpenOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { Organization } from '../../../api/organizations'

export const roleColorMap: Record<string, string> = {
  owner: 'gold',
  admin: 'blue',
  member: 'cyan',
  viewer: 'default',
}

export const statusColorMap: Record<string, string> = {
  active: 'green',
  archived: 'orange',
}

export interface OrganizationStatItem {
  key: string
  icon: ReactNode
  label: string
  value: number
  tint: string
}

export function translateRoleLabel(
  tp: (key: string, options?: Record<string, unknown>) => string,
  roleKey: string
) {
  const normalizedRoleKey = String(roleKey || '').trim().toLowerCase()
  if (!normalizedRoleKey) {
    return '-'
  }

  const translated = tp(`roleLabels.${normalizedRoleKey}`)
  return translated === `roleLabels.${normalizedRoleKey}` ? normalizedRoleKey : translated
}

export function translateStatusLabel(
  tp: (key: string, options?: Record<string, unknown>) => string,
  status: string
) {
  const translated = tp(`detail.status.${status}`)
  return translated === `detail.status.${status}` ? status : translated
}

export function getRoleKeys(org: Organization) {
  const source = org.current_user_roles?.length
    ? org.current_user_roles
    : org.current_user_role
      ? [org.current_user_role]
      : []

  return Array.from(
    new Set(
      source
        .map((role) => String(role || '').trim().toLowerCase())
        .filter(Boolean)
    )
  )
}

export function getOrganizationStatItems(
  tp: (key: string, options?: Record<string, unknown>) => string,
  org: Organization
): OrganizationStatItem[] {
  return [
    {
      key: 'members',
      icon: <TeamOutlined style={{ color: '#1677ff' }} />,
      label: tp('table.members'),
      value: org.member_count ?? 0,
      tint: 'rgba(22, 119, 255, 0.08)',
    },
    {
      key: 'agents',
      icon: <RobotOutlined style={{ color: '#52c41a' }} />,
      label: tp('table.agents'),
      value: org.agent_count ?? 0,
      tint: 'rgba(82, 196, 26, 0.08)',
    },
    {
      key: 'projects',
      icon: <FolderOpenOutlined style={{ color: '#13c2c2' }} />,
      label: tp('table.projects'),
      value: org.project_count ?? 0,
      tint: 'rgba(19, 194, 194, 0.10)',
    },
    {
      key: 'activeRoles',
      icon: <SafetyCertificateOutlined style={{ color: '#fa8c16' }} />,
      label: tp('table.activeRoles'),
      value: org.active_role_count ?? 0,
      tint: 'rgba(250, 140, 22, 0.12)',
    },
  ]
}
