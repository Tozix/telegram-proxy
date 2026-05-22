'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-12 max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Что-то пошло не так</h2>
      <p className="mb-4 text-sm text-red-700">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Повторить
      </button>
    </div>
  );
}
