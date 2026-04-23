import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0e1117 0%, #0d1526 50%, #0e1117 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(88,101,242,0.07) 0%, transparent 70%)',
        top: '40%', left: '50%', transform: 'translate(-50%, -60%)',
        pointerEvents: 'none',
      }} />

      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
        <Image src="/logo-icon.png" alt="ChatFlow" width={60} height={60}
          style={{ borderRadius: 16, boxShadow: '0 0 32px rgba(88,101,242,0.4)' }} />
        <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5, color: '#e6edf3' }}>
          Chat<span style={{ color: '#5865f2' }}>Flow</span>
        </h1>
      </div>

      {/* Tagline */}
      <p style={{
        fontSize: 18, color: '#8b949e', marginBottom: 48,
        textAlign: 'center', maxWidth: 500, lineHeight: 1.7,
      }}>
        La messagerie temps réel pour vos communautés.<br />
        Serveurs, channels, messages privés — tout en un.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 80 }}>
        <Link href="/connexion" style={{
          padding: '13px 32px', background: '#5865f2', color: 'white',
          borderRadius: 10, fontWeight: 700, fontSize: 15, display: 'inline-block',
          boxShadow: '0 4px 20px rgba(88,101,242,0.4)',
        }}>
          Se connecter
        </Link>
        <Link href="/inscription" style={{
          padding: '13px 32px', background: 'transparent', color: '#e6edf3',
          border: '1px solid #30363d', borderRadius: 10, fontWeight: 700,
          fontSize: 15, display: 'inline-block',
        }}>
          Créer un compte
        </Link>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 860 }}>
        {[
          { icon: '⚡', title: 'Temps réel', desc: 'Messages instantanés via Socket.IO' },
          { icon: '🔒', title: 'Sécurisé', desc: 'JWT + bcrypt 12 rounds' },
          { icon: '🎭', title: 'Rôles', desc: 'Owner, Admin, Member' },
          { icon: '🌐', title: 'Traduction', desc: 'EN et ES automatiques' },
          { icon: '🎬', title: 'GIFs', desc: 'Intégration Tenor' },
          { icon: '💬', title: 'DMs', desc: 'Messages privés' },
        ].map(f => (
          <div key={f.title} style={{
            background: '#161b22', border: '1px solid #21262d', borderRadius: 12,
            padding: '20px 22px', width: 160, textAlign: 'center',
          }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#e6edf3' }}>{f.title}</div>
            <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
