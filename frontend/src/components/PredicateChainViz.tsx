import React, { useMemo } from 'react'
import {
  ReactFlow, type Node, type Edge,
  Controls, Background, BackgroundVariant, MiniMap,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { PredicateChainNode } from '../types'

interface Props {
  chainNodes: PredicateChainNode[]
  highlightKNumber?: string
  /** When true, rendered in a compact container — hides minimap, uses tighter layout */
  compact?: boolean
}

export const PredicateChainViz: React.FC<Props> = ({ chainNodes, highlightKNumber, compact = false }) => {
  const { nodes, edges } = useMemo(() => {
    // Vertical top-down layout: each depth level is a row
    const nodesPerDepth: Record<number, number> = {}
    chainNodes.forEach(n => { nodesPerDepth[n.depth] = (nodesPerDepth[n.depth] ?? 0) + 1 })
    const depthIndex: Record<number, number> = {}

    const nodeWidth = compact ? 180 : 230
    const xGap = compact ? 220 : 280
    const yGap = compact ? 120 : 160

    const nodes: Node[] = chainNodes.map(node => {
      const idx = depthIndex[node.depth] ?? 0
      depthIndex[node.depth] = idx + 1
      const count = nodesPerDepth[node.depth]
      const x = (idx - (count - 1) / 2) * xGap
      const y = node.depth * yGap

      return {
        id: node.k_number,
        position: { x, y },
        data: {
          label: (
            <div style={{ padding: compact ? '6px 8px' : '10px 12px', textAlign: 'left' }}>
              <div style={{ fontFamily: 'monospace', fontSize: compact ? 10 : 12, fontWeight: 700, marginBottom: 2, color: node.k_number === highlightKNumber ? '#60a5fa' : '#94a3b8' }}>
                {node.k_number}
              </div>
              <div style={{ fontSize: compact ? 10 : 11, color: '#cbd5e1', lineHeight: 1.3, marginBottom: 2 }}>
                {(node.device_name ?? '').substring(0, compact ? 28 : 36)}{(node.device_name?.length ?? 0) > (compact ? 28 : 36) ? '…' : ''}
              </div>
              <div style={{ fontSize: 10, color: '#475569' }}>
                {node.decision_date?.substring(0, 4)}
                {!compact && node.applicant ? ` · ${node.applicant.substring(0, 18)}` : ''}
              </div>
              {!!node.has_recall && (
                <span style={{ display: 'inline-block', marginTop: 4, fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  ⚠ Recall
                </span>
              )}
            </div>
          ),
        },
        style: {
          background: node.k_number === highlightKNumber ? 'rgba(59,130,246,0.12)' : node.depth === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          border: node.k_number === highlightKNumber ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          width: nodeWidth,
          boxShadow: node.k_number === highlightKNumber ? '0 0 20px rgba(59,130,246,0.2)' : '0 4px 12px rgba(0,0,0,0.35)',
          color: '#f1f5f9',
        },
      }
    })

    const edges: Edge[] = []
    for (let i = 1; i < chainNodes.length; i++) {
      const child = chainNodes[i]
      const parent = chainNodes[i - 1]
      if (parent) {
        edges.push({
          id: `${parent.k_number}-${child.k_number}`,
          source: child.k_number,
          target: parent.k_number,
          label: compact ? undefined : 'predicate of',
          animated: false,
          style: { stroke: 'rgba(99,102,241,0.4)', strokeWidth: 1.5 },
          labelStyle: { fontSize: 10, fill: 'rgba(148,163,184,0.5)' },
          labelBgStyle: { fill: 'transparent' },
        })
      }
    }

    return { nodes, edges }
  }, [chainNodes, highlightKNumber, compact])

  return (
    <div style={{ height: compact ? '100%' : '500px', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: compact ? 0.25 : 0.15, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
        {!compact && (
          <MiniMap
            nodeColor={n => n.id === highlightKNumber ? '#3b82f6' : 'rgba(255,255,255,0.1)'}
            maskColor="rgba(7,11,19,0.7)"
          />
        )}
      </ReactFlow>
    </div>
  )
}
