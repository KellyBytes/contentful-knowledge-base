'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { useIsMac } from '@/lib/use-is-mac';

const SearchDialog = () => {
  const router = useRouter();
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState([]);
  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState('all');

  const isMac = useIsMac();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    setFilter('all');
  }, []);

  // Fetch the search index only when the dialog is open
  useEffect(() => {
    if (!open || index.length > 0) return;

    fetch('/api/search-index')
      .then(res => res.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  }, [open, index.length]);

  // Open with CMD + K / CTRL + K
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) close();
        else setOpen(true);
      }

      if (e.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Recreate the fuse instance only when the index changes
  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: 'title', wight: 3 },
          { name: 'summary', wight: 1 },
          { name: 'context', wight: 2 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [index],
  );

  const results = useMemo(() => {
    const q = query.trim();

    if (!q) return [];

    const hits = fuse.search(q).map(r => r.item);
    const filtered =
      filter === 'all' ? hits : hits.filter(item => item.type === filter);
    return filtered.slice(0, 8);
  }, [fuse, query, filter]);

  const go = item => {
    close();
    router.push(item.path);
  };

  const onInputKeyDown = e => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
      >
        <Search className="size-4" aria-hidden="true" />
        <span>Search</span>
        <kbd className="kbd-hint ml-2 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 p-4 pt-24"
          onClick={close}
          role="presentation"
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search the knowledge base"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4">
              <Search
                className="size-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search articles"
                className="flex-1 py-3.5 text-sm outline-none placeholder:text-slate-400"
              />
              {query.trim() && (
                <div className="flex gap-1 px-3 py-2 border-b border-slate-200">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'article', label: 'Knowledge base' },
                    { id: 'post', label: 'Blog' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setFilter(tab.id);
                        setActive(0);
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        filter === tab.id
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      aria-label="Switch tab"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {query.trim() && (
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-slate-400">
                    No matches
                  </li>
                ) : (
                  results.map((item, i) => (
                    <li key={item.path}>
                      <button
                        type="button"
                        onClick={() => go(item)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors ${
                          i === active ? 'bg-amber-50' : ''
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-xs">
                          {item.title}
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          <span
                            className={`rounded px-1.5 py-0.5 font-medium ${
                              item.type === 'article'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.type === 'article' ? 'KB' : 'Blog'}
                          </span>
                          <span className="text-slate-500">{item.context}</span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchDialog;
