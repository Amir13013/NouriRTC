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

  const token = () => localStorage.getItem('token') || '';

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setMe(parsed);
      currentUserRef.current = parsed;
    }

    // Load conversations list for sidebar
    fetch('http://localhost:3001/dm/conversations', {
      headers: { Authorization: 'Bearer ' + token() },
    })
      .then(r => r.json())
      .then(d => {
        const convs = d.data || [];
        setConversations(convs);
        const current = convs.find((c: any) => String(c._id) === String(convId));
        if (current) setOtherUser(current.otherUser);
      })
      .catch(() => {});

    // Load messages for this conversation
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

        {/* Conversations */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {conversations.map(c => (
            <div key={c._id}
              onClick={() => router.push(`/dm/${c._id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', cursor: 'pointer', borderRadius: 6, margin: '2px 6px',
                background: String(c._id) === String(convId) ? '#404249' : 'transparent',
              }}
              onMouseEnter={e => { if (String(c._id) !== String(convId)) e.currentTarget.style.background = '#35373c'; }}
              onMouseLeave={e => { if (String(c._id) !== String(convId)) e.currentTarget.style.background = 'transparent'; }}
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

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #1e1f22',
          display: 'flex', alignItems: 'center', gap: 10, background: '#313338',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#5865f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>
            {initials(otherUser?.first_name || otherUser?.name || '?')}
          </div>
          <span style={{ fontWeight: 600 }}>{otherUser?.first_name} {otherUser?.name}</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => {
            const isMe = currentUserRef.current && m.senderId === currentUserRef.current.id;
            return (
              <div key={m._id || i} style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '65%', padding: '8px 12px', borderRadius: 12,
                  background: isMe ? '#5865f2' : '#2b2d31',
                  color: 'white', fontSize: 14,
                  borderBottomRightRadius: isMe ? 4 : 12,
                  borderBottomLeftRadius: isMe ? 12 : 4,
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
          padding: '12px 16px', borderTop: '1px solid #1e1f22',
          display: 'flex', gap: 8, background: '#313338',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${otherUser?.first_name || '…'}`}
            style={{
              flex: 1, padding: '10px 14px', background: '#383a40',
              border: 'none', borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
            }}
          />
          <button type="submit" disabled={!input.trim()}
            style={{
              padding: '10px 20px', background: '#5865f2', border: 'none',
              borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer',
              opacity: input.trim() ? 1 : 0.5,
            }}>
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
