'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { focusRing } from '@/lib/ui';
import { Code, CopyButton } from './CodeBlock';

export interface CodeTab {
  id: string;
  label: string;
  filename: string;
  code: string;
}

/** Code card with language tabs (Python / TypeScript / JS …) and a copy button. */
export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tab = tabs[active];

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (active + dir + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-surface shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/5 pr-3">
        <div role="tablist" aria-label="Язык примера" className="flex">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              id={`${baseId}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
              className={`border-b-2 px-4 py-2.5 font-mono text-xs transition ${focusRing} ${
                i === active
                  ? 'border-tg-500 text-ink'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[11px] text-slate-400 sm:inline">{tab.filename}</span>
          <CopyButton code={tab.code} />
        </div>
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`}>
        <Code code={tab.code} />
      </div>
    </div>
  );
}
