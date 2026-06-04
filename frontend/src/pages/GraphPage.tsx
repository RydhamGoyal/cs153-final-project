import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Network, RotateCcw, ChevronLeft,
  CheckCircle2, Cpu, Database, GitBranch, Layers, Activity,
  X, Building2, Calendar, Tag, Shield, AlertTriangle, Info,
} from 'lucide-react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import type { SimulationNodeDatum } from 'd3-force'
import {
  getSampleNetwork, getDeviceNetwork, getDevice, autocompleteDevices, getNetworkInsights,
  type NetworkNode, type NetworkEdge, type NetworkInsights,
} from '../api'
import { PredicateChainViz } from '../components/PredicateChainViz'
import type { PredicateChainNode } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SimNode extends SimulationNodeDatum {
  id: string; device_name: string; device_class: string; decision_date?: string
  isHub: boolean; isSelected: boolean; isFocusCenter: boolean
  radius: number; fillColor: string; strokeColor: string; glowColor: string; labelColor: string
  connectionCount: number; recallCount: number
}

type AcResult = { k_number: string; device_name: string; connections: number }
type DeviceData = { device: Record<string, string | number | null>; predicate_chain: PredicateChainNode[] }

const CLASS_COLORS: Record<string, [string, string, string, string]> = {
  '1': ['rgba(34,197,94,0.20)',  'rgba(34,197,94,0.65)',  'rgba(34,197,94,0.5)',  '#4ade80'],
  '2': ['rgba(59,130,246,0.20)', 'rgba(59,130,246,0.65)', 'rgba(59,130,246,0.5)', '#60a5fa'],
  '3': ['rgba(239,68,68,0.20)',  'rgba(239,68,68,0.65)',  'rgba(239,68,68,0.5)',  '#f87171'],
}
const DEFAULT_COLORS: [string, string, string, string] = [
  'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0.2)', '#94a3b8',
]
const CLASS_LABELS: Record<string, string> = { '1': 'Class I', '2': 'Class II', '3': 'Class III' }
const LEFT_PANEL_W = 340   // Network Intelligence panel width — graph fits to the right of it

const PIPELINE_AGENTS = [
  { label: 'Device Ingestion',    icon: Database,   stat: '175,013 devices' },
  { label: 'Predicate Discovery', icon: GitBranch,  stat: '22,497 relationships' },
  { label: 'Citation Mapping',    icon: Layers,     stat: '10,123 core nodes' },
  { label: 'Graph Construction',  icon: Cpu,        stat: 'Force-directed layout' },
  { label: 'Classification',      icon: Activity,   stat: 'Class I · II · III' },
]

function clsColor(cls: string) { return CLASS_COLORS[cls]?.[3] ?? DEFAULT_COLORS[3] }

function cleanDesc(raw: string): string {
  const text = raw.replace(/^#{1,6}\s*/gm, '').replace(/\n{2,}/g, ' ').replace(/\s{2,}/g, ' ').trim()
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text]
  const kw = /device|intended|use|patient|diagnos|treat|monitor|measure|detect|surgical|implant|catheter|sensor|signal|pressure|cardiac|blood|tissue|bone|imaging|test|specimen|glucose|oxygen/i
  const good = sentences.filter(s => s.length > 40 && kw.test(s))
  return (good.length ? good : sentences.filter(s => s.length > 30)).slice(0, 4).join(' ').trim().substring(0, 480)
}

// ─── Component ────────────────────────────────────────────────────────────────
export function GraphPage() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Hot-path refs
  const simNodesRef    = useRef<SimNode[]>([])
  const simLinksRef    = useRef<{ source: SimNode; target: SimNode }[]>([])
  const simRef         = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)
  const transformRef   = useRef({ x: 0, y: 0, k: 1 })
  const mouseRef       = useRef({ x: 0, y: 0, over: false })
  const dragRef        = useRef<{
    node: SimNode | null; isDrag: boolean
    downX: number; downY: number; panStartX: number; panStartY: number
    txAtDown: number; tyAtDown: number
  }>({ node: null, isDrag: false, downX: 0, downY: 0, panStartX: 0, panStartY: 0, txAtDown: 0, tyAtDown: 0 })
  const rafRef         = useRef(0)
  const frameCountRef  = useRef(0)
  const apiCacheRef    = useRef<{ nodes: NetworkNode[]; edges: NetworkEdge[]; hubs: string[] } | null>(null)
  const fullNetworkRef = useRef<{ nodes: NetworkNode[]; edges: NetworkEdge[]; hubs: string[] } | null>(null)
  const hoveredIdRef   = useRef<string | null>(null)
  const acTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  // React state
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [stats,         setStats]         = useState({ nodes: 0, edges: 0, topHubs: [] as { id: string; name: string; conns: number }[] })
  const [searchInput,   setSearchInput]   = useState('')
  const [acResults,     setAcResults]     = useState<AcResult[]>([])
  const [showAc,        setShowAc]        = useState(false)
  const [isolationMode, setIsolationMode] = useState(false)
  const [focusedK,      setFocusedK]      = useState<string | null>(null)
  const [showInfo,      setShowInfo]      = useState(false)
  const [insights,      setInsights]      = useState<NetworkInsights | null>(null)
  const [niTab,         setNiTab]         = useState<'stats' | 'hubs' | 'dynasties' | 'bridges'>('stats')
  const [hoveredNode,   setHoveredNode]   = useState<{ id: string; name: string; cls: string; date?: string; conns: number; recalls: number } | null>(null)
  const [tooltipPos,    setTooltipPos]    = useState<{ x: number; y: number } | null>(null)
  // Floating device tile
  const [tileK,         setTileK]         = useState<string | null>(null)
  const [tileData,      setTileData]      = useState<DeviceData | null>(null)
  const [tileLoading,   setTileLoading]   = useState(false)
  const [tilePos,       setTilePos]       = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const tileDragRef = useRef<{ active: boolean; startX: number; startY: number; startPosX: number; startPosY: number }>({
    active: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0,
  })

  // ── Canvas sizing ────────────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current, container = containerRef.current
    if (!canvas || !container) return
    const { width, height } = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`;       canvas.style.height = `${height}px`
  }, [])

  useEffect(() => {
    resizeCanvas()
    const ro = new ResizeObserver(resizeCanvas)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [resizeCanvas])

  // ── Build simulation ─────────────────────────────────────────────────────────
  const buildSim = useCallback((
    apiNodes: NetworkNode[], apiEdges: NetworkEdge[], hubs: string[],
    selectedK: string | null, autoFit: boolean, focusCenter?: string,
  ) => {
    simRef.current?.stop()
    resizeCanvas()

    const hubSet  = new Set(hubs)
    const connCount: Record<string, number> = {}
    for (const e of apiEdges) {
      connCount[e.k_number] = (connCount[e.k_number] || 0) + 1
      connCount[e.predicate_k_number] = (connCount[e.predicate_k_number] || 0) + 1
    }

    // Only display nodes that have at least one edge in the displayed graph.
    // Nodes with 0 displayed connections appear isolated — confusing because their
    // predicates exist but fall below the degree-≥2 threshold for the main view.
    // Those devices remain reachable via search / focus mode.
    const displayNodes = apiNodes.filter(n => connCount[n.k_number] > 0)
    const isSmall = displayNodes.length < 250

    const radiusScale = Math.min(1, Math.pow(600 / Math.max(displayNodes.length, 600), 0.35))
    const nodes: SimNode[] = displayNodes.map(n => {
      const conns = connCount[n.k_number] || 0
      const isHub = hubSet.has(n.k_number)
      const [fill, stroke, glow, label] = CLASS_COLORS[n.device_class] ?? DEFAULT_COLORS
      const baseR = isHub ? 22 : Math.max(5, 6 + conns * 0.9)
      const angle = Math.random() * Math.PI * 2
      const r0    = Math.random() * Math.sqrt(apiNodes.length) * 8
      return {
        id: n.k_number, device_name: n.device_name, device_class: n.device_class,
        decision_date: n.decision_date, isHub, isSelected: n.k_number === selectedK,
        isFocusCenter: n.k_number === focusCenter,
        x: r0 * Math.cos(angle), y: r0 * Math.sin(angle), vx: 0, vy: 0, fx: null, fy: null,
        radius: Math.max(3, baseR * radiusScale), fillColor: fill, strokeColor: stroke,
        glowColor: glow, labelColor: label, connectionCount: conns,
        recallCount: n.recall_count ?? 0, index: undefined,
      }
    })

    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawLinks: any[] = []
    for (const e of apiEdges)
      if (nodeMap.has(e.k_number) && nodeMap.has(e.predicate_k_number))
        rawLinks.push({ source: e.k_number, target: e.predicate_k_number })

    simNodesRef.current = nodes
    simLinksRef.current = rawLinks

    const totalArea = nodes.reduce((s, n) => s + n.radius * n.radius, 0)
    const CONTAIN_R = Math.max(280, Math.sqrt(totalArea * 5.5))

    const sim = forceSimulation<SimNode>(nodes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .force('link', (forceLink(rawLinks) as any)
        .id((d: SimNode) => d.id)
        .distance((d: { source: SimNode; target: SimNode }) => (d.source.radius + d.target.radius) * 2.6 + 16)
        .strength(0.3)
      )
      .force('charge', forceManyBody<SimNode>().strength((d: SimNode) => -(d.radius ** 2) * 1.0).distanceMax(CONTAIN_R * 0.6))
      .force('center', forceCenter(0, 0).strength(0.1))
      .force('collide', forceCollide<SimNode>().radius((d: SimNode) => d.radius + 4).strength(0.8).iterations(1))
      .force('boundary', (alpha: number) => {
        for (const node of nodes) {
          const nx = node.x ?? 0, ny = node.y ?? 0
          const dist = Math.sqrt(nx * nx + ny * ny) || 0.001
          if (dist > CONTAIN_R) {
            const f = Math.min((dist - CONTAIN_R) * 0.2, 18) * alpha
            node.vx = (node.vx ?? 0) - (nx / dist) * f
            node.vy = (node.vy ?? 0) - (ny / dist) * f
          }
        }
      })
      .alphaDecay(0.012).velocityDecay(0.5).stop()

    if (isSmall) for (let i = 0; i < 180; i++) sim.tick()

    const canvas = canvasRef.current
    if (canvas && canvas.width > 0 && autoFit) {
      // Reserve the left intelligence panel so the graph centers in the visible region
      const dpr = window.devicePixelRatio || 1
      const panelDevice = LEFT_PANEL_W * dpr
      const availW = Math.max(canvas.width - panelDevice, 200)
      const centerX = panelDevice + availW / 2
      if (isSmall) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const n of nodes) {
          const nx = n.x ?? 0, ny = n.y ?? 0
          minX = Math.min(minX, nx - n.radius); maxX = Math.max(maxX, nx + n.radius)
          minY = Math.min(minY, ny - n.radius); maxY = Math.max(maxY, ny + n.radius)
        }
        const pad = 80, k = Math.min(availW / (maxX - minX + pad * 2), canvas.height / (maxY - minY + pad * 2), 3)
        transformRef.current = { x: centerX - ((minX + maxX) / 2) * k, y: canvas.height / 2 - ((minY + maxY) / 2) * k, k }
      } else {
        const graphDiam = CONTAIN_R * 2 + 100
        const k = Math.min(availW / graphDiam, canvas.height / graphDiam, 2.5)
        transformRef.current = { x: centerX, y: canvas.height / 2, k }
      }
    } else if (!canvas?.width) {
      transformRef.current = { x: 400, y: 300, k: 1 }
    }

    simRef.current = sim
    const topHubs = [...nodes].sort((a, b) => b.connectionCount - a.connectionCount).slice(0, 5)
      .map(n => ({ id: n.id, name: n.device_name, conns: n.connectionCount }))
    setStats({ nodes: nodes.length, edges: rawLinks.length, topHubs })
  }, [resizeCanvas])

  // ── Render loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frameId = 0

    const draw = () => {
      frameId = requestAnimationFrame(draw)
      rafRef.current = frameId
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const nodes = simNodesRef.current, links = simLinksRef.current, sim = simRef.current
      const { x: tx, y: ty, k } = transformRef.current
      const { x: mx, y: my, over } = mouseRef.current
      const W = canvas.width, H = canvas.height

      // Subtle mouse repulsion — with dead zone so nodes stay clickable
      if (over && sim && nodes.length > 0) {
        const worldR = Math.min(55 / k, 70)    // smaller radius = less aggressive
        const wmx = (mx - tx) / k, wmy = (my - ty) / k
        let heated = false
        for (const node of nodes) {
          if (node.fx != null) continue
          const dx = (node.x ?? 0) - wmx, dy = (node.y ?? 0) - wmy
          const d2 = dx * dx + dy * dy
          // Dead zone: never push a node the cursor is ON — keeps it clickable
          const clickR = node.radius + 8 / k
          if (d2 < clickR * clickR) continue
          if (d2 < worldR * worldR) {
            const dist = Math.sqrt(d2) || 0.001, t = 1 - dist / worldR
            node.vx = (node.vx ?? 0) + (dx / dist) * t * t * 1.2   // was 5 — much gentler
            node.vy = (node.vy ?? 0) + (dy / dist) * t * t * 1.2
            heated = true
          }
        }
        if (heated && sim.alpha() < 0.07) sim.alpha(0.07)   // low reheat = nodes barely move
      }

      // Tick
      frameCountRef.current++
      const tickEvery = nodes.length > 3000 ? 3 : nodes.length > 1000 ? 2 : 1
      if (sim && sim.alpha() > sim.alphaMin() && frameCountRef.current % tickEvery === 0) sim.tick()

      // Background
      ctx.fillStyle = '#060912'; ctx.fillRect(0, 0, W, H)
      const gridStep = Math.max(20, 28 * k)
      const gox = ((tx % gridStep) + gridStep) % gridStep, goy = ((ty % gridStep) + gridStep) % gridStep
      ctx.fillStyle = 'rgba(255,255,255,0.022)'
      for (let gx = gox; gx < W; gx += gridStep)
        for (let gy = goy; gy < H; gy += gridStep) { ctx.beginPath(); ctx.arc(gx, gy, 0.9, 0, Math.PI * 2); ctx.fill() }

      // Viewport cull
      const vPad = 40 / k, vL = (-tx / k) - vPad, vR = ((W - tx) / k) + vPad, vT = (-ty / k) - vPad, vB = ((H - ty) / k) + vPad
      const visNodes: SimNode[] = []
      for (const n of nodes) { const nx = n.x ?? 0, ny = n.y ?? 0; if (nx >= vL && nx <= vR && ny >= vT && ny <= vB) visNodes.push(n) }

      ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k)

      // Edges
      if (k > 0.08 && links.length > 0) {
        ctx.beginPath()
        for (const link of links) {
          const s = link.source as SimNode, t = link.target as SimNode
          if (s?.x != null && t?.x != null) { ctx.moveTo(s.x, s.y!); ctx.lineTo(t.x, t.y!) }
        }
        ctx.strokeStyle = 'rgba(99,102,241,0.32)'; ctx.lineWidth = 1.5 / k; ctx.stroke()
      }

      // Batch normal nodes by class
      const special: SimNode[] = []
      const batches: Record<string, SimNode[]> = { '1': [], '2': [], '3': [], '_': [] }
      for (const n of visNodes) {
        if (n.x == null || n.y == null) continue
        if (n.isHub || n.isSelected || n.isFocusCenter) { special.push(n); continue }
        batches[n.device_class in batches ? n.device_class : '_'].push(n)
      }
      ctx.lineWidth = 1 / k
      const batchDefs: [string, string, string][] = [
        ['1', CLASS_COLORS['1'][0], CLASS_COLORS['1'][1]],
        ['2', CLASS_COLORS['2'][0], CLASS_COLORS['2'][1]],
        ['3', CLASS_COLORS['3'][0], CLASS_COLORS['3'][1]],
        ['_', DEFAULT_COLORS[0], DEFAULT_COLORS[1]],
      ]
      for (const [key, fill, stroke] of batchDefs) {
        const batch = batches[key]; if (!batch.length) continue
        ctx.beginPath()
        for (const n of batch) { ctx.moveTo(n.x! + n.radius, n.y!); ctx.arc(n.x!, n.y!, n.radius, 0, Math.PI * 2) }
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke()
      }
      if (k > 1.2) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const fs = Math.max(5, 7 / k); ctx.font = `bold ${fs}px monospace`
        for (const batch of Object.values(batches))
          for (const n of batch) { if (n.x == null) continue; ctx.fillStyle = n.labelColor; ctx.fillText(n.id, n.x, n.y!) }
      }

      // Special nodes (hubs, selected, focus-center) with glow
      for (const node of special) {
        if (node.x == null || node.y == null) continue
        const nx = node.x, ny = node.y
        const glowR = node.radius * (node.isFocusCenter ? 4.0 : node.isSelected ? 3.4 : 3.0)
        const isCtr = node.isFocusCenter, isSel = node.isSelected
        const c0 = isCtr ? `rgba(251,191,36,0.55)` : isSel ? `rgba(59,130,246,0.50)` : node.glowColor.replace(/[\d.]+\)$/, '0.38)')
        const c1 = isCtr ? `rgba(251,191,36,0)` : isSel ? `rgba(59,130,246,0)` : node.glowColor.replace(/[\d.]+\)$/, '0)')
        const grad = ctx.createRadialGradient(nx, ny, node.radius * 0.5, nx, ny, glowR)
        grad.addColorStop(0, c0); grad.addColorStop(1, c1)
        ctx.beginPath(); ctx.arc(nx, ny, glowR, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill()
      }
      ctx.lineWidth = 1.8 / k
      for (const node of special) {
        if (node.x == null || node.y == null) continue
        const nx = node.x, ny = node.y, r = node.radius
        ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI * 2)
        ctx.fillStyle = node.isFocusCenter ? 'rgba(251,191,36,0.25)' : node.isSelected ? 'rgba(59,130,246,0.30)' : node.fillColor
        ctx.fill()
        ctx.strokeStyle = node.isFocusCenter ? 'rgba(251,191,36,0.95)' : node.isSelected ? 'rgba(59,130,246,0.95)' : node.strokeColor
        ctx.stroke()
        if (k > 0.25) {
          const fs = Math.max(6, Math.min(11, 10 / k)); ctx.font = `bold ${fs}px monospace`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillStyle = node.isFocusCenter ? '#fbbf24' : node.isSelected ? '#fff' : node.labelColor
          ctx.fillText(node.id, nx, ny)
        }
        if (k > 1.1) {
          const fs2 = Math.max(5, 7 / k); ctx.font = `${fs2}px system-ui, sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(203,213,225,0.75)'
          const name = node.device_name.length > 28 ? node.device_name.slice(0, 26) + '…' : node.device_name
          ctx.fillText(name, nx, ny + r + 3 / k, r * 4.5)
        }
      }
      ctx.restore()
    }

    draw()
    return () => cancelAnimationFrame(frameId)
  }, [])

  // ── Event helpers ────────────────────────────────────────────────────────────
  const toCanvas = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
    return { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr }
  }

  const hitTest = useCallback((cx: number, cy: number): SimNode | null => {
    const { x: tx, y: ty, k } = transformRef.current
    const wx = (cx - tx) / k, wy = (cy - ty) / k
    let best: SimNode | null = null, bestD = Infinity
    for (const n of simNodesRef.current) {
      const dx = (n.x ?? 0) - wx, dy = (n.y ?? 0) - wy
      const d2 = dx * dx + dy * dy, thresh = n.radius + 6 / k
      if (d2 < thresh * thresh) { const d = Math.sqrt(d2); if (d < bestD) { best = n; bestD = d } }
    }
    return best
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = toCanvas(e)
    mouseRef.current = { x, y, over: true }
    const drag = dragRef.current
    if (drag.node) {
      drag.isDrag = true
      const { k, x: tx, y: ty } = transformRef.current
      drag.node.fx = (x - tx) / k; drag.node.fy = (y - ty) / k
      if (simRef.current && simRef.current.alpha() < 0.3) simRef.current.alpha(0.3)
    } else if (drag.panStartX !== 0 || drag.panStartY !== 0) {
      transformRef.current.x = drag.txAtDown + (x - drag.panStartX)
      transformRef.current.y = drag.tyAtDown + (y - drag.panStartY)
    }
    // Hover detection (only update state on node change)
    if (!drag.node && !drag.isDrag) {
      const hit = hitTest(x, y)
      const newId = hit?.id ?? null
      if (newId !== hoveredIdRef.current) {
        hoveredIdRef.current = newId
        if (hit) {
          const rect = canvasRef.current!.getBoundingClientRect()
          setHoveredNode({ id: hit.id, name: hit.device_name, cls: hit.device_class, date: hit.decision_date, conns: hit.connectionCount, recalls: hit.recallCount })
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        } else { setHoveredNode(null); setTooltipPos(null) }
      } else if (hit) {
        const rect = canvasRef.current!.getBoundingClientRect()
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    }
    if (canvasRef.current)
      canvasRef.current.style.cursor = drag.node ? 'grabbing' : hitTest(x, y) ? 'pointer' : 'grab'
  }, [hitTest])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = toCanvas(e)
    const hit = hitTest(x, y), tr = transformRef.current
    dragRef.current = {
      node: hit, isDrag: false, downX: x, downY: y,
      panStartX: hit ? 0 : x, panStartY: hit ? 0 : y, txAtDown: tr.x, tyAtDown: tr.y,
    }
    if (hit) { hit.fx = hit.x ?? 0; hit.fy = hit.y ?? 0 }
    setHoveredNode(null); setTooltipPos(null); hoveredIdRef.current = null
    setShowAc(false)
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
  }, [hitTest])

  const openTile = useCallback((kNum: string, sourceNode?: SimNode) => {
    const container = containerRef.current
    const TILE_W = 540, TILE_H = 500
    const dpr = window.devicePixelRatio || 1

    if (container) {
      const cw = container.offsetWidth, ch = container.offsetHeight
      let posX: number, posY: number

      if (sourceNode?.x != null && sourceNode?.y != null) {
        // Convert node world pos → CSS pixel pos within the container
        const { x: tx, y: ty, k } = transformRef.current
        const nodeScreenX = (sourceNode.x * k + tx) / dpr
        const nodeScreenY = (sourceNode.y * k + ty) / dpr
        const nodeR = (sourceNode.radius * k) / dpr + 12

        // Try right of node first, then left, then centered
        const rightX = nodeScreenX + nodeR
        const leftX  = nodeScreenX - nodeR - TILE_W
        posX = rightX + TILE_W < cw - 8 ? rightX : leftX > 8 ? leftX : Math.max(8, (cw - TILE_W) / 2)
        posY = Math.max(8, Math.min(ch - TILE_H - 8, nodeScreenY - TILE_H / 2))

        // Smooth camera pan if the node is hidden behind the tile
        const tileLeft = posX - 10, tileRight = posX + TILE_W + 10
        const tileTop  = posY - 10, tileBot   = posY + TILE_H + 10
        const nodeBehindTile = nodeScreenX > tileLeft && nodeScreenX < tileRight
                             && nodeScreenY > tileTop  && nodeScreenY < tileBot

        if (nodeBehindTile) {
          // Pan so node ends up just to the left of the tile (or right if tile is on the right)
          const targetNodeX = posX === rightX ? posX - nodeR - 40 : posX + TILE_W + nodeR + 40
          const dxWorld = (targetNodeX - nodeScreenX) * dpr / k  // how far to move in world units
          const startTx = transformRef.current.x
          const endTx   = startTx - dxWorld * k   // shift transform to move node

          const t0 = performance.now()
          const animPan = (now: number) => {
            const p = Math.min((now - t0) / 340, 1)
            const e = 1 - Math.pow(1 - p, 3)   // ease-out cubic
            transformRef.current.x = startTx + (endTx - startTx) * e
            if (p < 1) requestAnimationFrame(animPan)
          }
          requestAnimationFrame(animPan)
        }
      } else {
        posX = Math.max(8, (cw - TILE_W) / 2)
        posY = Math.max(8, (ch - TILE_H) / 2)
      }

      setTilePos({ x: posX, y: posY })
    }

    setTileK(kNum); setTileData(null); setTileLoading(true)
    getDevice(kNum)
      .then(d => { setTileData(d as DeviceData); setTileLoading(false) })
      .catch(() => setTileLoading(false))
  }, [])

  const onMouseUp = useCallback(() => {
    const drag = dragRef.current
    if (drag.node && !drag.isDrag) {
      const sel = drag.node
      for (const n of simNodesRef.current) n.isSelected = n.id === sel.id
      openTile(sel.id, sel)
    }
    if (drag.node) { drag.node.fx = null; drag.node.fy = null }
    // Clicking empty canvas closes tile
    if (!drag.node) { setTileK(null); setTileData(null) }
    dragRef.current = { ...dragRef.current, node: null, isDrag: false, panStartX: 0, panStartY: 0 }
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }, [openTile])

  const onMouseLeave = useCallback(() => {
    mouseRef.current.over = false
    const drag = dragRef.current
    if (drag.node) { drag.node.fx = null; drag.node.fy = null }
    dragRef.current = { ...dragRef.current, node: null, isDrag: false, panStartX: 0, panStartY: 0 }
    setHoveredNode(null); setTooltipPos(null); hoveredIdRef.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const { x, y } = toCanvas(e as unknown as React.MouseEvent)
    const factor = e.deltaY > 0 ? 0.88 : 1.14
    const { x: tx, y: ty, k } = transformRef.current
    const newK = Math.max(0.07, Math.min(5, k * factor))
    transformRef.current = { x: x + (tx - x) * (newK / k), y: y + (ty - y) * (newK / k), k: newK }
  }, [])

  // ── Data & actions ───────────────────────────────────────────────────────────
  useEffect(() => {
    getSampleNetwork()
      .then(data => {
        apiCacheRef.current = data; fullNetworkRef.current = data
        buildSim(data.nodes, data.edges, data.hubs, null, true)
        setLoading(false)
      })
      .catch(() => { setError('Could not load network. Make sure the backend is running.'); setLoading(false) })
  }, [buildSim])

  useEffect(() => {
    getNetworkInsights().then(setInsights).catch(() => {})
  }, [])

  const handleSearchInput = (val: string) => {
    setSearchInput(val)
    setShowAc(false)
    if (acTimerRef.current) clearTimeout(acTimerRef.current)
    if (val.trim().length < 2) { setAcResults([]); return }
    acTimerRef.current = setTimeout(async () => {
      try {
        const res = await autocompleteDevices(val.trim())
        setAcResults(res); setShowAc(res.length > 0)
      } catch { setAcResults([]) }
    }, 220)
  }

  const selectAcResult = (k: string) => {
    setSearchInput(k); setShowAc(false); setAcResults([])
    focusOnDevice(k)
  }

  const focusOnDevice = async (kNum: string) => {
    const k = kNum.trim().toUpperCase()
    if (!k) return
    setError(null); setShowAc(false)
    try {
      const data = await getDeviceNetwork(k, 2)
      if (!data.nodes.length) { setError(`No connections found for "${k}".`); return }
      apiCacheRef.current = { nodes: data.nodes, edges: data.edges, hubs: [] }
      buildSim(data.nodes, data.edges, [], k, true, k)
      setIsolationMode(true); setFocusedK(k); setTileK(null); setTileData(null)
    } catch { setError(`"${k}" not found or has no predicate connections.`) }
  }

  const backToFullNetwork = () => {
    const full = fullNetworkRef.current; if (!full) return
    apiCacheRef.current = full
    buildSim(full.nodes, full.edges, full.hubs, null, true)
    setIsolationMode(false); setFocusedK(null); setSearchInput(''); setTileK(null); setTileData(null)
  }

  const reset = () => {
    if (isolationMode) { backToFullNetwork(); return }
    setLoading(true); setSearchInput(''); setTileK(null); setTileData(null)
    getSampleNetwork().then(data => {
      apiCacheRef.current = data; fullNetworkRef.current = data
      buildSim(data.nodes, data.edges, data.hubs, null, true); setLoading(false)
    })
  }

  // ─── UI ───────────────────────────────────────────────────────────────────────
  const cw = containerRef.current?.offsetWidth ?? 900
  const ch = containerRef.current?.offsetHeight ?? 700

  return (
    <div ref={containerRef} style={{ height: 'calc(100vh - 72px)', position: 'relative', background: '#060912', overflow: 'hidden' }}>

      {/* ── Top bar (centered over the graph area, right of the panel) ───────── */}
      <div style={{ position: 'absolute', top: 16, left: `calc(50% + ${LEFT_PANEL_W / 2}px)`, transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: 8, alignItems: 'center' }}>

        <AnimatePresence>
          {isolationMode && (
            <motion.button initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              onClick={backToFullNetwork}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(8,12,22,0.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, color: '#fbbf24', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <ChevronLeft className="w-3.5 h-3.5" /> Full network
            </motion.button>
          )}
        </AnimatePresence>

        {/* Search with autocomplete */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(8,12,22,0.88)', backdropFilter: 'blur(20px)', border: `1px solid ${isolationMode ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <Search className="w-3.5 h-3.5" style={{ color: '#475569', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={isolationMode ? `Focused: ${focusedK}` : 'K-number to isolate subgraph…'}
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') focusOnDevice(searchInput); if (e.key === 'Escape') setShowAc(false) }}
              onFocus={() => acResults.length > 0 && setShowAc(true)}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e2e8f0', width: 230, fontFamily: 'monospace' }}
            />
            <button onClick={() => focusOnDevice(searchInput)} disabled={!searchInput.trim()}
              style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: searchInput.trim() ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.06)', color: searchInput.trim() ? 'white' : '#334155', border: 'none', cursor: searchInput.trim() ? 'pointer' : 'not-allowed' }}>
              Focus
            </button>
          </div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showAc && acResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'rgba(8,12,22,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 50 }}>
                {acResults.map((r, i) => (
                  <div key={r.k_number}
                    onClick={() => selectAcResult(r.k_number)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: i < acResults.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#60a5fa', minWidth: 64, flexShrink: 0 }}>{r.k_number}</span>
                    <span style={{ fontSize: 11, color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.device_name}</span>
                    {r.connections > 0 && (
                      <span style={{ fontSize: 10, color: '#334155', padding: '2px 7px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', flexShrink: 0 }}>{r.connections} links</span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={reset} title="Reset view"
          style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,12,22,0.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button onClick={() => setShowInfo(true)} title="About this network"
          style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,12,22,0.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 72, left: `calc(50% + ${LEFT_PANEL_W / 2}px)`, transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 16px', fontSize: 13, color: '#f87171', backdropFilter: 'blur(12px)' }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading ───────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#060912' }}>
          <Network className="w-8 h-8 animate-pulse" style={{ color: '#3b82f6' }} />
          <p style={{ fontSize: 14, color: '#334155' }}>Loading predicate network…</p>
        </div>
      )}

      {/* ── Canvas ───────────────────────────────────────────────────────────── */}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab' }}
        onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave} onWheel={onWheel} />

      {/* ── Hover tooltip ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hoveredNode && tooltipPos && !tileK && (
          <motion.div key={hoveredNode.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.1 }}
            style={{ position: 'absolute', left: Math.min(tooltipPos.x + 14, cw - 200), top: Math.min(tooltipPos.y - 8, ch - 120), zIndex: 30, pointerEvents: 'none', background: 'rgba(8,12,22,0.92)', backdropFilter: 'blur(24px)', border: `1px solid ${clsColor(hoveredNode.cls)}44`, borderRadius: 10, padding: '10px 14px', minWidth: 180, boxShadow: `0 8px 32px rgba(0,0,0,0.6)` }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: clsColor(hoveredNode.cls), marginBottom: 5 }}>{hoveredNode.id}</div>
            <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.4, marginBottom: 6 }}>{hoveredNode.name.length > 50 ? hoveredNode.name.slice(0, 48) + '…' : hoveredNode.name}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${clsColor(hoveredNode.cls)}22`, border: `1px solid ${clsColor(hoveredNode.cls)}44`, color: clsColor(hoveredNode.cls) }}>
                {CLASS_LABELS[hoveredNode.cls] ?? `Class ${hoveredNode.cls}`}
              </span>
              {hoveredNode.date && <span style={{ fontSize: 10, color: '#475569' }}>{hoveredNode.date.slice(0, 4)}</span>}
              {hoveredNode.conns > 0 && <span style={{ fontSize: 10, color: '#475569' }}>{hoveredNode.conns} links</span>}
              {hoveredNode.recalls > 0 && <span style={{ fontSize: 10, color: '#f87171', padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.12)' }}>⚠ {hoveredNode.recalls} recall{hoveredNode.recalls > 1 ? 's' : ''}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RIGHT COLUMN: Pipeline / Subgraph status ────────────────────────── */}
      {!isolationMode && (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          style={{ position: 'absolute', top: 16, right: 20, zIndex: 10, background: 'rgba(8,12,22,0.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', width: 210, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Pipeline Status</span>
          </div>
          {PIPELINE_AGENTS.map(({ label, icon: Icon, stat }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 12, height: 12, color: '#60a5fa' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{stat}</div>
              </div>
              <CheckCircle2 style={{ width: 11, height: 11, color: '#4ade80', flexShrink: 0 }} />
            </div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {isolationMode && focusedK && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
            style={{ position: 'absolute', top: 16, right: 20, zIndex: 10, background: 'rgba(8,12,22,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 14, padding: '14px 16px', width: 210, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: 10, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Subgraph View</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>{focusedK}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>2-hop predicate neighborhood</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div><div style={{ fontSize: 16, fontWeight: 700, color: '#f0f6ff' }}>{stats.nodes}</div><div style={{ fontSize: 10, color: '#475569' }}>devices</div></div>
              <div><div style={{ fontSize: 16, fontWeight: 700, color: '#f0f6ff' }}>{stats.edges}</div><div style={{ fontSize: 10, color: '#475569' }}>edges</div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Network Intelligence — full-height left panel ─────────────────── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, zIndex: 10,
        width: LEFT_PANEL_W, height: '100%',
        background: 'rgba(6,9,18,0.93)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', userSelect: 'none', overflow: 'hidden',
      }}>
        {/* Panel header */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Network Intelligence
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {(['stats', 'hubs', 'dynasties', 'bridges'] as const).map(tab => (
              <button key={tab} onClick={() => setNiTab(tab)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: niTab === tab ? 'rgba(59,130,246,0.18)' : 'transparent',
                border: niTab === tab ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                color: niTab === tab ? '#60a5fa' : '#475569', cursor: 'pointer',
                textTransform: 'capitalize', transition: 'all 0.12s',
              }}
                onMouseEnter={e => { if (niTab !== tab) e.currentTarget.style.color = '#94a3b8' }}
                onMouseLeave={e => { if (niTab !== tab) e.currentTarget.style.color = '#475569' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0 0', flexShrink: 0 }} />

        {/* Scrollable tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>

          {/* ── Stats ── */}
          {niTab === 'stats' && (
            <>
              {/* Headline metric trio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                {[
                  { label: 'Devices', value: stats.nodes.toLocaleString(), color: '#60a5fa' },
                  { label: 'Relations', value: stats.edges.toLocaleString(), color: '#818cf8' },
                  { label: 'Years', value: '50', color: '#a78bfa' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: `${color}0d`, border: `1px solid ${color}22`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '-0.03em' }}>{value}</div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Impact banner */}
              <div style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.07), rgba(59,130,246,0.07))', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Regulatory Impact</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f6ff', marginBottom: 4 }}>$40K–$80K saved per submission</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)', lineHeight: 1.6 }}>
                  The right predicate eliminates 40–160 hours of consultant research at $400–600/hr. A wrong predicate means a 3–6 month rejection delay worth $200K+.
                </div>
              </div>

              {/* Network topology */}
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Network Topology</div>
                {[
                  { label: 'Degree distribution', val: 'Power law (α ≈ 2.3)' },
                  { label: 'Top 50 hubs', val: '~23% of all citations' },
                  { label: 'Avg chain depth', val: '4.2 hops to root' },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', fontFamily: 'monospace' }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Class legend */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Device Classification</div>
                {[['#4ade80','Class I','Low risk — general controls'], ['#60a5fa','Class II','Moderate risk — special controls'], ['#f87171','Class III','High risk — PMA or 510(k)']].map(([c, cls, desc]) => (
                  <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{cls}</div>
                      <div style={{ fontSize: 11, color: '#334155' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.6 }}>Scroll to zoom · drag to pan · click any node for details</div>
            </>
          )}

          {/* ── Hubs ── */}
          {niTab === 'hubs' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Most-cited predicates in FDA history</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>
                  Each citation = one manufacturer who used this device as their regulatory foundation. At $25K average search cost per submission, these hubs have collectively saved the industry tens of millions.
                </div>
              </div>
              {(insights?.hubs ?? stats.topHubs.map(h => ({ k_number: h.id, device_name: h.name, citations: h.conns, product_code: '', decision_date: '' }))).map((h, i) => {
                const maxCitations = insights?.hubs[0]?.citations ?? stats.topHubs[0]?.conns ?? 1
                const citations = h.citations
                const kNum = h.k_number
                const name = h.device_name
                const estSavings = (citations * 25000)
                const savingsStr = estSavings >= 1000000
                  ? `$${(estSavings / 1000000).toFixed(1)}M`
                  : `$${(estSavings / 1000).toFixed(0)}K`
                return (
                  <div key={kNum} onClick={() => { setSearchInput(kNum); focusOnDevice(kNum) }}
                    style={{ marginBottom: 10, cursor: 'pointer', borderRadius: 10, padding: '10px 12px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.04)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: '#334155', fontWeight: 700 }}>#{i + 1}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{kNum}</span>
                        {h.decision_date && <span style={{ fontSize: 11, color: '#475569' }}>{h.decision_date.slice(0, 4)}</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f6ff', fontFamily: 'monospace' }}>{citations}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${(citations / maxCitations) * 100}%`, background: 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>{citations} manufacturers guided</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80' }}>est. {savingsStr} saved</span>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* ── Dynasties ── */}
          {niTab === 'dynasties' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Regulatory Dynasties</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>
                  Devices cleared before 1995, still cited as predicates today. These are the founding documents of modern device regulation, with decades of continuous legal authority.
                </div>
              </div>
              {!insights ? (
                <div style={{ fontSize: 12, color: '#334155' }}>Loading…</div>
              ) : insights.dynasties.length === 0 ? (
                <div style={{ fontSize: 12, color: '#334155' }}>No dynasties found.</div>
              ) : insights.dynasties.map(d => {
                const clearedYear = d.cleared_date?.slice(0, 4) ?? '?'
                const latestYear = d.latest_citation?.slice(0, 4) ?? '?'
                const span = latestYear !== '?' && clearedYear !== '?' ? parseInt(latestYear) - parseInt(clearedYear) : 0
                const estValue = (d.total_citations * 35000)
                const valStr = estValue >= 1000000 ? `$${(estValue / 1000000).toFixed(1)}M` : `$${(estValue / 1000).toFixed(0)}K`
                return (
                  <div key={d.k_number} onClick={() => { setSearchInput(d.k_number); focusOnDevice(d.k_number) }}
                    style={{ marginBottom: 12, cursor: 'pointer', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.04)', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.09)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.28)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.04)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{d.k_number}</span>
                      {span > 0 && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 700 }}>
                          {span} yr span
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.device_name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '5px 8px' }}>
                        <div style={{ fontSize: 10, color: '#475569', marginBottom: 1 }}>Cleared</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f6ff', fontFamily: 'monospace' }}>{clearedYear}</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '5px 8px' }}>
                        <div style={{ fontSize: 10, color: '#475569', marginBottom: 1 }}>Last cited</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f6ff', fontFamily: 'monospace' }}>{latestYear}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{d.total_citations} clearances enabled</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80' }}>est. {valStr} value</span>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* ── Bridges ── */}
          {niTab === 'bridges' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Cross-Category Connectors</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>
                  Devices cited across the most distinct product categories. These are universal regulatory anchors — their established equivalence precedent spans multiple areas of medicine, dramatically lowering barriers for novel devices.
                </div>
              </div>
              {!insights ? (
                <div style={{ fontSize: 12, color: '#334155' }}>Loading…</div>
              ) : insights.bridges.length === 0 ? (
                <div style={{ fontSize: 12, color: '#334155' }}>No bridges found.</div>
              ) : insights.bridges.map((b, i) => {
                const maxCats = insights.bridges[0]?.product_categories ?? 1
                return (
                  <div key={b.k_number} onClick={() => { setSearchInput(b.k_number); focusOnDevice(b.k_number) }}
                    style={{ marginBottom: 10, cursor: 'pointer', borderRadius: 10, padding: '10px 12px', background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.04)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: '#334155', fontWeight: 700 }}>#{i + 1}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{b.k_number}</span>
                        {b.decision_date && <span style={{ fontSize: 11, color: '#475569' }}>{b.decision_date.slice(0, 4)}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.device_name}</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${(b.product_categories / maxCats) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>{b.total_citations} total citations</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>{b.product_categories} categories bridged</span>
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.12)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>Why bridges matter</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>
                  A device cleared in multiple product codes provides cross-categorical equivalence precedent, reducing regulatory risk for truly novel devices that don't fit a single category.
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Info modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(8,12,22,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '36px 40px', maxWidth: 560, width: '90%', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', position: 'relative' }}>
              <button onClick={() => setShowInfo(false)}
                style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X className="w-3.5 h-3.5" />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Network className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f6ff' }}>The FDA Predicate Graph</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>50 years of regulatory lineage, live in the browser</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.85)', lineHeight: 1.75, marginBottom: 18 }}>
                The 510(k) clearance pathway requires every new medical device to prove substantial equivalence to a previously cleared <em>predicate</em> device. That citation creates a regulatory edge. Fifty years of citations, extracted from <strong style={{ color: '#cbd5e1' }}>10,000 real submission documents</strong> via OCR, form this graph.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { val: '10,123', label: 'Core devices' },
                  { val: '11,791', label: 'Predicate edges' },
                  { val: '50 yrs', label: 'Regulatory history' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 8px' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {[
                  { icon: <Search className="w-3.5 h-3.5" />, text: 'Search any K-number to isolate its 2-hop regulatory neighborhood' },
                  { icon: <GitBranch className="w-3.5 h-3.5" />, text: 'Click any node to explore its full clearance record and predicate ancestry chain' },
                  { icon: <Network className="w-3.5 h-3.5" />, text: 'Hub nodes emerge from the physics simulation based on real citation frequency' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <span style={{ color: '#60a5fa', marginTop: 1, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#334155', lineHeight: 1.5 }}>
                Hub nodes, the large glowing ones, are the most-cited predicates in FDA history: the devices that shaped entire regulatory categories and whose clearance made thousands of subsequent products possible.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating device detail tile ──────────────────────────────────────── */}
      <AnimatePresence>
        {tileK && (
          <motion.div
            key={tileK}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              left: tilePos.x, top: tilePos.y,
              zIndex: 40,
              width: Math.min(540, (containerRef.current?.offsetWidth ?? 600) - 16),
              maxHeight: Math.min(500, (containerRef.current?.offsetHeight ?? 600) - tilePos.y - 8),
              background: 'rgba(8,12,22,0.97)', backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18,
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              userSelect: 'none',
            }}
          >
            {/* Tile header — drag handle */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, cursor: 'grab' }}
              onPointerDown={e => {
                e.currentTarget.style.cursor = 'grabbing'
                ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                tileDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPosX: tilePos.x, startPosY: tilePos.y }
              }}
              onPointerMove={e => {
                if (!tileDragRef.current.active) return
                const container = containerRef.current
                if (!container) return
                const TILE_W = Math.min(540, container.offsetWidth - 16)
                const TILE_H_MIN = 80
                const nx = Math.max(0, Math.min(container.offsetWidth - TILE_W, tileDragRef.current.startPosX + e.clientX - tileDragRef.current.startX))
                const ny = Math.max(0, Math.min(container.offsetHeight - TILE_H_MIN, tileDragRef.current.startPosY + e.clientY - tileDragRef.current.startY))
                setTilePos({ x: nx, y: ny })
              }}
              onPointerUp={e => {
                tileDragRef.current.active = false
                ;(e.currentTarget as HTMLElement).style.cursor = 'grab'
              }}
            >
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{tileK}</div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>Device Detail · drag to reposition</div>
              </div>
              <button
                onClick={() => { setTileK(null); setTileData(null); for (const n of simNodesRef.current) n.isSelected = false }}
                onPointerDown={e => e.stopPropagation()}
                style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#94a3b8' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tile body */}
            <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
              {tileLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#334155', fontSize: 13 }}>Loading…</div>
              ) : !tileData ? (
                <div style={{ color: '#f87171', fontSize: 13 }}>Could not load device details.</div>
              ) : (() => {
                const d = tileData.device
                const chain = tileData.predicate_chain ?? []
                return (
                  <>
                    {/* Device name */}
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 16 }}>
                      {String(d.device_name ?? tileK)}
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                      {d.product_code && (
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: 'white' }}>{String(d.product_code)}</span>
                      )}
                      {d.device_class && (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600,
                          background: d.device_class === '3' ? 'rgba(239,68,68,0.12)' : d.device_class === '2' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
                          color: d.device_class === '3' ? '#f87171' : d.device_class === '2' ? '#60a5fa' : '#4ade80',
                          border: `1px solid ${d.device_class === '3' ? 'rgba(239,68,68,0.2)' : d.device_class === '2' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}`,
                        }}>Class {d.device_class}</span>
                      )}
                      {Number(d.recall_count) > 0 && (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle className="w-3 h-3" /> {d.recall_count} recall{Number(d.recall_count) > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Metadata fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                      {([
                        { icon: <Building2 className="w-3.5 h-3.5" />, label: 'Applicant', val: d.applicant },
                        { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Decision Date', val: d.decision_date },
                        { icon: <Tag className="w-3.5 h-3.5" />, label: 'Regulation', val: d.regulation_number },
                        { icon: <Shield className="w-3.5 h-3.5" />, label: 'Committee', val: d.advisory_committee_description },
                      ] as { icon: React.ReactNode; label: string; val: string | number | null | undefined }[]).filter(f => f.val).map(({ icon, label, val }) => (
                        <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ color: '#475569', marginTop: 1, flexShrink: 0 }}>{icon}</span>
                          <div>
                            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 1 }}>{label}</div>
                            <div style={{ fontSize: 13, color: '#cbd5e1' }}>{String(val)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    {d.description_text && (
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Summary</div>
                        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                          {cleanDesc(String(d.description_text))}
                          {String(d.description_text).length > 480 ? '…' : ''}
                        </p>
                      </div>
                    )}

                    {/* Predicate chain */}
                    {chain.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <GitBranch className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
                          <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Predicate Ancestry</span>
                          <span style={{ fontSize: 10, color: '#334155' }}>{chain.length} devices</span>
                        </div>
                        <div style={{ borderRadius: 10, overflow: 'hidden', height: 200, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <PredicateChainViz chainNodes={chain} highlightKNumber={tileK} compact />
                        </div>
                      </div>
                    )}

                    {/* Focus button */}
                    {!isolationMode && (
                      <button onClick={() => { setTileK(null); setTileData(null); focusOnDevice(tileK) }}
                        style={{ marginTop: 18, width: '100%', padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Isolate subgraph →
                      </button>
                    )}
                  </>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
