import Link from 'next/link';

function pageWindow(page: number, total: number, span = 2): number[] {
  const start = Math.max(1, page - span);
  const end = Math.min(total, page + span);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

const base = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm';
const idle = 'border-slate-300 text-slate-700 hover:bg-slate-50';
const active = 'border-indigo-600 bg-indigo-600 text-white';
const off = 'border-slate-200 text-slate-300 cursor-not-allowed';

/**
 * Постраничная навигация. `hrefFor` строит URL для номера страницы, чтобы
 * компонент не зависел от конкретного пути и параметров.
 */
export function Pagination({
  page,
  totalPages,
  total,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  total?: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return total !== undefined ? (
      <p className="mt-3 text-center text-xs text-slate-400">Всего: {total}</p>
    ) : null;
  }

  const pages = pageWindow(page, totalPages);
  const first = pages[0];
  const last = pages[pages.length - 1];

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-center gap-1.5" aria-label="Постраничная навигация">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${base} ${idle}`}>← Назад</Link>
      ) : (
        <span className={`${base} ${off}`}>← Назад</span>
      )}

      {first > 1 && (
        <>
          <Link href={hrefFor(1)} className={`${base} ${idle}`}>1</Link>
          {first > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((p) =>
        p === page ? (
          <span key={p} className={`${base} ${active}`} aria-current="page">{p}</span>
        ) : (
          <Link key={p} href={hrefFor(p)} className={`${base} ${idle}`}>{p}</Link>
        ),
      )}

      {last < totalPages && (
        <>
          {last < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <Link href={hrefFor(totalPages)} className={`${base} ${idle}`}>{totalPages}</Link>
        </>
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={`${base} ${idle}`}>Вперёд →</Link>
      ) : (
        <span className={`${base} ${off}`}>Вперёд →</span>
      )}
    </nav>
  );
}
