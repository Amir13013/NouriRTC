'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
let typingTimeout: any = null;

type Msg = {
  _id: string;
  type: 'chat' | 'system';
  sender?: string;
  senderId?: string;
  text: string;
  isEdited?: boolean;
  reactions?: { emoji: string; users: string[] }[];
};
type Channel = { id: string; name: string };
type Member  = { id: string; name: string; first_name: string; role: 'owner' | 'admin' | 'member' };

export default function ChatPage() {
  const { channelId } = useParams();
  const chId   = Array.isArray(channelId) ? channelId[0] : channelId as string;
  const router = useRouter();

  // ── core ──
  const [socket,      setSocket]      = useState<any>(null);
  const [serverId,    setServerId]    = useState('');
  const [serverName,  setServerName]  = useState('');
  const [channelName, setChannelName] = useState('');
  const [channels,    setChannels]    = useState<Channel[]>([]);
  const [members,     setMembers]     = useState<Member[]>([]);
  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [online,      setOnline]      = useState<string[]>([]);
  const [input,       setInput]       = useState('');
  const [typingText,  setTypingText]  = useState('');

  // ── mute ──
  const [isMuted,   setIsMuted]   = useState(false);
  const [muteUntil, setMuteUntil] = useState<Date | null>(null);
  const [, tick]                  = useState(0); // forces countdown re-render

  // ── edit ──
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // ── reactions ──
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);

  // ── GIF ──
  const [showGif,    setShowGif]    = useState(false);
  const [gifQ,       setGifQ]       = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [gifLoading, setGifLoading] = useState(false);

  // ── member menu ──
  const [activeMenu, setActiveMenu] = useState<{ member: Member; x: number; y: number } | null>(null);

  // ── ban modal ──
  const [banTarget,   setBanTarget]   = useState<Member | null>(null);
  const [banReason,   setBanReason]   = useState('');
  const [banDuration, setBanDuration] = useState('permanent');

  // ── mute modal ──
  const [muteTarget,   setMuteTarget]   = useState<Member | null>(null);
  const [muteDuration, setMuteDuration] = useState('5min');

  const currentUserRef = useRef<any>(null);
  const bottomRef      = useRef<HTMLDivElement>(null);
  const token = () => localStorage.getItem('token') || '';

  // derived — use String() everywhere: pg returns numbers, JWT may differ
  const me              = currentUserRef.current;
  const currentUserRole = members.find(m => String(m.id) === String(me?.id))?.role ?? null;

  // ── init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) currentUserRef.current = JSON.parse(u);
  }, []);

  useEffect(() => {
    if (!chId) return;
    (async () => {
      const t = token();
      if (!t) { router.push('/connexion'); return; }
      try {
        const [rCh, rMsg] = await Promise.all([
          fetch(`http://localhost:3001/channels/${chId}`,          { headers: { Authorization: 'Bearer ' + t } }),
          fetch(`http://localhost:3001/message/channel/${chId}`,   { headers: { Authorization: 'Bearer ' + t } }),
        ]);
        const dCh  = await rCh.json();
        const dMsg = await rMsg.json();

        setChannelName(dCh.data.name);
        const sid = dCh.data.server_id;
        setServerId(sid);

        setMessages((dMsg.data || []).map((m: any) => ({
          type:      'chat',
          sender:    m.userId,
          senderId:  m.userId,
          text:      m.content,
          _id:       String(m._id),
          isEdited:  m.is_edited,
          reactions: m.reactions || [],
        })));

        const [rSrv, rChs, rMbr, rMute] = await Promise.all([
          fetch(`http://localhost:3001/servers/${sid}`,           { headers: { Authorization: 'Bearer ' + t } }),
          fetch(`http://localhost:3001/servers/${sid}/channels`,  { headers: { Authorization: 'Bearer ' + t } }),
          fetch(`http://localhost:3001/servers/${sid}/users`,     { headers: { Authorization: 'Bearer ' + t } }),
          fetch(`http://localhost:3001/servers/${sid}/mute/me`,   { headers: { Authorization: 'Bearer ' + t } }),
        ]);
        setServerName((await rSrv.json()).data?.name || '');
        setChannels((await rChs.json()).data || []);
        setMembers((await rMbr.json()).data || []);

        const muteData = (await rMute.json()).data;
        if (muteData?.muted) {
          setIsMuted(true);
          setMuteUntil(new Date(muteData.expiresAt));
        }
      } catch {
        alert('Erreur chargement'); router.push('/server');
      }
    })();
  }, [chId]);

  // countdown tick every second when muted
  useEffect(() => {
    if (!isMuted || !muteUntil) return;
    const iv = setInterval(() => {
      if (new Date() >= muteUntil) { setIsMuted(false); setMuteUntil(null); clearInterval(iv); }
      else tick(n => n + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, [isMuted, muteUntil]);

  // ── socket ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chId) return;
    const t = token();
    if (!t) return;
    const s = io('http://localhost:3001', { auth: { token: t }, autoConnect: false });

    s.on('system', (msg: string) =>
      setMessages(prev => [...prev, { type: 'system', text: msg, _id: Date.now().toString() }])
    );
    s.on('channel message', (data: any) =>
      setMessages(prev => [...prev, {
        type: 'chat', sender: data.sender, senderId: data.senderId,
        text: data.msg, _id: String(data._id), reactions: [],
      }])
    );
    s.on('channel users', (data: any) => {
      if (String(data.channelId) === String(chId)) setOnline(data.users);
    });
    s.on('typing', (data: any) =>
      setTypingText(data.isTyping ? `${data.user} est en train d'écrire…` : '')
    );
    s.on('message:edited', (data: any) =>
      setMessages(prev => prev.map(m =>
        m._id === data.messageId ? { ...m, text: data.content, isEdited: true } : m
      ))
    );
    s.on('message:reacted', (data: any) =>
      setMessages(prev => prev.map(m =>
        m._id === data.messageId ? { ...m, reactions: data.reactions } : m
      ))
    );
    s.on('member:kicked', (data: any) => {
      if (me && String(data.userId) === String(me.id)) {
        s.disconnect(); alert('Vous avez été expulsé.'); router.push('/server');
      }
    });
    s.on('member:banned', (data: any) => {
      if (me && String(data.userId) === String(me.id)) {
        s.disconnect(); alert('Vous avez été banni.'); router.push('/server');
      }
    });
    s.on('system:muted', (data: any) => {
      setIsMuted(true);
      setMuteUntil(new Date(data.expiresAt));
    });

    s.connect();
    s.emit('join channel', chId);
    setSocket(s);
    return () => { s.emit('leave channel', chId); s.disconnect(); };
  }, [chId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── GIF search ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gifQ.trim()) { setGifResults([]); return; }
    const id = setTimeout(async () => {
      setGifLoading(true);
      try {
        const r = await fetch(
          `http://localhost:3001/gif/search?q=${encodeURIComponent(gifQ)}`,
          { headers: { Authorization: 'Bearer ' + token() } }
        );
        setGifResults((await r.json()).data || []);
      } catch {} finally { setGifLoading(false); }
    }, 400);
    return () => clearTimeout(id);
  }, [gifQ]);

  // ── actions ───────────────────────────────────────────────────────
  const handleTyping = (v: string) => {
    setInput(v);
    if (!socket) return;
    socket.emit('typing', { channelId: chId, isTyping: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('typing', { channelId: chId, isTyping: false }), 900);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || isMuted) return;
    socket.emit('channel message', { channelId: chId, msg: input.trim() });
    socket.emit('typing', { channelId: chId, isTyping: false });
    setInput('');
  };

  const sendGif = (gif: any) => {
    if (!socket || isMuted) return;
    socket.emit('channel message', { channelId: chId, msg: gif.url });
    setShowGif(false); setGifQ(''); setGifResults([]);
  };

  const sendReaction = (messageId: string, emoji: string) => {
    socket?.emit('message:react', { messageId, emoji });
    setEmojiPickerFor(null);
  };

  const canEdit = (msg: Msg) => me && String(msg.senderId || msg.sender) === String(me.id);
  const startEdit = (msg: Msg) => { if (!canEdit(msg)) return; setEditingId(msg._id); setEditContent(msg.text); };
  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || !socket || !editingId) return;
    socket.emit('message:edit', { messageId: editingId, content: editContent.trim() });
    setEditingId(null); setEditContent('');
  };

  const canActOn = (t: Member) => {
    if (!currentUserRole || String(t.id) === String(me?.id) || t.role === 'owner') return false;
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && t.role === 'member') return true;
    return false;
  };

  const handleKick = async (member: Member) => {
    setActiveMenu(null);
    if (!confirm(`Expulser ${member.first_name} ${member.name} ?`)) return;
    const r = await fetch(`http://localhost:3001/servers/${serverId}/kick/${member.id}`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + token() },
    });
    if (r.ok) setMembers(prev => prev.filter(m => String(m.id) !== String(member.id)));
    else alert((await r.json()).message);
  };

  const BAN_MS: Record<string, number | null> = {
    permanent: null, '5min': 300_000, '10min': 600_000, '1h': 3_600_000, '24h': 86_400_000,
  };
  const handleBan = async () => {
    if (!banTarget) return;
    const ms   = BAN_MS[banDuration];
    const body = { reason: banReason || null, expiresAt: ms ? new Date(Date.now() + ms).toISOString() : null };
    const r    = await fetch(`http://localhost:3001/servers/${serverId}/ban/${banTarget.id}`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) { setMembers(prev => prev.filter(m => m.id !== banTarget.id)); closeBan(); }
    else alert((await r.json()).message);
  };
  const closeBan = () => { setBanTarget(null); setBanReason(''); setBanDuration('permanent'); };

  const MUTE_MS: Record<string, number> = { '5min': 300_000, '10min': 600_000, '30min': 1_800_000, '1h': 3_600_000 };
  const handleMute = async () => {
    if (!muteTarget) return;
    const r = await fetch(`http://localhost:3001/servers/${serverId}/mute/${muteTarget.id}`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: MUTE_MS[muteDuration] }),
    });
    if (r.ok) { alert(`${muteTarget.first_name} ${muteTarget.name} a été muté.`); setMuteTarget(null); setMuteDuration('5min'); }
    else alert((await r.json()).message);
  };

  const openDm = async (targetUserId: string) => {
    setActiveMenu(null);
    const r = await fetch('http://localhost:3001/dm/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
      body: JSON.stringify({ targetUserId }),
    });
    const d = await r.json();
    router.push(`/dm/${d.data._id}`);
  };

  // ── helpers ───────────────────────────────────────────────────────
  const isGif = (text: string) => /^https?:\/\/media[0-9]*\.giphy\.com/.test(text);

  const avatarColor = (id = '') => {
    const palette = ['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#3ba55d'];
    let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % palette.length;
    return palette[h];
  };
  const initials = (m?: Member | null) =>
    ((m?.first_name || m?.name || '?').charAt(0)).toUpperCase();

  const muteCountdown = () => {
    if (!muteUntil) return '';
    const s = Math.max(0, Math.ceil((muteUntil.getTime() - Date.now()) / 1000));
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  // ── render ────────────────────────────────────────────────────────
  const closeAll = () => { setEmojiPickerFor(null); setActiveMenu(null); setShowGif(false); };

  return (
    <div
      style={{ display: 'flex', height: '100vh', background: '#313338', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}
      onClick={closeAll}
    >

      {/* ═══════════════ CHANNELS SIDEBAR ═══════════════ */}
      <aside style={{ width: 220, background: '#2b2d31', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1f22', flexShrink: 0 }}>
        {/* Server name */}
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 15, borderBottom: '1px solid #1e1f22', background: '#2b2d31' }}>
          {serverName || '…'}
          <div style={{ marginTop: 4 }}>
            <a href="/server" style={{ fontSize: 11, color: '#5865f2', textDecoration: 'none' }}>← Mes serveurs</a>
          </div>
        </div>

        {/* Channel list */}
        <div style={{ padding: '8px 8px 4px', fontSize: 11, fontWeight: 700, color: '#96989d', textTransform: 'uppercase', letterSpacing: 1 }}>
          Channels texte
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {channels.map(ch => {
            const active = String(ch.id) === String(chId);
            return (
              <div
                key={ch.id}
                onClick={e => { e.stopPropagation(); router.push(`/chat/${ch.id}`); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', cursor: 'pointer', borderRadius: 4, margin: '1px 8px',
                  background: active ? '#404249' : 'transparent',
                  color: active ? '#fff' : '#96989d', fontSize: 14,
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#35373c'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ color: '#96989d' }}>#</span> {ch.name}
              </div>
            );
          })}
        </div>

        {/* Create channel (owner/admin) */}
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <div style={{ padding: 8, borderTop: '1px solid #1e1f22' }}>
            <a
              href={`/channelCreation/${serverId}`}
              style={{ display: 'block', padding: '6px 10px', background: '#383a40', borderRadius: 6, color: '#96989d', fontSize: 13, textDecoration: 'none', textAlign: 'center' }}
            >
              + Nouveau channel
            </a>
          </div>
        )}

        {/* Current user panel */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1e1f22', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(me?.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {((me?.first_name || me?.name || '?').charAt(0)).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {me?.first_name} {me?.name}
            </div>
            {isMuted && (
              <div style={{ fontSize: 10, color: '#ef4444' }}>🔇 Muté — {muteCountdown()}</div>
            )}
          </div>
        </div>
      </aside>

      {/* ═══════════════ MAIN CHAT ═══════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1f22', display: 'flex', alignItems: 'center', gap: 10, background: '#313338', flexShrink: 0 }}>
          <span style={{ color: '#96989d', fontSize: 20, fontWeight: 300 }}>#</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{channelName}</span>
          <div style={{ flex: 1 }} />
          {online.length > 0 && (
            <span style={{ fontSize: 12, color: '#96989d' }}>🟢 {online.length} en ligne</span>
          )}
          <a href={`/channel/${serverId}`} style={{ fontSize: 12, color: '#96989d', textDecoration: 'none' }}>⚙️ Serveur</a>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.map((m, i) => {
            const isMe        = me && (m.senderId || m.sender) === me.id;
            const senderMbr   = members.find(mb => mb.id === m.senderId);
            const senderLabel = senderMbr ? `${senderMbr.first_name} ${senderMbr.name}` : m.sender;

            if (m.type === 'system') return (
              <div key={m._id || i} style={{ textAlign: 'center', color: '#96989d', fontSize: 11, padding: '2px 0' }}>
                {m.text}
              </div>
            );

            return (
              <div key={m._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', padding: '3px 0' }}
                onDoubleClick={() => canEdit(m) && startEdit(m)}>

                {/* Sender label */}
                {!isMe && (
                  <div style={{ fontSize: 11, color: '#96989d', marginBottom: 2, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {senderLabel}
                    {senderMbr?.role === 'owner' && <span>👑</span>}
                    {senderMbr?.role === 'admin' && <span>🛡️</span>}
                  </div>
                )}

                {editingId === m._id ? (
                  <form onSubmit={submitEdit} style={{ display: 'flex', gap: 6, width: '60%' }}>
                    <input value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus
                      style={{ flex: 1, padding: '6px 10px', background: '#1a1a1a', border: '1px solid #5865f2', borderRadius: 6, color: 'white', fontSize: 14, outline: 'none' }} />
                    <button type="submit" style={{ background: '#5865f2', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>✓</button>
                    <button type="button" onClick={() => setEditingId(null)} style={{ background: '#4b5563', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                  </form>
                ) : (
                  <div style={{ position: 'relative', maxWidth: '68%' }}>
                    <div style={{
                      padding: isGif(m.text) ? 4 : '8px 12px',
                      borderRadius: 12,
                      background: isMe ? '#5865f2' : '#36393f',
                      borderBottomRightRadius: isMe ? 4 : 12,
                      borderBottomLeftRadius:  isMe ? 12 : 4,
                    }}>
                      {isGif(m.text) ? (
                        <img src={m.text} alt="gif" style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8, display: 'block' }} />
                      ) : (
                        <span style={{ fontSize: 14, wordBreak: 'break-word' }}>{m.text}</span>
                      )}
                    </div>

                    {m.isEdited && <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>(modifié)</span>}

                    {/* Edit button — appears on hover */}
                    {canEdit(m) && (
                      <button onClick={e => { e.stopPropagation(); startEdit(m); }}
                        style={{ position: 'absolute', top: -8, right: -8, background: '#36393f', border: '1px solid #1e1f22', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', color: '#96989d', fontSize: 11 }}>
                        ✏️
                      </button>
                    )}

                    {/* Reactions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3, position: 'relative' }} onClick={e => e.stopPropagation()}>
                      {(m.reactions || []).map((r: any) => {
                        const mine = r.users?.includes(String(me?.id));
                        return (
                          <button key={r.emoji} onClick={() => sendReaction(m._id, r.emoji)}
                            style={{ background: mine ? 'rgba(88,101,242,0.35)' : '#2a2a2a', border: mine ? '1px solid #5865f2' : '1px solid #374151', borderRadius: 10, padding: '1px 7px', cursor: 'pointer', fontSize: 12, color: mine ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {r.emoji} <span style={{ fontWeight: 600 }}>{r.users?.length}</span>
                          </button>
                        );
                      })}
                      <button onClick={() => setEmojiPickerFor(emojiPickerFor === m._id ? null : m._id)}
                        style={{ background: 'transparent', border: '1px dashed #374151', borderRadius: 10, padding: '1px 7px', cursor: 'pointer', color: '#6b7280', fontSize: 12 }}>
                        + 😊
                      </button>
                      {emojiPickerFor === m._id && (
                        <div style={{ position: 'absolute', bottom: 28, left: 0, background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: 8, display: 'flex', gap: 4, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                          {QUICK_EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => sendReaction(m._id, emoji)}
                              style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {typingText && (
          <div style={{ padding: '0 16px 4px', fontSize: 12, color: '#96989d' }}>{typingText}</div>
        )}

        {/* GIF picker */}
        {showGif && (
          <div style={{ margin: '0 16px 8px', background: '#2b2d31', borderRadius: 8, border: '1px solid #1e1f22', padding: 12 }} onClick={e => e.stopPropagation()}>
            <input value={gifQ} onChange={e => setGifQ(e.target.value)} placeholder="Rechercher un GIF…" autoFocus
              style={{ width: '100%', padding: '7px 12px', background: '#383a40', border: 'none', borderRadius: 6, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            {gifLoading && <div style={{ color: '#96989d', fontSize: 12, marginTop: 8 }}>Chargement…</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
              {gifResults.map(g => (
                <img key={g.id} src={g.preview || g.url} alt={g.title} onClick={() => sendGif(g)}
                  style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.outline = '2px solid #5865f2')}
                  onMouseLeave={e => (e.currentTarget.style.outline = 'none')} />
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
          {isMuted && (
            <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 6, padding: '6px 12px', marginBottom: 8, fontSize: 13, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔇 Vous êtes muté — vous pouvez écrire dans {muteCountdown()}.
            </div>
          )}
          <form onSubmit={send} style={{ display: 'flex', alignItems: 'center', background: '#383a40', borderRadius: 8, padding: '0 8px', gap: 4 }}>
            <button type="button" onClick={e => { e.stopPropagation(); setShowGif(prev => !prev); }} title="GIF"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: '0 4px', color: showGif ? '#5865f2' : '#96989d' }}>
              🎬
            </button>
            <input
              value={input}
              onChange={e => handleTyping(e.target.value)}
              placeholder={isMuted ? '🔇 Vous êtes muté' : `Message #${channelName}`}
              disabled={isMuted}
              style={{ flex: 1, padding: '11px 8px', background: 'transparent', border: 'none', color: 'white', fontSize: 14, outline: 'none', cursor: isMuted ? 'not-allowed' : 'text', opacity: isMuted ? 0.5 : 1 }}
            />
            <button type="submit" disabled={!input.trim() || isMuted}
              style={{ background: input.trim() && !isMuted ? '#5865f2' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: input.trim() && !isMuted ? 'white' : '#96989d', fontWeight: 700, fontSize: 16, transition: 'background 0.1s' }}>
              ➤
            </button>
          </form>
        </div>
      </div>

      {/* ═══════════════ MEMBERS SIDEBAR ═══════════════ */}
      <aside style={{ width: 200, background: '#2b2d31', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1e1f22', flexShrink: 0, overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {(['owner', 'admin', 'member'] as const).map(role => {
          const group = members.filter(m => m.role === role);
          if (!group.length) return null;
          const label = role === 'owner' ? 'Owner' : role === 'admin' ? 'Admins' : 'Membres';
          const icon  = role === 'owner' ? '👑' : role === 'admin' ? '🛡️' : null;
          return (
            <div key={role}>
              <div style={{ padding: '16px 12px 6px', fontSize: 11, fontWeight: 700, color: '#96989d', textTransform: 'uppercase', letterSpacing: 1 }}>
                {label} — {group.length}
              </div>
              {group.map(member => (
                <div
                  key={member.id}
                  onClick={() => setActiveMenu(prev => prev?.member.id === member.id ? null : { member, x: 0, y: 0 })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', borderRadius: 4, margin: '1px 4px', position: 'relative', background: activeMenu?.member.id === member.id ? '#404249' : 'transparent' }}
                  onMouseEnter={e => { if (activeMenu?.member.id !== member.id) (e.currentTarget as HTMLElement).style.background = '#35373c'; }}
                  onMouseLeave={e => { if (activeMenu?.member.id !== member.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(member.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {initials(member)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.first_name} {member.name}
                      {String(member.id) === String(me?.id) && <span style={{ color: '#96989d', fontSize: 10 }}> (vous)</span>}
                    </div>
                  </div>
                  {icon && <span style={{ fontSize: 13 }}>{icon}</span>}

                  {/* Inline dropdown when member is clicked */}
                  {activeMenu?.member.id === member.id && (
                    <div style={{ position: 'absolute', top: 40, right: 4, background: '#111214', border: '1px solid #1e1f22', borderRadius: 8, padding: 6, zIndex: 200, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
                      onClick={e => e.stopPropagation()}>
                      {member.id !== me?.id && (
                        <button onClick={() => openDm(member.id)}
                          style={menuBtnStyle('#96989d')}>
                          💬 Envoyer DM
                        </button>
                      )}
                      {canActOn(member) && (
                        <>
                          <button onClick={() => handleKick(member)} style={menuBtnStyle('#fbbf24')}>
                            👢 Expulser
                          </button>
                          <button onClick={() => { setBanTarget(member); setActiveMenu(null); }} style={menuBtnStyle('#ef4444')}>
                            🔨 Bannir
                          </button>
                          <button onClick={() => { setMuteTarget(member); setActiveMenu(null); }} style={menuBtnStyle('#9ca3af')}>
                            🔇 Muter
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </aside>

      {/* ═══════════════ BAN MODAL ═══════════════ */}
      {banTarget && (
        <div style={overlayStyle} onClick={closeBan}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>🔨 Bannir {banTarget.first_name} {banTarget.name}</h3>
            <p style={{ color: '#96989d', fontSize: 13, margin: '0 0 16px' }}>Choisissez la durée et la raison.</p>

            <label style={labelStyle}>DURÉE</label>
            <select value={banDuration} onChange={e => setBanDuration(e.target.value)} style={selectStyle}>
              <option value="permanent">Permanent</option>
              <option value="5min">5 minutes</option>
              <option value="10min">10 minutes</option>
              <option value="1h">1 heure</option>
              <option value="24h">24 heures</option>
            </select>

            <label style={{ ...labelStyle, marginTop: 12 }}>RAISON (optionnel)</label>
            <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Raison…"
              style={{ ...selectStyle, marginBottom: 0 }} />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={closeBan} style={btnSecondary}>Annuler</button>
              <button onClick={handleBan} style={{ ...btnSecondary, background: '#ef4444', color: 'white' }}>Confirmer le ban</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MUTE MODAL ═══════════════ */}
      {muteTarget && (
        <div style={overlayStyle} onClick={() => { setMuteTarget(null); setMuteDuration('5min'); }}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>🔇 Muter {muteTarget.first_name} {muteTarget.name}</h3>
            <p style={{ color: '#96989d', fontSize: 13, margin: '0 0 16px' }}>L'utilisateur ne pourra pas envoyer de messages pendant la durée choisie.</p>

            <label style={labelStyle}>DURÉE</label>
            <select value={muteDuration} onChange={e => setMuteDuration(e.target.value)} style={selectStyle}>
              <option value="5min">5 minutes</option>
              <option value="10min">10 minutes</option>
              <option value="30min">30 minutes</option>
              <option value="1h">1 heure</option>
            </select>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => { setMuteTarget(null); setMuteDuration('5min'); }} style={btnSecondary}>Annuler</button>
              <button onClick={handleMute} style={{ ...btnSecondary, background: '#5865f2', color: 'white' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── shared micro-styles ────────────────────────────────────────────
const menuBtnStyle = (color: string): React.CSSProperties => ({
  display: 'block', width: '100%', padding: '6px 10px',
  background: 'transparent', border: 'none', color, cursor: 'pointer',
  textAlign: 'left', fontSize: 13, borderRadius: 4,
});

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
};
const modalStyle: React.CSSProperties = {
  background: '#1e1f22', borderRadius: 12, padding: 24, width: 380, maxWidth: '90vw',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#96989d', display: 'block',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1,
};
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: '#383a40',
  border: '1px solid #374151', borderRadius: 6, color: 'white',
  fontSize: 14, marginBottom: 4, boxSizing: 'border-box',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', background: '#383a40', border: 'none',
  borderRadius: 6, color: 'white', cursor: 'pointer', fontWeight: 600,
};
