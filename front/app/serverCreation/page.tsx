'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateServer() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/connexion'); return; }
      const res = await fetch('http://localhost:3001/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Erreur lors de la création');
      }
      router.push('/server');
    } catch (err: any) {
      setError(err.message || 'Impossible de créer le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0e1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#161b22', border: '1px solid #21262d', borderRadius: 16,
        padding: '40px 44px', width: '100%', maxWidth: 420,
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏗️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3', marginBottom: 4 }}>
            Créer un serveur
          </h1>
          <p style={{ color: '#8b949e', fontSize: 13, lineHeight: 1.5 }}>
            Un serveur, c'est l'endroit où vous et vos amis se retrouvent.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.35)',
            borderRadius: 8, padding: '10px 14px', color: '#f85149', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, color: '#8b949e',
              marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6,
            }}>
              Nom du serveur
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              required placeholder="Mon super serveur"
              style={{
                width: '100%', padding: '10px 14px', background: '#21262d',
                border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#5865f2')}
              onBlur={e => (e.target.style.borderColor = '#30363d')}
            />
          </div>

          <button type="submit" disabled={loading || !name.trim()}
            style={{
              marginTop: 4, padding: '11px', background: loading ? '#3d4494' : '#5865f2',
              border: 'none', borderRadius: 8, color: 'white', fontWeight: 700,
              fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 12px rgba(88,101,242,0.35)', opacity: (!name.trim() && !loading) ? 0.5 : 1,
            }}
          >
            {loading ? 'Création…' : 'Créer mon serveur'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: '#484f58', fontSize: 12, cursor: 'pointer' }}
          >
            ← Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
