'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Channel = { id: string; name: string; server_id: string };
type Member = { id: string; name: string; first_name: string; role: 'owner' | 'admin' | 'member' };
type ContextMenu = { x: number; y: number; member: Member };

const ROLE_COLOR: Record<string, string> = {
  owner: '#faa61a',
  admin: '#5865f2',
  member: '#8b949e',
};
const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Membre',
};

export default function ChannelPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const router = useRouter();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [me, setMe] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [banTarget, setBanTarget] = useState<Member | null>(null);
  const [banReason, setBanReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [serverName, setServerName] = useState('Serveur');

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setMe(parsed);
      setCurrentUserId(parsed.id);
    }
  }, []);

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/connexion'); return; }
      const hdr = { Authorization: `Bearer ${token}` };
      const [rCh, rMem, rInv] = await Promise.allSettled([
        fetch(`http://localhost:3001/servers/${serverId}/channels`, { headers: hdr }),
        fetch(`http://localhost:3001/servers/${serverId}/users`,    { headers: hdr }),
        fetch(`http://localhost:3001/servers/${serverId}/inviteCode`, { headers: hdr }),
      ]);

      if (rCh.status === 'fulfilled' && rCh.value.ok) {
        const d = await rCh.value.json();
        setChannels(d.data || []);
      }
      if (rMem.status === 'fulfilled' && rMem.value.ok) {
        const d = await rMem.value.json();
        setMembers(d.data || []);
      }
      if (rInv.status === 'fulfilled' && rInv.value.ok) {
        const d = await rInv.value.json();
        setInviteCode(d.data?.inviteCode || '');
      }
    };
    if (serverId) fetchData();
  }, [serverId, router]);

  const currentUserRole = members.find(m => m.id === currentUserId)?.role ?? null;

  const canActOn = useCallback((target: Member): boolean => {
    if (!currentUserRole) return false;
    if (target.id === currentUserId) return false;
    if (target.role === 'owner') return false;
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && target.role === 'member') return true;
    return false;
  }, [currentUserRole, currentUserId]);

  const handleRightClick = (e: React.MouseEvent, member: Member) => {
    if (!canActOn(member)) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, member });
  };

  const handleKick = async (member: Member) => {
    setContextMenu(null);
    if (!confirm(`Expulser ${member.first_name} ${member.name} ?`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}/kick/${member.id}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMembers(prev => prev.filter(m => m.id !== member.id));
      else alert('Erreur : ' + data.message);
    } catch { alert('Erreur réseau'); }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}/ban/${banTarget.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason || null }),
      });
      const data = await res.json();
      if (res.ok) setMembers(prev => prev.filter(m => m.id !== banTarget.id));
      else alert('Erreur : ' + data.message);
    } catch { alert('Erreur réseau'); }
    finally { setBanTarget(null); setBanReason(''); }
  };

  const handleLeave = async () => {
    if (!confirm('Quitter ce serveur ?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      router.push('/server');
    } catch { alert('Impossible de quitter le serveur'); }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement ce serveur ? Cette action est irréversible.')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      router.push('/server');
    } catch { alert('Impossible de supprimer le serveur'); }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const avatarColor = (id = '') => {
    const p = ['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#3ba55d','#faa61a'];
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % p.length;
    return p[h];
  };

  const initial = (name = '') => (name || '?').charAt(0).toUpperCase();

  const grouped = {
    owner: members.filter(m => m.role === 'owner'),
    admin: members.filter(m => m.role === 'admin'),
    member: members.filter(m => m.role === 'member'),
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
          width: 48, height: 48, borderRadius: 14, background: avatarColor(serverId),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 18, color: 'white',
        }}>
          {initial(members[0]?.name || 'S')}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={handleLeave} title="Quitter"
          style={{
            width: 48, height: 48, borderRadius: '50%', background: '#1c2128',
            border: 'none', color: '#8b949e', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f85149'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1c2128'; e.currentTarget.style.color = '#8b949e'; }}
        >
          ⏻
        </button>
      </div>

      {/* ── Channel sidebar ── */}
      <div style={{
        width: 240, background: '#111318', display: 'flex', flexDirection: 'column',
        borderRight: '1px solid #1c2128', flexShrink: 0,
      }}>
        {/* Server name header */}
        <div style={{
          padding: '16px', borderBottom: '1px solid #1c2128',
          fontWeight: 800, fontSize: 15, color: '#e6edf3',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span># Channels</span>
          {currentUserRole === 'owner' && (
            <button onClick={() => router.push(`/channelCreation/${serverId}`)}
              title="Nouveau channel"
              style={{
                width: 24, height: 24, borderRadius: 6, background: 'transparent',
                border: 'none', color: '#8b949e', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
            >
              +
            </button>
          )}
        </div>

        {/* Invite code */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c2128' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
            Code d'invitation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1, padding: '5px 8px', background: '#0e1117', borderRadius: 6,
              fontSize: 12, fontFamily: 'monospace', color: '#5865f2', border: '1px solid #21262d',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {inviteCode || '…'}
            </div>
            <button onClick={copyInvite} title="Copier"
              style={{
                padding: '5px 8px', background: copied ? '#3fb950' : '#1c2128',
                border: 'none', borderRadius: 6, color: 'white', fontSize: 11,
                cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              {copied ? '✓' : 'Copier'}
            </button>
          </div>
        </div>

        {/* Channel list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div style={{ padding: '4px 12px 4px', fontSize: 11, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Channels textuels
          </div>
          {channels.length === 0 && (
            <div style={{ padding: '8px 16px', fontSize: 13, color: '#484f58' }}>Aucun channel</div>
          )}
          {channels.map(ch => (
            <button key={ch.id} onClick={() => router.push(`/chat/${ch.id}`)}
              style={{
                width: '100%', padding: '7px 16px', background: 'transparent', border: 'none',
                color: '#8b949e', fontSize: 14, cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6, margin: '1px 0',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1c2128'; e.currentTarget.style.color = '#e6edf3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b949e'; }}
            >
              <span style={{ fontSize: 16, opacity: 0.5 }}>#</span>
              {ch.name}
            </button>
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
            {initial(me?.first_name || me?.name)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {me?.first_name} {me?.name}
            </div>
            {currentUserRole && (
              <div style={{ fontSize: 10, color: ROLE_COLOR[currentUserRole], fontWeight: 600 }}>
                {ROLE_LABEL[currentUserRole]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 24px', borderBottom: '1px solid #1c2128',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0e1117', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: avatarColor(serverId),
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16,
            }}>
              {initial(members[0]?.name || 'S')}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Gestion du serveur</div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>{channels.length} channel{channels.length !== 1 ? 's' : ''} · {members.length} membre{members.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {currentUserRole === 'owner' && (
              <button onClick={handleDelete}
                style={{
                  padding: '7px 14px', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)',
                  borderRadius: 8, color: '#f85149', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f85149'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,81,73,0.1)'; e.currentTarget.style.color = '#f85149'; }}
              >
                Supprimer le serveur
              </button>
            )}
            <button onClick={handleLeave}
              style={{
                padding: '7px 14px', background: '#1c2128', border: '1px solid #30363d',
                borderRadius: 8, color: '#e6edf3', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Quitter
            </button>
          </div>
        </div>

        {/* Content — welcome + quick actions */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              Bienvenue sur le serveur
            </h2>
            <p style={{ fontSize: 14, color: '#8b949e', marginBottom: 28, lineHeight: 1.6 }}>
              Choisissez un channel dans la colonne de gauche pour commencer à discuter,
              ou invitez des membres avec le code d'invitation.
            </p>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              {channels.slice(0, 4).map(ch => (
                <button key={ch.id} onClick={() => router.push(`/chat/${ch.id}`)}
                  style={{
                    padding: '16px', background: '#161b22', border: '1px solid #21262d',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', color: '#e6edf3',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#5865f2')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262d')}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>#</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>Cliquer pour ouvrir</div>
                </button>
              ))}
            </div>

            {/* Invite code card */}
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Inviter des amis</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <code style={{
                  flex: 1, padding: '10px 14px', background: '#0e1117', borderRadius: 8,
                  fontSize: 15, color: '#5865f2', border: '1px solid #21262d', letterSpacing: 1,
                }}>
                  {inviteCode || '…'}
                </code>
                <button onClick={copyInvite}
                  style={{
                    padding: '10px 18px', background: copied ? '#3fb950' : '#5865f2',
                    border: 'none', borderRadius: 8, color: 'white', fontWeight: 700,
                    fontSize: 13, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Members panel ── */}
      <div style={{
        width: 220, background: '#111318', borderLeft: '1px solid #1c2128',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1c2128', fontSize: 13, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Membres — {members.length}
        </div>
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <div style={{ padding: '8px 12px', fontSize: 11, color: '#484f58' }}>
            Clic droit pour expulser ou bannir
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {(['owner', 'admin', 'member'] as const).map(role => {
            const group = grouped[role];
            if (group.length === 0) return null;
            return (
              <div key={role}>
                <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: ROLE_COLOR[role], textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {ROLE_LABEL[role]} — {group.length}
                </div>
                {group.map(m => (
                  <div key={m.id}
                    onContextMenu={e => handleRightClick(e, m)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 12px', cursor: canActOn(m) ? 'context-menu' : 'default',
                      borderRadius: 6, margin: '1px 4px', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (canActOn(m)) e.currentTarget.style.background = '#1c2128'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: avatarColor(m.id),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {initial(m.first_name)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: m.id === currentUserId ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.first_name} {m.name}
                        {m.id === currentUserId && <span style={{ fontSize: 10, color: '#8b949e', marginLeft: 4 }}>(vous)</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: contextMenu.y, left: contextMenu.x,
            background: '#161b22', border: '1px solid #21262d', borderRadius: 8,
            padding: 6, zIndex: 1000, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#8b949e', borderBottom: '1px solid #21262d', marginBottom: 4 }}>
            {contextMenu.member.first_name} {contextMenu.member.name}
          </div>
          <button onClick={() => handleKick(contextMenu.member)}
            style={{
              width: '100%', padding: '8px 10px', background: 'transparent', border: 'none',
              color: '#faa61a', fontSize: 13, cursor: 'pointer', textAlign: 'left', borderRadius: 6,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,166,26,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Expulser (Kick)
          </button>
          <button onClick={() => { setBanTarget(contextMenu.member); setContextMenu(null); }}
            style={{
              width: '100%', padding: '8px 10px', background: 'transparent', border: 'none',
              color: '#f85149', fontSize: 13, cursor: 'pointer', textAlign: 'left', borderRadius: 6,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,81,73,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Bannir
          </button>
        </div>
      )}

      {/* Ban modal */}
      {banTarget && (
        <div onClick={() => { setBanTarget(null); setBanReason(''); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          }}
        >
          <div onClick={e => e.stopPropagation()}
            style={{
              background: '#161b22', border: '1px solid #21262d', borderRadius: 16,
              padding: '28px 32px', width: 420, boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#f85149' }}>
              Bannir {banTarget.first_name} {banTarget.name}
            </h3>
            <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 20, lineHeight: 1.5 }}>
              Cette action est permanente. L'utilisateur ne pourra plus rejoindre ce serveur.
            </p>
            <input type="text" placeholder="Raison du ban (optionnel)"
              value={banReason} onChange={e => setBanReason(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: '#21262d',
                border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3',
                fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 20,
              }}
              onFocus={e => (e.target.style.borderColor = '#f85149')}
              onBlur={e => (e.target.style.borderColor = '#30363d')}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setBanTarget(null); setBanReason(''); }}
                style={{
                  padding: '9px 18px', background: '#1c2128', border: '1px solid #30363d',
                  borderRadius: 8, color: '#e6edf3', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button onClick={handleBan}
                style={{
                  padding: '9px 18px', background: '#f85149', border: 'none',
                  borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Confirmer le ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
