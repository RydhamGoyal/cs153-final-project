import axios from 'axios'
import type { AnalysisResult, EvalMetrics } from './types'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

export type ModelMode = 'openrouter' | 'finetuned'

export async function analyzeDevice(
  deviceDescription: string,
  indicationsForUse: string,
  modelMode: ModelMode = 'openrouter',
): Promise<AnalysisResult> {
  const response = await api.post<AnalysisResult>('/analyze', {
    device_description: deviceDescription,
    indications_for_use: indicationsForUse,
    model_mode: modelMode,
  })
  return response.data
}

export async function getDeviceChain(kNumber: string) {
  const response = await api.get(`/chain/${kNumber}`)
  return response.data
}

export async function getEvalResults(): Promise<EvalMetrics | { message: string }> {
  const response = await api.get('/eval/results')
  return response.data
}

export async function getHealth() {
  const response = await api.get('/health')
  return response.data
}

export async function autocompleteDevices(q: string, limit = 8) {
  const response = await api.get('/devices/autocomplete', { params: { q, limit } })
  return response.data as { k_number: string; device_name: string; connections: number }[]
}

export async function searchDevices(params: {
  search?: string
  product_code?: string
  device_class?: string
  page?: number
  limit?: number
}) {
  const response = await api.get('/devices', { params })
  return response.data as {
    total: number
    page: number
    limit: number
    devices: DeviceRow[]
  }
}

export async function getSampleNetwork() {
  const response = await api.get('/network/sample')
  return response.data as {
    hubs: string[]
    nodes: NetworkNode[]
    edges: NetworkEdge[]
  }
}

export async function getDeviceNetwork(kNumber: string, hops = 2) {
  const response = await api.get(`/network/${kNumber}`, { params: { hops } })
  return response.data as {
    center: string
    nodes: NetworkNode[]
    edges: NetworkEdge[]
  }
}

export async function getDevice(kNumber: string) {
  const response = await api.get(`/device/${kNumber}`)
  return response.data
}

export interface DeviceRow {
  k_number: string
  device_name: string
  applicant: string
  product_code: string
  device_class: string
  decision_date: string
  regulation_number: string
  advisory_committee_description: string
  recall_count: number
}

export interface NetworkNode {
  k_number: string
  device_name: string
  applicant: string
  product_code: string
  decision_date: string
  device_class: string
  recall_count?: number
}

export interface NetworkEdge {
  k_number: string
  predicate_k_number: string
}

export interface NetworkInsights {
  hubs: { k_number: string; device_name: string; product_code: string; decision_date: string; citations: number }[]
  dynasties: { k_number: string; device_name: string; product_code: string; cleared_date: string; total_citations: number; latest_citation: string }[]
  bridges: { k_number: string; device_name: string; decision_date: string; product_categories: number; total_citations: number }[]
  activity: { product_code: string; recent_clearances: number; latest_date: string }[]
}

export async function getNetworkInsights(): Promise<NetworkInsights> {
  const response = await api.get('/network/insights')
  return response.data
}
