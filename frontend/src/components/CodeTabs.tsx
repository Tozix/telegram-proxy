'use client';

import { useState } from 'react';
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
  const tab = tabs[active];

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1320] shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/5 pr-3">
        <div className="flex">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              className={`border-b-2 px-4 py-2.5 font-mono text-xs transition ${
                i === active
                  ? 'border-tg-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[11px] text-slate-500 sm:inline">{tab.filename}</span>
          <CopyButton code={tab.code} />
        </div>
      </div>
      <Code code={tab.code} />
    </div>
  );
}
