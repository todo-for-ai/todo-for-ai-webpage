/**
 * 经验库分析区块
 *
 * 展示经验库统计、低置信度经验、衰减趋势等分析卡片。
 */
import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Empty, Tag, Tooltip, Space, Typography, List } from 'antd'
import {
  BookOutlined,
  WarningOutlined,
  DotChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  HeatMapOutlined,
} from '@ant-design/icons'
import {
  agentsApi,
  type ExperiencesStats,
  type ExperiencesLowConfidence,
  type ExperiencesScatter,
  type ExperiencesReuseTrend,
  type ExperiencesConfidenceDecayForecast,
  type ExperiencesDecayByDomain,
  type ExperiencesDecayByTaskType,
  type ExperiencesConfidenceDistribution,
  type ExperiencesSourceDistribution,
  type ExperiencesPropagationChain,
  type ExperiencesSkillCoverageRadar,
} from '../../api/agents'
import LowConfidenceExperiencesCard from './LowConfidenceExperiencesCard'
import ExperiencesConfidenceDistributionCard from './ExperiencesConfidenceDistributionCard'
import ExperiencesSourceDistributionCard from './ExperiencesSourceDistributionCard'
import ExperiencesPropagationChainCard from './ExperiencesPropagationChainCard'
import SkillCoverageRadarCard from './SkillCoverageRadarCard'


/**
 * 经验分析区数据层：挂载时并发拉取统计/低置信/散点/复用趋势/衰减/分布/传播链/技能雷达。
 * 由 ExperiencesSection 原样拆出。
 */
export function useExperiencesData() {
  const [experiencesStats, setExperiencesStats] = useState<ExperiencesStats | null>(null)
  const [experiencesLowConfidence, setExperiencesLowConfidence] = useState<ExperiencesLowConfidence | null>(null)
  const [experiencesScatter, setExperiencesScatter] = useState<ExperiencesScatter | null>(null)
  const [experiencesReuseTrend, setExperiencesReuseTrend] = useState<ExperiencesReuseTrend | null>(null)
  const [experiencesDecayForecast, setExperiencesDecayForecast] = useState<ExperiencesConfidenceDecayForecast | null>(null)
  const [experiencesDecayByDomain, setExperiencesDecayByDomain] = useState<ExperiencesDecayByDomain | null>(null)
  const [experiencesDecayByTaskType, setExperiencesDecayByTaskType] = useState<ExperiencesDecayByTaskType | null>(null)
  const [experiencesConfidenceDistribution, setExperiencesConfidenceDistribution] = useState<ExperiencesConfidenceDistribution | null>(null)
  const [experiencesSourceDistribution, setExperiencesSourceDistribution] = useState<ExperiencesSourceDistribution | null>(null)
  const [experiencesPropagationChain, setExperiencesPropagationChain] = useState<ExperiencesPropagationChain | null>(null)
  const [skillCoverageRadar, setSkillCoverageRadar] = useState<ExperiencesSkillCoverageRadar | null>(null)

  useEffect(() => {
    agentsApi.getExperiencesStats().then(setExperiencesStats).catch(() => {})
    agentsApi.getExperiencesLowConfidence().then(setExperiencesLowConfidence).catch(() => {})
    agentsApi.getExperiencesScatter(200).then(setExperiencesScatter).catch(() => {})
    agentsApi.getExperiencesReuseTrend(30).then(setExperiencesReuseTrend).catch(() => {})
    agentsApi.getExperiencesConfidenceDecayForecast(30).then(setExperiencesDecayForecast).catch(() => {})
    agentsApi.getExperiencesDecayByDomain(15).then(setExperiencesDecayByDomain).catch(() => {})
    agentsApi.getExperiencesDecayByTaskType(15).then(setExperiencesDecayByTaskType).catch(() => {})
    agentsApi.getExperiencesConfidenceDistribution().then(setExperiencesConfidenceDistribution).catch(() => {})
    agentsApi.getExperiencesSourceDistribution().then(setExperiencesSourceDistribution).catch(() => {})
    agentsApi.getExperiencesPropagationChain(10).then(setExperiencesPropagationChain).catch(() => {})
    agentsApi.getExperiencesSkillCoverageRadar(6, 8).then(setSkillCoverageRadar).catch(() => {})
  }, [])

  return {
    experiencesStats,
    setExperiencesStats,
    experiencesLowConfidence,
    setExperiencesLowConfidence,
    experiencesScatter,
    setExperiencesScatter,
    experiencesReuseTrend,
    setExperiencesReuseTrend,
    experiencesDecayForecast,
    setExperiencesDecayForecast,
    experiencesDecayByDomain,
    setExperiencesDecayByDomain,
    experiencesDecayByTaskType,
    setExperiencesDecayByTaskType,
    experiencesConfidenceDistribution,
    setExperiencesConfidenceDistribution,
    experiencesSourceDistribution,
    setExperiencesSourceDistribution,
    experiencesPropagationChain,
    setExperiencesPropagationChain,
    skillCoverageRadar,
    setSkillCoverageRadar,
  }
}
