'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Server = { id: string; name: string; owner: string; invitecode: string };

export default function ServerPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setMe(JSON.parse(u));
    const token = localStorage.getItem('token');
    if (!token) { router.push('/connexion'); return; }
    fetch('http://localhost:3001/servers/members', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.json())
      .then(d => setServers(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/connexion');
  };

  const avatarColor = (id = '') => {
    const p = ['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#3ba55d','#faa61a'];
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % p.length;
    return p[h];
  };

  const initial = (name = '') => (name || '?').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0e1117', color: '#e6edf3', overflow: 'hidden' }}>

      {/* ── Left rail ── */}
      <div style={{
        width: 72, background: '#111318', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '12px 0', gap: 8, borderRight: '1px solid #1c2128', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 8 }}>
          <Image src="/boka-logo.svg" alt="BOKA" width={110} height={37} style={{ borderRadius: 8 }} />
        </div>
        <div style={{ width: 32, height: 1, background: '#21262d', margin: '4px 0' }} />

        {/* Server icons */}
        {servers.map(s => (
          <button key={s.id} onClick={() => router.push(`/channel/${s.id}`)}
            title={s.name}
            style={{
              width: 48, height: 48, borderRadius: 16, background: avatarColor(s.id),
              border: 'none', color: 'white', fontWeight: 800, fontSize: 18,
              cursor: 'pointer', transition: 'border-radius 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderRadius = '12px')}
            onMouseLeave={e => (e.currentTarget.style.borderRadius = '16px')}
          >
            {initial(s.name)}
          </button>
        ))}

        {/* Add server */}
        <button onClick={() => router.push('/serverCreation')} title="Créer un serveur"
          style={{
            width: 48, height: 48, borderRadius: '50%', background: '#1c2128',
            border: '2px dashed #30363d', color: '#3fb950', fontWeight: 800, fontSize: 24,
            cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3fb950'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#3fb950'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1c2128'; e.currentTarget.style.color = '#3fb950'; e.currentTarget.style.borderColor = '#30363d'; }}
        >
          +
        </button>

        <div style={{ flex: 1 }} />

        {/* Logout */}
        <button onClick={handleLogout} title="Déconnexion"
          style={{
            width: 48, height: 48, borderRadius: '50%', background: '#1c2128',
            border: 'none', color: '#8b949e', fontSize: 18, cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f85149'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1c2128'; e.currentTarget.style.color = '#8b949e'; }}
        >
          ⏻
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          padding: '16px 28px', borderBottom: '1px solid #1c2128',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0e1117', flexShrink: 0,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e6edf3' }}>Mes serveurs</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/dm')} style={{
              padding: '8px 16px', background: '#1c2128', border: '1px solid #30363d',
              borderRadius: 8, color: '#e6edf3', fontSize: 13, fontWeight: 600,
            }}>
              💬 Messages privés
            </button>
            <button onClick={() => router.push('/joinServer')} style={{
              padding: '8px 16px', background: '#1c2128', border: '1px solid #30363d',
              borderRadius: 8, color: '#e6edf3', fontSize: 13, fontWeight: 600,
            }}>
              🔗 Rejoindre
            </button>
            <button onClick={() => router.push('/serverCreation')} style={{
              padding: '8px 16px', background: '#5865f2', border: 'none',
              borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700,
            }}>
              + Créer
            </button>
          </div>
        </div>

        {/* Server grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {loading ? (
            <div style={{ color: '#8b949e', fontSize: 14 }}>Chargement…</div>
          ) : servers.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '60%', gap: 16, color: '#8b949e',
            }}>
              <div style={{ fontSize: 56 }}>🏗️</div>
              <p style={{ fontSize: 16 }}>Aucun serveur — créez-en un !</p>
              <button onClick={() => router.push('/serverCreation')} style={{
                padding: '10px 24px', background: '#5865f2', border: 'none',
                borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 14,
              }}>
                Créer mon premier serveur
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {servers.map(s => (
                <button key={s.id} onClick={() => router.push(`/channel/${s.id}`)}
                  style={{
                    background: '#161b22', border: '1px solid #21262d', borderRadius: 14,
                    padding: '20px', cursor: 'pointer', textAlign: 'left', color: '#e6edf3',
                    transition: 'border-color 0.15s, transform 0.1s',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#5865f2'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#21262d'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: avatarColor(s.id),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 22, color: 'white',
                  }}>
                    {initial(s.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#8b949e' }}>Cliquer pour rejoindre</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User bar */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid #1c2128', display: 'flex',
          alignItems: 'center', gap: 10, background: '#0e1117', flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: avatarColor(me?.id),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14,
          }}>
            {initial(me?.first_name || me?.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{me?.first_name} {me?.name}</div>
            <div style={{ fontSize: 11, color: '#8b949e' }}>{me?.mail}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
