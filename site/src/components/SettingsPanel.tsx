import { useState } from 'react'
import type { ViewSettings } from '../types'

interface Props {
  settings: ViewSettings
  onChange: (settings: ViewSettings) => void
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4.5 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-[var(--border)]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${checked ? 'translate-x-3.5' : ''}`} />
      </button>
    </label>
  )
}

function Slider({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display?: (v: number) => string
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs text-[var(--text-muted)] tabular-nums">{display ? display(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-1" />
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">{title}</h3>
      {children}
    </div>
  )
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const update = <K extends keyof ViewSettings>(key: K, value: ViewSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="absolute top-12 right-4 z-10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors cursor-pointer"
        title="View settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
          <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-10 right-0 w-56 bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-3 space-y-4 shadow-xl">
          <Section title="Labels">
            <Toggle label="Show labels" checked={settings.showLabels} onChange={(v) => update('showLabels', v)} />
            <Toggle label="Auto-hide when zoomed out" checked={settings.autoHideLabels} onChange={(v) => update('autoHideLabels', v)} />
            <Slider label="Label size" value={settings.labelScale} min={0.5} max={2} step={0.1} onChange={(v) => update('labelScale', v)} display={(v) => `${v.toFixed(1)}x`} />
          </Section>
          <Section title="Nodes">
            <Slider label="Node size" value={settings.nodeScale} min={0.5} max={3} step={0.1} onChange={(v) => update('nodeScale', v)} display={(v) => `${v.toFixed(1)}x`} />
          </Section>
          <Section title="Links">
            <Slider label="Link width" value={settings.linkWidth} min={0.5} max={4} step={0.5} onChange={(v) => update('linkWidth', v)} display={(v) => `${v}px`} />
            <Toggle label="Show arrows" checked={settings.showArrows} onChange={(v) => update('showArrows', v)} />
            <Slider label="Link curvature" value={settings.linkCurvature} min={0} max={0.5} step={0.05} onChange={(v) => update('linkCurvature', v)} />
            <Toggle label="Animate particles" checked={settings.showParticles} onChange={(v) => update('showParticles', v)} />
          </Section>
          <Section title="Physics">
            <Slider label="Repel force" value={settings.repelForce} min={-300} max={-30} step={10} onChange={(v) => update('repelForce', v)} />
            <Slider label="Link distance" value={settings.linkDistance} min={30} max={200} step={10} onChange={(v) => update('linkDistance', v)} />
            <Slider label="Alpha decay" value={settings.alphaDecay} min={0.005} max={0.1} step={0.005} onChange={(v) => update('alphaDecay', v)} />
            <Slider label="Velocity decay" value={settings.velocityDecay} min={0.05} max={0.8} step={0.05} onChange={(v) => update('velocityDecay', v)} />
          </Section>
          <Section title="Camera">
            <Slider label="Pan duration" value={settings.panDuration} min={0} max={3000} step={100} onChange={(v) => update('panDuration', v)} display={(v) => `${v}ms`} />
            <Slider label="Zoom duration" value={settings.zoomDuration} min={0} max={3000} step={100} onChange={(v) => update('zoomDuration', v)} display={(v) => `${v}ms`} />
          </Section>
        </div>
      )}
    </div>
  )
}
