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

  const initials = (name: string) => (name || '?').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#313338', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#2b2d31', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1f22' }}>
        <div style={{ padding: '16px', fontWeight: 700, fontSize: 15, borderBottom: '1px solid #1e1f22' }}>
          💬 Messages privés
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px', position: 'relative' }}>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Chercher un utilisateur…"
            style={{
              width: '100%', padding: '6px 10px', background: '#1e1f22',
              border: '1px solid #374151', borderRadius: 6, color: 'white',
              fontSize: 13, boxSizing: 'border-box', outline: 'none',
            }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 12, right: 12,
              background: '#1e1f22', border: '1px solid #374151', borderRadius: 6,
              zIndex: 50, overflow: 'hidden',
            }}>
              {searchResults.map(u => (
                <div key={u.id}
                  onClick={() => { setSearchQ(''); setSearchResults([]); openDm(u.id); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#374151')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {u.first_name} {u.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {conversations.length === 0 && (
            <p style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>
              Aucune conversation
            </p>
          )}
          {conversations.map(c => (
            <div key={c._id}
              onClick={() => router.push(`/dm/${c._id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', cursor: 'pointer', borderRadius: 6, margin: '2px 6px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#35373c')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#5865f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {initials(c.otherUser?.first_name || c.otherUser?.name)}
              </div>
              <span style={{ fontSize: 14 }}>{c.otherUser?.first_name} {c.otherUser?.name}</span>
            </div>
          ))}
        </div>

        {/* User panel */}
        <div style={{
          padding: '8px 12px', borderTop: '1px solid #1e1f22',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#5865f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>
            {initials(me?.first_name || '')}
          </div>
          <span style={{ fontSize: 13, flex: 1 }}>{me?.first_name} {me?.name}</span>
          <a href="/server" style={{ color: '#9ca3af', fontSize: 18, textDecoration: 'none' }} title="Retour">🏠</a>
        </div>
      </aside>

      {/* Empty state */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 64 }}>💬</div>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Sélectionnez une conversation ou recherchez un utilisateur</p>
      </div>
    </div>
  );
}
