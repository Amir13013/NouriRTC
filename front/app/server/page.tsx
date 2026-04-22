'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import '../../styles/serverActions.css';

type Server = {
  id: string;
  name: string;
  owner: string;
  invitecode: string;
};

const LOCALES: Record<string, Record<string, string>> = {
  fr: {
    title: 'Mes serveurs',
    create: 'Créer un serveur',
    join: 'Rejoindre un serveur',
    logout: 'Déconnexion',
    noServer: 'Aucun serveur — créez-en un !',
    dms: '💬 Messages privés',
    error: 'Impossible de récupérer vos serveurs',
    mustLogin: 'Vous devez être connecté !',
  },
  en: {
    title: 'My Servers',
    create: 'Create a server',
    join: 'Join a server',
    logout: 'Sign out',
    noServer: 'No servers — create one!',
    dms: '💬 Direct Messages',
    error: 'Unable to fetch your servers',
    mustLogin: 'You must be logged in!',
  },
};

export default function ServerPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');
  const router = useRouter();

  const t = LOCALES[locale];

  useEffect(() => {
    const saved = localStorage.getItem('chatflow_locale') as 'fr' | 'en' | null;
    if (saved && LOCALES[saved]) setLocale(saved);
  }, []);

  useEffect(() => {
    const fetchServers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert(t.mustLogin);
        router.push("/connexion");
        return;
      }
      try {
        const res = await fetch("http://localhost:3001/servers/members", {
          headers: { "Authorization": "Bearer " + token },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setServers(data.data || []);
      } catch {
        alert(t.error);
      }
    };
    fetchServers();
  }, [router, locale]);

  const handleLocale = (l: 'fr' | 'en') => {
    setLocale(l);
    localStorage.setItem('chatflow_locale', l);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/connexion');
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto' }}>
      {/* Language switcher */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => handleLocale('fr')}
          style={{
            padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: locale === 'fr' ? '#5865f2' : '#374151', color: 'white', fontWeight: 600,
          }}
        >
          FR
        </button>
        <button
          onClick={() => handleLocale('en')}
          style={{
            padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: locale === 'en' ? '#5865f2' : '#374151', color: 'white', fontWeight: 600,
          }}
        >
          EN
        </button>
      </div>

      <nav style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/serverCreation" style={{ color: '#5865f2' }}>+ {t.create}</a>
        <span style={{ color: '#6b7280' }}>|</span>
        <a href="/joinServer" style={{ color: '#5865f2' }}>🔗 {t.join}</a>
        <span style={{ color: '#6b7280' }}>|</span>
        <a href="/dm" style={{ color: '#5865f2' }}>{t.dms}</a>
        <span style={{ color: '#6b7280' }}>|</span>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}
        >
          ⏻ {t.logout}
        </button>
      </nav>

      <section>
        <h2 style={{ color: '#f9fafb', marginBottom: 16 }}>{t.title}</h2>
        {servers.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>{t.noServer}</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {servers.map(server => (
              <li key={server.id}>
                <a
                  href={`/channel/${server.id}`}
                  style={{
                    display: 'block', padding: '12px 16px', background: '#1f2937',
                    borderRadius: 8, color: '#f9fafb', textDecoration: 'none',
                    border: '1px solid #374151',
                  }}
                >
                  {server.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
