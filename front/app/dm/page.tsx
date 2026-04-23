'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DmListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);

  const token = () => localStorage.getItem('token') || '';

  const avatarColor = (id = '') => {
    const p = ['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#3ba55d','#faa61a'];
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % p.length;
    return p[h];
  };
  const initial = (name = '') => (name || '?').charAt(0).toUpperCase();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setMe(JSON.parse(u));
    fetch('http://localhost:3001/dm/conversations', {
      headers: { Authorization: 'Bearer ' + token() },
    })
      .then(r => r.json())
      .then(d => setConversations(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`http://localhost:3001/dm/users/search?q=${encodeURIComponent(searchQ)}`, {
        headers: { Authorization: 'Bearer ' + token() },
      })
        .then(r => r.json())
        .then(d => setSearchResults(d.data || []));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const openDm = async (targetUserId: string) => {
    const res = await fetch('http://localhost:3001/dm/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
      body: JSON.stringify({ targetUserId }),
    });
    const d = await res.json();
    router.push(`/dm/${d.data._id}`);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0e1117', color: '#e6edf3', overflow: 'hidden' }}>

      {/* ── Left rail ── */}
      <div style={{
        width: 72, background: '#111318', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '12px 0', gap: 8, borderRight: '1px solid #1c2128', flexShrink: 0,
      }}>
        <button onClick={() => router.push('/server')} title="Retour aux serveurs"
          style={{
            width: 48, height: 48, borderRadius: '50%', background: '#1c2128',
            border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#5865f2'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1c2128'; e.currentTarget.style.color = '#8b949e'; }}
        >
          ←
        </button>
        <div style={{ width: 32, height: 1, background: '#21262d' }} />
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: '#5865f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          💬
        </div>
      </div>

      {/* ── DM sidebar ── */}
      <div style={{
        width: 240, background: '#111318', display: 'flex', flexDirection: 'column',
        borderRight: '1px solid #1c2128', flexShrink: 0,
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1c2128', fontWeight: 800, fontSize: 15 }}>
          Messages privés
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', position: 'relative' }}>
          <input
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Trouver un utilisateur…"
            style={{
              width: '100%', padding: '8px 12px', background: '#0e1117',
              border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3',
              fontSize: 13, boxSizing: 'border-box', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#5865f2')}
            onBlur={e => (e.target.style.borderColor = '#21262d')}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 12, right: 12,
              background: '#161b22', border: '1px solid #21262d', borderRadius: 8,
              zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {searchResults.map(u => (
                <div key={u.id}
                  onClick={() => { setSearchQ(''); setSearchResults([]); openDm(u.id); }}
                  style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1c2128')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: avatarColor(u.id),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initial(u.first_name)}
                  </div>
                  {u.first_name} {u.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section label */}
        <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Conversations — {conversations.length}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {conversations.length === 0 && (
            <div style={{ padding: '12px 16px', color: '#484f58', fontSize: 13 }}>
              Aucune conversation
            </div>
          )}
          {conversations.map(c => (
            <div key={c._id} onClick={() => router.push(`/dm/${c._id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', cursor: 'pointer', borderRadius: 8, margin: '2px 6px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1c2128')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: avatarColor(c.otherUser?.id),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {initial(c.otherUser?.first_name)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.otherUser?.first_name} {c.otherUser?.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User bar */}
        <div style={{
          padding: '10px 12px', borderTop: '1px solid #1c2128',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: avatarColor(me?.id),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {initial(me?.first_name)}
          </div>
          <span style={{ fontSize: 13, flex: 1, fontWeight: 600 }}>{me?.first_name} {me?.name}</span>
        </div>
      </div>

      {/* ── Empty state ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 72 }}>💬</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e6edf3' }}>Messages privés</h2>
        <p style={{ color: '#8b949e', fontSize: 14, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          Sélectionnez une conversation existante ou recherchez un utilisateur pour démarrer une nouvelle discussion.
        </p>
      </div>
    </div>
  );
}
