import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Check } from 'lucide-react'
import App from '../App'
import { Sidebar } from '../components/Sidebar'
import { useNavigatorRun } from '../context/NavigatorRunContext'
import type { AnalysisResult, HistoryEntry } from '../types'

interface Example {
  label: string
  emoji: string
  category: string
  blurb: string
  deviceDescription: string
  indicationsForUse: string
}

const EXAMPLES: Example[] = [
  {
    label: 'Pulse Oximeter',
    emoji: '🫁',
    category: 'Cardiovascular & Monitoring',
    blurb: 'SpO2 monitoring · Class II · product code DQA',
    deviceDescription: 'Fingertip clip-style pulse oximeter using dual-wavelength photoplethysmography (660nm red / 940nm infrared LEDs with photodetector). Measures arterial oxygen saturation (SpO2) and pulse rate. OLED display. Battery operated. Adult and pediatric use.',
    indicationsForUse: 'Non-invasive measurement of arterial oxygen saturation (SpO2) and pulse rate in adult and pediatric patients in clinical and home settings.',
  },
  {
    label: 'ECG Monitor (Wearable Patch)',
    emoji: '❤️',
    category: 'Cardiovascular & Monitoring',
    blurb: 'Single-lead arrhythmia detection · Class II',
    deviceDescription: 'Wearable single-lead ECG monitor in patch form factor. Continuous ambulatory recording up to 14 days. Dry electrodes, no gel required. Automatic arrhythmia detection algorithm (AFib, bradycardia, tachycardia). Stores raw ECG data transmitted via Bluetooth.',
    indicationsForUse: 'Ambulatory ECG monitoring for detection of cardiac arrhythmias in adult patients over extended periods.',
  },
  {
    label: 'Automated External Defibrillator',
    emoji: '⚡',
    category: 'Cardiovascular & Monitoring',
    blurb: 'AED · biphasic shock · Class III',
    deviceDescription: 'Portable automated external defibrillator (AED) with biphasic truncated exponential waveform delivering 150–360 J. Real-time ECG rhythm analysis algorithm identifies shockable rhythms (VF, pulseless VT). Voice and visual prompts guide rescuer through CPR and shock delivery. Self-test capability.',
    indicationsForUse: 'Treatment of victims of sudden cardiac arrest exhibiting ventricular fibrillation or pulseless ventricular tachycardia by trained and lay rescuers.',
  },
  {
    label: 'Blood Pressure Monitor',
    emoji: '🩺',
    category: 'Cardiovascular & Monitoring',
    blurb: 'Oscillometric · automatic cuff · Class II',
    deviceDescription: 'Automatic upper-arm blood pressure monitor using the oscillometric method. Inflatable cuff with pressure transducer measures systolic and diastolic pressure and pulse rate. Irregular heartbeat detection. Memory for two users, 100 readings each. Bluetooth sync.',
    indicationsForUse: 'Non-invasive measurement of systolic and diastolic blood pressure and pulse rate in adult patients in home and clinical settings.',
  },
  {
    label: 'Blood Glucose Meter',
    emoji: '🩸',
    category: 'Diabetes & IVD',
    blurb: 'Electrochemical strips · Class II · product code NBW',
    deviceDescription: 'Handheld electrochemical glucose meter using enzyme-based biosensor test strips. Requires 0.5 µL capillary whole blood. Reports glucose in mg/dL (20–600 range) within 5 seconds. Stores 500 readings with date/time stamps. Bluetooth sync to mobile app.',
    indicationsForUse: 'Quantitative self-monitoring of blood glucose in capillary whole blood for people with diabetes.',
  },
  {
    label: 'Continuous Glucose Monitor',
    emoji: '📈',
    category: 'Diabetes & IVD',
    blurb: 'CGM · subcutaneous sensor · Class II',
    deviceDescription: 'Factory-calibrated continuous glucose monitoring system with a subcutaneous wire-based amperometric glucose-oxidase sensor worn for 14 days. Transmits interstitial glucose readings every 5 minutes to a smartphone via Bluetooth Low Energy. Trend arrows and configurable high/low alerts.',
    indicationsForUse: 'Continuous monitoring of interstitial fluid glucose levels in persons with diabetes mellitus to aid in glycemic management.',
  },
  {
    label: 'Insulin Infusion Pump',
    emoji: '💉',
    category: 'Drug Delivery',
    blurb: 'Ambulatory · basal/bolus · Class II',
    deviceDescription: 'Wearable ambulatory insulin infusion pump delivering rapid-acting insulin subcutaneously via a disposable cannula. Programmable basal rates (0.025–25 U/hr) and bolus dosing with an integrated bolus calculator. Occlusion detection, low-reservoir alerts, and Bluetooth connectivity to a controller app.',
    indicationsForUse: 'Continuous subcutaneous delivery of insulin at set and variable rates for the management of diabetes mellitus in persons requiring insulin.',
  },
  {
    label: 'CPAP Machine',
    emoji: '😴',
    category: 'Respiratory',
    blurb: 'Sleep apnea therapy · Class II',
    deviceDescription: 'Continuous positive airway pressure (CPAP) device delivering pressurized air (4–20 cmH2O) through a nasal/full-face mask. Features automatic pressure adjustment (APAP mode), integrated heated humidifier, Bluetooth compliance data recording, and ramp-up function.',
    indicationsForUse: 'Treatment of obstructive sleep apnea in adult patients in home and clinical settings.',
  },
  {
    label: 'Nebulizer',
    emoji: '🌬️',
    category: 'Respiratory',
    blurb: 'Aerosol drug delivery · Class II',
    deviceDescription: 'Portable vibrating mesh nebulizer that aerosolizes liquid medication into a fine mist (mass median aerodynamic diameter ~3.5 µm) for pulmonary delivery. Battery powered, near-silent operation, with a breath-actuated mode to reduce medication waste.',
    indicationsForUse: 'Delivery of aerosolized medications to the lungs of pediatric and adult patients with respiratory conditions such as asthma and COPD.',
  },
  {
    label: 'Coronary Stent',
    emoji: '🫀',
    category: 'Implants & Surgical',
    blurb: 'Drug-eluting · cobalt-chromium · Class III',
    deviceDescription: 'Balloon-expandable drug-eluting coronary stent fabricated from a cobalt-chromium alloy scaffold coated with a biodegradable polymer eluting everolimus. Available in 2.25–4.0 mm diameters. Mounted on a rapid-exchange delivery catheter.',
    indicationsForUse: 'Improving coronary luminal diameter in patients with symptomatic ischemic heart disease due to de novo native coronary artery lesions.',
  },
  {
    label: 'Total Hip Implant',
    emoji: '🦴',
    category: 'Implants & Surgical',
    blurb: 'Orthopedic · titanium/ceramic · Class III',
    deviceDescription: 'Total hip arthroplasty system comprising a titanium-alloy femoral stem with a porous coating for cementless fixation, a ceramic femoral head, and a highly cross-linked polyethylene acetabular liner within a titanium shell. Modular neck options.',
    indicationsForUse: 'Total hip replacement in patients with non-inflammatory degenerative joint disease, rheumatoid arthritis, or fracture of the femoral head.',
  },
  {
    label: 'Surgical Stapler',
    emoji: '🔧',
    category: 'Implants & Surgical',
    blurb: 'Endoscopic linear cutter · Class II',
    deviceDescription: 'Powered endoscopic linear cutting surgical stapler that simultaneously transects tissue and places multiple rows of titanium staples. Articulating reloadable cartridges in varying staple heights for different tissue thicknesses. Designed for laparoscopic and open procedures.',
    indicationsForUse: 'Resection, transection, and creation of anastomoses in general, gynecologic, thoracic, and pediatric surgery.',
  },
  {
    label: 'Intraocular Lens',
    emoji: '👁️',
    category: 'Implants & Surgical',
    blurb: 'Foldable acrylic · cataract · Class II',
    deviceDescription: 'Single-piece foldable hydrophobic acrylic posterior-chamber intraocular lens with UV-blocking chromophore and aspheric optic. Implanted in the capsular bag following phacoemulsification. Available in 6.0–30.0 D powers.',
    indicationsForUse: 'Replacement of the natural crystalline lens in adult patients undergoing cataract surgery to restore visual acuity.',
  },
  {
    label: 'Hearing Aid',
    emoji: '👂',
    category: 'ENT & Other',
    blurb: 'Digital RIC · self-fitting · Class II',
    deviceDescription: 'Receiver-in-canal digital hearing aid with a multi-channel wide dynamic range compression amplifier, adaptive directional microphones, and digital noise reduction. Self-fitting via a smartphone app with in-situ audiometry. Rechargeable lithium-ion battery.',
    indicationsForUse: 'Compensation for mild to moderate sensorineural hearing impairment in adults.',
  },
  {
    label: 'Digital Thermometer',
    emoji: '🌡️',
    category: 'ENT & Other',
    blurb: 'Infrared tympanic · Class II',
    deviceDescription: 'Handheld infrared tympanic thermometer measuring emitted thermal radiation from the tympanic membrane and surrounding ear canal. Provides a reading in approximately one second with ±0.2 °C accuracy. Disposable probe covers, fever indicator, last-reading memory.',
    indicationsForUse: 'Intermittent measurement of human body temperature in patients of all ages in home and clinical settings.',
  },
]

const STORAGE_KEY = '510k-history'
const MAX_HISTORY = 20

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export function NavigatorPage() {
  const { run, modelMode, setModelMode } = useNavigatorRun()
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [preloaded, setPreloaded] = useState<{
    result?: AnalysisResult | null
    description?: string
    ifu?: string
  }>({})

  // Save completed run to history — deduplicated by runId so remounts don't double-save
  useEffect(() => {
    if (!run.result || run.isRunning || !run.runId) return
    if (history.some(h => h.id === run.runId)) return
    const entry: HistoryEntry = {
      id: run.runId,
      deviceDescription: run.description,
      indicationsForUse: run.ifu,
      result: run.result,
      timestamp: Date.now(),
    }
    const updated = [entry, ...history].slice(0, MAX_HISTORY)
    setHistory(updated)
    setActiveId(run.runId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.runId, run.isRunning])

  const [selectedExample, setSelectedExample] = useState<string | null>(null)

  // When a new run starts, stop showing any previously selected history entry
  useEffect(() => {
    if (run.isRunning) {
      setPreloaded(p => ({ ...p, result: undefined }))
      setActiveId(null)
    }
  }, [run.isRunning])

  const handleSelectHistory = (entry: HistoryEntry) => {
    setActiveId(entry.id)
    setPreloaded({ result: entry.result, description: entry.deviceDescription, ifu: entry.indicationsForUse })
  }

  const handleClearHistory = () => {
    if (confirm('Clear all history?')) {
      setHistory([])
      setActiveId(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const loadExample = (ex: Example) => {
    setPreloaded({ result: null, description: ex.deviceDescription, ifu: ex.indicationsForUse })
    setActiveId(null)
    setSelectedExample(ex.label)
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

      {/* History sidebar — overlaid on the left so it never shifts the centered
          content column. The center of the page stays fixed whether it's open or not. */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 30, display: 'flex' }}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          entries={history}
          activeId={activeId}
          onSelect={handleSelectHistory}
          onClear={handleClearHistory}
        />
      </div>

      {/* Main content — full width; the inner column is centered on the viewport
          and does not move when the sidebar opens. */}
      <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Guided intro */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 0' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Zap className="w-4 h-4" style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                How to use Vera
              </span>
              {/* Model selector — switch inference between OpenRouter Llama and the fine-tuned Qwen */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>SE Model</span>
                <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', opacity: run.isRunning ? 0.5 : 1 }}>
                  {([
                    { mode: 'openrouter' as const, label: 'Llama 3.3 70B', color: '#60a5fa' },
                    { mode: 'finetuned' as const, label: 'Fine-tuned Qwen', color: '#818cf8' },
                  ]).map(opt => {
                    const active = modelMode === opt.mode
                    return (
                      <button key={opt.mode} disabled={run.isRunning}
                        onClick={() => setModelMode(opt.mode)}
                        title={opt.mode === 'finetuned'
                          ? 'Qwen2.5-7B fine-tuned on 7,500 FDA SE examples (served on Modal)'
                          : 'Meta Llama 3.3 70B via OpenRouter (free, always warm)'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 100,
                          fontSize: 11, fontWeight: 600, border: 'none',
                          cursor: run.isRunning ? 'not-allowed' : 'pointer',
                          background: active ? `${opt.color}26` : 'transparent',
                          color: active ? opt.color : '#475569', transition: 'all 0.12s',
                        }}>
                        {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px #4ade80' }} />}
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6ff', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Describe your device, get your predicate
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.75)', lineHeight: 1.7, marginBottom: 20 }}>
              Enter a technical description of your medical device and its indications for use.
              Vera's 5-agent pipeline will classify it, search 174,000 FDA-cleared devices,
              map its predicate ancestry chain back to 1976, analyze substantial equivalence,
              and return a structured regulatory recommendation, in under 30 seconds.
            </p>

          </motion.div>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                Select from {EXAMPLES.length} example devices to see the product in action
              </p>
              {selectedExample && (
                <span style={{ fontSize: 11, color: '#475569' }}>Loaded below — hit Analyze Device ↓</span>
              )}
            </div>

            {/* Example-device grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {EXAMPLES.map(ex => {
                const active = selectedExample === ex.label
                return (
                  <motion.button
                    key={ex.label}
                    onClick={() => loadExample(ex)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      position: 'relative', textAlign: 'left', cursor: 'pointer',
                      background: active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 12, padding: '11px 13px', transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.28)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', top: 9, right: 9, width: 16, height: 16, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check style={{ width: 10, height: 10, color: '#60a5fa' }} />
                      </div>
                    )}
                    <div style={{ fontSize: 19, marginBottom: 6 }}>{ex.emoji}</div>
                    <div style={{
                      fontSize: 12.5, fontWeight: 600, color: active ? '#bfdbfe' : '#cbd5e1',
                      lineHeight: 1.25, marginBottom: 4,
                      height: 31, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{ex.label}</div>
                    <div style={{ fontSize: 10.5, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.blurb}</div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* The analysis tool */}
        <App
          preloadedResult={preloaded.result}
          preloadedDescription={preloaded.description}
          preloadedIfu={preloaded.ifu}
        />
      </div>
    </div>
  )
}
