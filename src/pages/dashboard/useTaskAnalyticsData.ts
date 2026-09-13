import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Empty, Tag, Tooltip, Space, Typography } from 'antd'
import {
  FieldTimeOutlined,
  LineChartOutlined,
  ProjectOutlined,
  UserOutlined,
  AimOutlined,
  ClusterOutlined,
} from '@ant-design/icons'
import { tasksApi, type TaskStats, type TaskOverdueTrend, type TaskCompletionByProject, type TaskCompletionByAssignee, type TaskOverdueByAssignee, type TaskCompletionByPriority, type TaskCompletionRateByProject, type TaskOverdueClustering, type TaskPriorityTrend, type TaskCompletionForecast } from '../../api/tasks'


/**
 * 任务分析区数据层：挂载时并发拉取 10 个分析端点（默认 30 天窗口）。
 * 由 TaskAnalyticsSection 原样拆出。
 */
export function useTaskAnalyticsData() {
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [taskOverdueTrend, setTaskOverdueTrend] = useState<TaskOverdueTrend | null>(null)
  const [taskOverdueByAssignee, setTaskOverdueByAssignee] = useState<TaskOverdueByAssignee | null>(null)
  const [taskOverdueClustering, setTaskOverdueClustering] = useState<TaskOverdueClustering | null>(null)
  const [taskPriorityTrend, setTaskPriorityTrend] = useState<TaskPriorityTrend | null>(null)
  const [taskCompletionForecast, setTaskCompletionForecast] = useState<TaskCompletionForecast | null>(null)
  const [taskCompletionByProject, setTaskCompletionByProject] = useState<TaskCompletionByProject | null>(null)
  const [taskCompletionByAssignee, setTaskCompletionByAssignee] = useState<TaskCompletionByAssignee | null>(null)
  const [taskCompletionByPriority, setTaskCompletionByPriority] = useState<TaskCompletionByPriority | null>(null)
  const [taskCompletionRateByProject, setTaskCompletionRateByProject] = useState<TaskCompletionRateByProject | null>(null)


  useEffect(() => {
    tasksApi.getStats().then(setTaskStats).catch(() => {})
    tasksApi.getOverdueTrend(30).then(setTaskOverdueTrend).catch(() => {})
    tasksApi.getOverdueByAssignee(10).then(setTaskOverdueByAssignee).catch(() => {})
    tasksApi.getOverdueClustering(15).then(setTaskOverdueClustering).catch(() => {})
    tasksApi.getPriorityTrend(30).then(setTaskPriorityTrend).catch(() => {})
    tasksApi.getCompletionForecast(30).then(setTaskCompletionForecast).catch(() => {})
    tasksApi.getCompletionByProject(30, 8).then(setTaskCompletionByProject).catch(() => {})
    tasksApi.getCompletionByAssignee(30, 8).then(setTaskCompletionByAssignee).catch(() => {})
    tasksApi.getCompletionByPriority(30).then(setTaskCompletionByPriority).catch(() => {})
    tasksApi.getCompletionRateByProject(30, 10).then(setTaskCompletionRateByProject).catch(() => {})

  }, [])

  return {
    taskStats,
    setTaskStats,
    taskOverdueTrend,
    setTaskOverdueTrend,
    taskOverdueByAssignee,
    setTaskOverdueByAssignee,
    taskOverdueClustering,
    setTaskOverdueClustering,
    taskPriorityTrend,
    setTaskPriorityTrend,
    taskCompletionForecast,
    setTaskCompletionForecast,
    taskCompletionByProject,
    setTaskCompletionByProject,
    taskCompletionByAssignee,
    setTaskCompletionByAssignee,
    taskCompletionByPriority,
    setTaskCompletionByPriority,
    taskCompletionRateByProject,
    setTaskCompletionRateByProject
  }
}
