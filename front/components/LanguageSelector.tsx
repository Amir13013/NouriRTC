'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/useLanguage';
import { Language, languageNames } from '../lib/i18n';

const LANGS: Language[] = ['fr', 'en', 'es'];

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 1000 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#383a40',
          border: '1px solid #4e5058',
          borderRadius: 6,
          color: 'white',
          padding: '5px 12px',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#4e5058')}
        onMouseLeave={e => (e.currentTarget.style.background = '#383a40')}
      >
        {languageNames[lang]} <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: '#111214',
          border: '1px solid #2c2f33',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          minWidth: 120,
        }}>
          {LANGS.map(l => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '9px 14px',
                background: l === lang ? '#383a40' : 'transparent',
                border: 'none',
                color: l === lang ? 'white' : '#b9bbbe',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                fontWeight: l === lang ? 700 : 400,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (l !== lang) (e.currentTarget.style.background = '#292b2f'); }}
              onMouseLeave={e => { if (l !== lang) (e.currentTarget.style.background = 'transparent'); }}
            >
              {languageNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
