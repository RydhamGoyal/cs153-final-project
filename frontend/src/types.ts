export interface DeviceRecord {
  k_number: string
  device_name: string
  applicant?: string
  product_code?: string
  decision_date?: string
  device_class?: string
  regulation_number?: string
  has_recall: boolean
  recall_count: number
  similarity_score?: number
  composite_score?: number
}

export interface PredicateChainNode {
  k_number: string
  device_name: string
  decision_date?: string
  applicant?: string
  product_code?: string
  has_recall: boolean
  depth: number
}

export interface SEAnalysis {
  candidate_k_number: string
  candidate_name: string
  same_intended_use: boolean
  same_intended_use_explanation: string
  same_technological_characteristics: boolean
  technological_differences: string[]
  raises_safety_questions: boolean
  safety_concerns?: string[]
  additional_testing_required: string[]
  se_likelihood_score: number
  recommendation: 'strong' | 'viable' | 'weak' | 'not_recommended'
  recommendation_reasoning?: string
}

export interface PredicateCandidate {
  k_number: string
  name: string
  se_score: number
}

export interface Recommendation {
  recommended_predicate_k_number: string
  recommended_predicate_name: string
  narrative_summary: string
  confidence_level: 'high' | 'medium' | 'low'
  key_risks: string[]
  required_testing: string[]
  alternative_predicates: string[]
  predicate_candidates: PredicateCandidate[]
}

export interface Classification {
  product_code: string
  device_class: string
  regulation_number: string
  advisory_committee: string
  advisory_committee_description: string
  confidence: string
  reasoning: string
  db_device_name?: string
}

export interface ProcessingStep {
  step: string
  label: string
  duration_ms: number
  data: Record<string, unknown>
}

export interface AnalysisResult {
  classification: Classification
  candidates: DeviceRecord[]
  predicate_chains: Record<string, PredicateChainNode[]>
  se_analysis: SEAnalysis[]
  recommendation: Recommendation
  processing_steps: ProcessingStep[]
  model_info?: { requested: string; used: string }
}

export interface EvalMetrics {
  n_evaluated: number
  'hit@1': number
  'hit@3': number
  'hit@5': number
  mrr: number
}

export interface HistoryEntry {
  id: string
  deviceDescription: string
  indicationsForUse: string
  result: AnalysisResult
  timestamp: number
}
