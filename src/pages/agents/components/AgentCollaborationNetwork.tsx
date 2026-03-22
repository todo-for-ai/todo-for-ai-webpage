import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, Spin, Empty, Select, Space, Typography } from 'antd'
import type { AgentSecretCollaborationResponse } from '../../api/agents'
import './AgentCollaborationNetwork.css'

const { Title, Text } = Typography

interface NodeDatum extends d3.SimulationNodeDatum {
  id: number
  name: string
  type: 'agent' | 'secret'
  direction?: 'outgoing' | 'incoming'
  shareCount?: number
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: number | NodeDatum
  target: number | NodeDatum
  secretCount: number
  isActive: boolean
}

interface AgentCollaborationNetworkProps {
  data?: AgentSecretCollaborationResponse
  loading: boolean
  width?: number
  height?: number
}

export function AgentCollaborationNetwork({
  data,
  loading,
  width = 800,
  height = 500,
}: AgentCollaborationNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [filter, setFilter] = useState<'all' | 'outgoing' | 'incoming'>('all')

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // 构建节点和边
    const nodes: NodeDatum[] = []
    const links: LinkDatum[] = []
    const nodeMap = new Map<number, NodeDatum>()

    // 添加中心 Agent
    const centerNode: NodeDatum = {
      id: data.stats.agent_id,
      name: 'Current Agent',
      type: 'agent',
    }
    nodes.push(centerNode)
    nodeMap.set(centerNode.id, centerNode)

    // 添加协作者
    const collaborators = [
      ...(filter !== 'incoming' ? data.outgoing_collaborators : []),
      ...(filter !== 'outgoing' ? data.incoming_collaborators : []),
    ]

    collaborators.forEach((collab) => {
      const node: NodeDatum = {
        id: collab.agent_id,
        name: collab.agent_name || `Agent #${collab.agent_id}`,
        type: 'agent',
        direction: collab.direction as 'outgoing' | 'incoming',
        shareCount: collab.share_count,
      }
      nodes.push(node)
      nodeMap.set(node.id, node)

      links.push({
        source: collab.direction === 'outgoing' ? centerNode.id : collab.agent_id,
        target: collab.direction === 'outgoing' ? collab.agent_id : centerNode.id,
        secretCount: collab.secret_count,
        isActive: collab.active_share_count > 0,
      })
    })

    // 创建力导向模拟
    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))

    // 绘制边
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'network-link')
      .attr('stroke', (d) => (d.isActive ? '#52c41a' : '#d9d9d9'))
      .attr('stroke-width', (d) => Math.sqrt(d.secretCount) + 1)
      .attr('stroke-opacity', 0.6)

    // 绘制箭头
    svg
      .append('defs')
      .selectAll('marker')
      .data(['end'])
      .join('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 35)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999')

    link.attr('marker-end', 'url(#arrow)')

    // 绘制节点组
    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'network-node')
      .call(d3.drag<SVGGElement, NodeDatum>().on('start', dragstarted).on('drag', dragged).on('end', dragended))

    // 节点圆圈
    node
      .append('circle')
      .attr('r', (d) => (d.id === data.stats.agent_id ? 30 : 25))
      .attr('fill', (d) => {
        if (d.id === data.stats.agent_id) return '#1677ff'
        return d.direction === 'outgoing' ? '#52c41a' : '#faad14'
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)

    // 节点文字
    node
      .append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .text((d) => d.name)
      .attr('class', 'network-label')

    // 节点图标/计数
    node
      .append('text')
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text((d) => {
        if (d.id === data.stats.agent_id) return '★'
        return d.shareCount?.toString() || ''
      })

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as NodeDatum).x!)
        .attr('y1', (d) => (d.source as NodeDatum).y!)
        .attr('x2', (d) => (d.target as NodeDatum).x!)
        .attr('y2', (d) => (d.target as NodeDatum).y!)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    function dragstarted(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return () => {
      simulation.stop()
    }
  }, [data, filter, width, height])

  if (loading) {
    return (
      <Card className="collaboration-network-card">
        <Spin size="large" tip="Loading network..." />
      </Card>
    )
  }

  if (!data || data.stats.edge_count === 0) {
    return (
      <Card className="collaboration-network-card">
        <Empty description="No collaboration relationships found" />
      </Card>
    )
  }

  return (
    <Card
      className="collaboration-network-card"
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            Collaboration Network
          </Title>
          <Text type="secondary">
            {data.stats.active_edge_count} active / {data.stats.edge_count} total
          </Text>
        </Space>
      }
      extra={
        <Select value={filter} onChange={setFilter} style={{ width: 120 }}>
          <Select.Option value="all">All</Select.Option>
          <Select.Option value="outgoing">Outgoing</Select.Option>
          <Select.Option value="incoming">Incoming</Select.Option>
        </Select>
      }
    >
      <svg ref={svgRef} width={width} height={height} className="collaboration-network-svg" />
    </Card>
  )
}
