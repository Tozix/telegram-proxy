'use client';

import { useState } from 'react';

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (e.g. non-secure context) — ignore */
    }
  }
  return (
    <button
      onClick={copy}
      className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[11px] text-slate-400 transition hover:border-tg-500/40 hover:text-tg-300"
    >
      {copied ? '✓ скопировано' : 'копировать'}
    </button>
  );
}

/** Renders code, dimming whole-line comments (# … or // …) for readability. */
export function Code({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto px-4 py-3.5 text-[13px] leading-[1.7]">
      <code className="font-mono">
        {code.replace(/\n$/, '').split('\n').map((line, i) => {
          const isComment = /^\s*(#|\/\/)/.test(line);
          return (
            <span key={i} className={isComment ? 'text-slate-500' : 'text-slate-200'}>
              {line || ' '}
              {'\n'}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

export function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1320] shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <span className="font-mono text-[11px] text-slate-400">{filename}</span>
        <CopyButton code={code} />
      </div>
      <Code code={code} />
    </div>
  );
}

export { CopyButton };
