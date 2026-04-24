'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Inscription() {
  const [formData, setFormData] = useState({
    name: '', first_name: '', phone_number: '', mail: '', password: '',
  });
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
      const res = await fetch('http://localhost:3001/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/connexion');
      } else {
        setError(data.message || 'Erreur lors de l\'inscription');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: '#21262d',
    border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3',
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700 as const, color: '#8b949e',
    marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.6,
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0e1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#161b22', border: '1px solid #21262d', borderRadius: 16,
        padding: '40px 44px', width: '100%', maxWidth: 440,
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="/boka-logo.svg" alt="BOKA" width={160} height={53}
            style={{ marginBottom: 12, borderRadius: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3', marginBottom: 4 }}>
            Créer un compte
          </h1>
          <p style={{ color: '#8b949e', fontSize: 13 }}>Rejoins BOKA gratuitement</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.35)',
            borderRadius: 8, padding: '10px 14px', color: '#f85149', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Prénom</label>
              <input id="name" type="text" value={formData.name} onChange={handleChange}
                required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#5865f2')}
                onBlur={e => (e.target.style.borderColor = '#30363d')} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nom</label>
              <input id="first_name" type="text" value={formData.first_name} onChange={handleChange}
                required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#5865f2')}
                onBlur={e => (e.target.style.borderColor = '#30363d')} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Téléphone</label>
            <input id="phone_number" type="tel" value={formData.phone_number} onChange={handleChange}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#5865f2')}
              onBlur={e => (e.target.style.borderColor = '#30363d')} />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input id="mail" type="email" value={formData.mail} onChange={handleChange}
              required style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#5865f2')}
              onBlur={e => (e.target.style.borderColor = '#30363d')} />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input id="password" type="password" value={formData.password} onChange={handleChange}
              required style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#5865f2')}
              onBlur={e => (e.target.style.borderColor = '#30363d')} />
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: 4, padding: '11px', background: loading ? '#3d4494' : '#5865f2',
            border: 'none', borderRadius: 8, color: 'white', fontWeight: 700,
            fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 12px rgba(88,101,242,0.35)',
          }}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#8b949e' }}>
          Déjà un compte ?{' '}
          <Link href="/connexion" style={{ color: '#5865f2', fontWeight: 600 }}>Se connecter</Link>
        </div>
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: '#484f58' }}>← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
