import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const inputClass =
  'w-full rounded-2xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:opacity-50';

export const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-3xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

interface SectionProps {
  index: number;
  icon: LucideIcon;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Section({ index, icon: Icon, title, description, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur-sm shadow-[0_4px_20px_rgba(16,185,129,0.06)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-3xl px-4 py-3.5 text-left transition hover:bg-emerald-50/60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
          <Icon className="h-4 w-4 text-emerald-700" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800">
            <span className="mr-2 text-xs text-emerald-600">0{index}</span>
            {title}
          </span>
          <span className="block truncate text-xs text-slate-500">{description}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-emerald-100 px-4 pb-5 pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[11px] leading-relaxed text-slate-500">{hint}</span>}
    </label>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm text-slate-800">{label}</span>
        {description && <span className="block text-[11px] leading-relaxed text-slate-500">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? 'bg-emerald-400' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tabular-nums text-emerald-700">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-400"
      />
    </div>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({ value, options, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-flow-col auto-cols-fr gap-1 rounded-3xl bg-emerald-50 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`rounded-3xl px-3 py-2 text-sm transition ${
              active ? 'bg-white font-medium text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
