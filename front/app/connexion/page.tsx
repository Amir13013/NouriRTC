'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Connexion() {
  const [formData, setFormData] = useState({ mail: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/server');
      } else {
        setError(data.message || 'Identifiants incorrects');
      }
    } catch {
      setError('Impossible de contacter le serveur');
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/logo-icon.png" alt="Let Us Link" width={64} height={64}
            style={{ marginBottom: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3', marginBottom: 4 }}>
            Connexion
          </h1>
          <p style={{ color: '#8b949e', fontSize: 13 }}>Bienvenue sur Let Us Link</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.35)',
            borderRadius: 8, padding: '10px 14px', color: '#f85149', fontSize: 13, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {([
            { id: 'mail', label: 'Email', type: 'email' },
            { id: 'password', label: 'Mot de passe', type: 'password' },
          ] as const).map(f => (
            <div key={f.id}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: '#8b949e',
                marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6,
              }}>
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                value={formData[f.id as keyof typeof formData]}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '10px 14px', background: '#21262d',
                  border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#5865f2')}
                onBlur={e => (e.target.style.borderColor = '#30363d')}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            marginTop: 4, padding: '11px', background: loading ? '#3d4494' : '#5865f2',
            border: 'none', borderRadius: 8, color: 'white', fontWeight: 700,
            fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 12px rgba(88,101,242,0.35)',
          }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#8b949e' }}>
          Pas encore de compte ?{' '}
          <Link href="/inscription" style={{ color: '#5865f2', fontWeight: 600 }}>
            S'inscrire
          </Link>
        </div>
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: '#484f58' }}>← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
