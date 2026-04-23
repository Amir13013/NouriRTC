'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function DmChatPage() {
  const { conversationId } = useParams();
  const convId = Array.isArray(conversationId) ? conversationId[0] : conversationId;
  const router = useRouter();

  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserRef = useRef<any>(null);
  const otherUserRef = useRef<any>(null);

  const token = () => localStorage.getItem('token') || '';

  // ── notification permission ────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const avatarColor = (id = '') => {
    const p = ['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#3ba55d','#faa61a'];
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % p.length;
    return p[h];
  };
  const initial = (name = '') => (name || '?').charAt(0).toUpperCase();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setMe(parsed);
      currentUserRef.current = parsed;
    }
    fetch('http://localhost:3001/dm/conversations', {
      headers: { Authorization: 'Bearer ' + token() },
    })
      .then(r => r.json())
      .then(d => {
        const convs = d.data || [];
        setConversations(convs);
        const current = convs.find((c: any) => String(c._id) === String(convId));
        if (current) { setOtherUser(current.otherUser); otherUserRef.current = current.otherUser; }
      })
      .catch(() => {});
    fetch(`http://localhost:3001/dm/conversations/${convId}/messages`, {
      headers: { Authorization: 'Bearer ' + token() },
    })
      .then(r => r.json())
      .then(d => setMessages(d.data || []))
      .catch(() => {});
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!convId || !token()) return;
    const s = io('http://localhost:3001', { auth: { token: token() }, autoConnect: false });
    s.on('dm:message', (data: any) => {
      setMessages(prev => [...prev, data]);
      if (document.hidden && Notification.permission === 'granted') {
        // senderId est l'UUID PostgreSQL de l'expéditeur
        const senderName = data.senderId !== currentUserRef.current?.id
          ? (otherUserRef.current?.first_name
              ? `${otherUserRef.current.first_name} ${otherUserRef.current.name || ''}`.trim()
              : 'Message privé')
          : null;
        if (senderName) {
          new Notification(senderName, {
            body: data.content?.length > 100 ? data.content.slice(0, 100) + '…' : data.content,
            icon: '/logo-icon.png',
            tag: 'dm-msg',
          });
        }
      }
    });
    s.connect();
    s.emit('dm:join', convId);
    setSocket(s);
    return () => { s.emit('dm:leave', convId); s.disconnect(); };
  }, [convId]);

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

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('dm:send', { conversationId: convId, content: input.trim() });
    setInput('');
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

        <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Conversations
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {conversations.map(c => (
            <div key={c._id} onClick={() => router.push(`/dm/${c._id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', cursor: 'pointer', borderRadius: 8, margin: '2px 6px',
                background: String(c._id) === String(convId) ? '#1c2128' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (String(c._id) !== String(convId)) e.currentTarget.style.background = 'rgba(28,33,40,0.6)'; }}
              onMouseLeave={e => { if (String(c._id) !== String(convId)) e.currentTarget.style.background = 'transparent'; }}
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

      {/* ── Chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid #1c2128',
          display: 'flex', alignItems: 'center', gap: 12, background: '#0e1117', flexShrink: 0,
        }}>
          {otherUser && (
            <>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: avatarColor(otherUser.id),
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15,
              }}>
                {initial(otherUser.first_name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{otherUser.first_name} {otherUser.name}</div>
                <div style={{ fontSize: 11, color: '#8b949e' }}>Message privé</div>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {messages.length === 0 && otherUser && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8b949e' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: avatarColor(otherUser.id),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 28, margin: '0 auto 12px',
                }}>
                  {initial(otherUser.first_name)}
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#e6edf3', marginBottom: 4 }}>
                {otherUser.first_name} {otherUser.name}
              </p>
              <p style={{ fontSize: 13 }}>Début de votre conversation privée</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMe = currentUserRef.current && m.senderId === currentUserRef.current.id;
            const showAvatar = !isMe && (i === 0 || messages[i - 1]?.senderId !== m.senderId);
            return (
              <div key={m._id || i} style={{
                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: 8, paddingLeft: !isMe && !showAvatar ? 44 : 0,
              }}>
                {!isMe && showAvatar && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: avatarColor(otherUser?.id),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initial(otherUser?.first_name)}
                  </div>
                )}
                <div style={{
                  maxWidth: '65%', padding: '8px 14px', borderRadius: 16,
                  background: isMe ? '#5865f2' : '#161b22',
                  color: '#e6edf3', fontSize: 14, lineHeight: 1.5,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: !isMe ? 4 : 16,
                }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} style={{
          padding: '12px 20px', borderTop: '1px solid #1c2128',
          display: 'flex', gap: 10, background: '#0e1117', flexShrink: 0,
        }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder={`Message ${otherUser?.first_name ? '@' + otherUser.first_name : '…'}`}
            style={{
              flex: 1, padding: '11px 16px', background: '#161b22',
              border: '1px solid #21262d', borderRadius: 10, color: '#e6edf3',
              fontSize: 14, outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#5865f2')}
            onBlur={e => (e.target.style.borderColor = '#21262d')}
          />
          <button type="submit" disabled={!input.trim()}
            style={{
              padding: '11px 20px', background: '#5865f2', border: 'none',
              borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              opacity: input.trim() ? 1 : 0.4, transition: 'opacity 0.15s',
            }}
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
