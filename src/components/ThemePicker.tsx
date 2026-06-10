import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export type ThemeId = 'obsidian' | 'daylight' | 'terminal' | 'aurora' | 'gold';

interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  bg: string;
  card: string;
  accent: string;
  text: string;
  up: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Deep dark slate',
    bg: '#0a0a0f', card: '#111118', accent: '#6366f1', text: '#e2e8f0', up: '#22c55e',
  },
  {
    id: 'daylight',
    name: 'Daylight',
    description: 'Clean & minimal',
    bg: '#f1f5f9', card: '#ffffff', accent: '#6366f1', text: '#0f172a', up: '#16a34a',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Hacker green on black',
    bg: '#000000', card: '#0a0f0a', accent: '#00ff41', text: '#00cc33', up: '#00ff41',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Deep violet night',
    bg: '#0d0a1a', card: '#13102a', accent: '#a78bfa', text: '#e2d9f3', up: '#34d399',
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Trading floor amber',
    bg: '#0c0800', card: '#181100', accent: '#f59e0b', text: '#fde68a', up: '#f59e0b',
  },
];

interface Props {
  current: ThemeId;
  onChange: (id: ThemeId) => void;
}

export function ThemePicker({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentTheme = THEMES.find(t => t.id === current)!;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-slate-300 hover:opacity-80 transition-opacity"
      >
        <Palette size={14} />
        <span>Themes</span>
        <span
          className="w-2.5 h-2.5 rounded-full ml-0.5"
          style={{ backgroundColor: currentTheme.accent }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Select Theme
            </p>
          </div>
          <div className="px-2 pb-2 flex flex-col gap-0.5">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { onChange(t.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                {/* mini preview card */}
                <div
                  className="w-12 h-9 rounded-lg flex-shrink-0 border border-white/10 overflow-hidden relative"
                  style={{ backgroundColor: t.bg }}
                >
                  <div
                    className="absolute inset-x-1 top-1 h-2 rounded-sm opacity-80"
                    style={{ backgroundColor: t.card }}
                  />
                  <div
                    className="absolute inset-x-1 bottom-1 h-1.5 rounded-sm"
                    style={{ backgroundColor: t.accent, opacity: 0.7 }}
                  />
                  <div
                    className="absolute right-1.5 top-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: t.up }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                {current === t.id ? (
                  <Check size={14} className="text-up flex-shrink-0" />
                ) : (
                  <div className="w-3.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
