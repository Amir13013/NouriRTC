'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useLanguage } from '../../../lib/useLanguage';

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
  createdAt?: string;
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

  // ── online status ──
  const [onlineGlobal, setOnlineGlobal] = useState<Set<string>>(new Set());

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

  const [me, setMe]    = useState<any>(null);
  const [gifModal, setGifModal] = useState<string | null>(null);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const messagesContainerRef  = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLTextAreaElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedId,  setCopiedId]  = useState<string | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const token = () => localStorage.getItem('token') || '';

  // ── i18n ──
  const { lang, setLang, t }      = useLanguage();
  const [translateOn, setTranslateOn]   = useState(false);
  // cache: messageId -> translated text (avoids re-translating the same message)
  const [txCache, setTxCache]     = useState<Record<string, string>>({});
  const [txPending, setTxPending] = useState<Set<string>>(new Set());

  // derived — use String() everywhere for safe UUID comparisons
  const currentUserRole = members.find(m => String(m.id) === String(me?.id))?.role ?? null;

  // ── init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setMe(JSON.parse(u));
  }, []);

  // ── notification permission ────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
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
          sender:    String(m.userId),
          senderId:  String(m.userId),
          text:      m.content,
          _id:       String(m._id),
          isEdited:  m.is_edited,
          reactions: m.reactions || [],
          createdAt: m.createdAt,
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
    s.on('channel message', (data: any) => {
      setMessages(prev => [...prev, {
        type: 'chat', sender: data.sender, senderId: data.senderId,
        text: data.msg, _id: String(data._id), reactions: [],
        createdAt: data.createdAt || new Date().toISOString(),
      }]);
      if (document.hidden && Notification.permission === 'granted') {
        const isGifMsg = /^https?:\/\/(media[0-9]*\.giphy\.com|i\.giphy\.com)/.test(data.msg);
        new Notification(data.sender || 'Nouveau message', {
          body: isGifMsg ? 'a envoyé un GIF' : (data.msg.length > 100 ? data.msg.slice(0, 100) + '…' : data.msg),
          icon: '/logo-icon.png',
          tag: 'channel-msg',
        });
      }
    });
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

    // Statut en ligne
    s.on('users:online', (ids: string[]) => setOnlineGlobal(new Set(ids)));
    s.on('user:status', ({ userId, online }: any) =>
      setOnlineGlobal(prev => {
        const next = new Set(prev);
        if (online) next.add(String(userId)); else next.delete(String(userId));
        return next;
      })
    );

    s.connect();
    s.emit('join channel', chId);
    s.emit('users:getOnline');
    setSocket(s);
    return () => { s.emit('leave channel', chId); s.disconnect(); };
  }, [chId]);

  useEffect(() => {
    if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-translate new messages when toggle is ON and lang != fr ──
  useEffect(() => {
    if (!translateOn || lang === 'fr') return;
    const t_ = token();
    if (!t_) return;

    const toTranslate = messages.filter(
      m => m.type === 'chat' && !txCache[m._id] && !txPending.has(m._id)
    );
    if (toTranslate.length === 0) return;

    // Mark as pending to avoid duplicate requests
    setTxPending(prev => {
      const next = new Set(prev);
      toTranslate.forEach(m => next.add(m._id));
      return next;
    });

    toTranslate.forEach(async (msg) => {
      try {
        const res = await fetch('http://localhost:3001/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t_ },
          body: JSON.stringify({ text: msg.text, target: lang }),
        });
        const data = await res.json();
        if (data.translated) {
          setTxCache(prev => ({ ...prev, [msg._id]: data.translated }));
        }
      } catch {
        // silently keep original
      } finally {
        setTxPending(prev => { const next = new Set(prev); next.delete(msg._id); return next; });
      }
    });
  }, [messages, translateOn, lang]);

  // ── GIF: load trending when picker opens, search otherwise ───────
  useEffect(() => {
    if (!showGif) return;
    if (gifQ.trim()) return; // search effect handles this
    setGifLoading(true);
    fetch(`http://localhost:3001/gif/trending?limit=16`, { headers: { Authorization: 'Bearer ' + token() } })
      .then(r => r.json())
      .then(d => setGifResults(d.data || []))
      .catch(() => {})
      .finally(() => setGifLoading(false));
  }, [showGif]);

  useEffect(() => {
    if (!gifQ.trim()) return; // empty → trending stays visible
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
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
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
    if (inputRef.current) inputRef.current.style.height = 'auto';
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

  // Only the owner can kick/ban/mute — admin can only DM
  const canActOn = (t: Member) => {
    if (currentUserRole !== 'owner') return false;
    if (String(t.id) === String(me?.id)) return false; // can't act on self
    if (t.role === 'owner') return false;               // can't act on another owner
    return true;
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
  const isGif = (text: string) =>
    /^https?:\/\/(media[0-9]*\.giphy\.com|i\.giphy\.com|media\.tenor\.com)/.test(text);

  const avatarColor = (id = '') => {
    const palette = ['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#3ba55d'];
    let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % palette.length;
    return palette[h];
  };
  const initials = (m?: Member | null) =>
    ((m?.first_name || m?.name || '?').charAt(0)).toUpperCase();

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const muteCountdown = () => {
    if (!muteUntil) return '';
    const s = Math.max(0, Math.ceil((muteUntil.getTime() - Date.now()) / 1000));
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  // ── render ────────────────────────────────────────────────────────
  const closeAll = () => { setEmojiPickerFor(null); setActiveMenu(null); setShowGif(false); setGifQ(''); setGifResults([]); };

  return (
    <div
      style={{ display: 'flex', height: '100vh', background: '#0e1117', color: '#e6edf3', fontFamily: 'sans-serif', overflow: 'hidden' }}
      onClick={closeAll}
    >

      {/* ═══════════════ CHANNELS SIDEBAR ═══════════════ */}
      <aside style={{ width: 220, background: '#111318', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1c2128', flexShrink: 0 }}>
        {/* Server name */}
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 15, borderBottom: '1px solid #1c2128', background: '#111318' }}>
          {serverName || '…'}
          <div style={{ marginTop: 4 }}>
            <a href="/server" style={{ fontSize: 11, color: '#5865f2', textDecoration: 'none' }}>{t('backToServers')}</a>
          </div>
        </div>

        {/* Channel list */}
        <div style={{ padding: '8px 8px 4px', fontSize: 11, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('textChannels')}
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
                  background: active ? '#1c2128' : 'transparent',
                  color: active ? '#e6edf3' : '#8b949e', fontSize: 14,
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#1c2128'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ color: '#8b949e' }}>#</span> {ch.name}
              </div>
            );
          })}
        </div>

        {/* Create channel (owner only) */}
        {currentUserRole === 'owner' && (
          <div style={{ padding: 8, borderTop: '1px solid #1c2128' }}>
            <a
              href={`/channelCreation/${serverId}`}
              style={{ display: 'block', padding: '6px 10px', background: '#21262d', borderRadius: 6, color: '#8b949e', fontSize: 13, textDecoration: 'none', textAlign: 'center' }}
            >
              {t('newChannel')}
            </a>
          </div>
        )}

        {/* Current user panel */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1c2128', display: 'flex', alignItems: 'center', gap: 8 }}>
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
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c2128', display: 'flex', alignItems: 'center', gap: 10, background: '#0e1117', flexShrink: 0 }}>
          <span style={{ color: '#8b949e', fontSize: 20, fontWeight: 300 }}>#</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{channelName}</span>
          <div style={{ flex: 1 }} />
          {online.length > 0 && (
            <span style={{ fontSize: 12, color: '#8b949e' }}>🟢 {online.length} {t('online')}</span>
          )}

          {/* Language picker — always visible */}
          <select
            value={lang}
            onChange={e => {
              const chosen = e.target.value as 'fr' | 'en' | 'es';
              setLang(chosen);
              // active la traduction automatiquement dès qu'on passe à EN/ES
              setTranslateOn(chosen !== 'fr');
              // vide le cache pour retraduire avec la nouvelle langue
              setTxCache({});
            }}
            style={{
              padding: '4px 8px', background: '#21262d', border: '1px solid #30363d',
              borderRadius: 6, color: '#e6edf3', fontSize: 12, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="fr">🇫🇷 FR</option>
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
          </select>

          {/* Indicateur actif quand traduction en cours */}
          {lang !== 'fr' && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', background: translateOn ? 'rgba(88,101,242,0.15)' : 'transparent',
              border: `1px solid ${translateOn ? '#5865f2' : 'transparent'}`,
              borderRadius: 6, fontSize: 12, color: translateOn ? '#5865f2' : '#8b949e',
              cursor: 'pointer',
            }}
              onClick={() => setTranslateOn(o => !o)}
              title={t('translateMessages')}
            >
              🌐 {translateOn ? t('translateMessages') : t('showOriginal')}
            </span>
          )}

          <a href={`/channel/${serverId}`} style={{ fontSize: 12, color: '#8b949e', textDecoration: 'none' }}>{t('serverSettings')}</a>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={() => {
            const el = messagesContainerRef.current;
            if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
          }}
          style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.map((m, i) => {
            const isMe        = me && String(m.senderId || m.sender) === String(me.id);
            const senderMbr   = members.find(mb => String(mb.id) === String(m.senderId));
            const senderLabel = senderMbr
              ? `${senderMbr.first_name} ${senderMbr.name}`
              : (m.sender?.length === 36 ? 'Utilisateur inconnu' : m.sender);

            if (m.type === 'system') return (
              <div key={m._id || i} style={{ textAlign: 'center', color: '#8b949e', fontSize: 11, padding: '2px 0' }}>
                {m.text}
              </div>
            );

            return (
              <div key={m._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', padding: '3px 0' }}
                onDoubleClick={() => canEdit(m) && startEdit(m)}
                onMouseEnter={() => setHoveredMsg(m._id)}
                onMouseLeave={() => setHoveredMsg(null)}>

                {/* Sender label */}
                {!isMe && (
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {senderLabel}
                    {senderMbr?.role === 'owner' && <span>👑</span>}
                    {senderMbr?.role === 'admin' && <span>🛡️</span>}
                  </div>
                )}

                {editingId === m._id ? (
                  <form onSubmit={submitEdit} style={{ display: 'flex', gap: 6, width: '60%' }}>
                    <input value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus
                      style={{ flex: 1, padding: '6px 10px', background: '#0e1117', border: '1px solid #5865f2', borderRadius: 6, color: 'white', fontSize: 14, outline: 'none' }} />
                    <button type="submit" style={{ background: '#5865f2', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>✓</button>
                    <button type="button" onClick={() => setEditingId(null)} style={{ background: '#4b5563', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                  </form>
                ) : (
                  <div style={{ position: 'relative', maxWidth: '68%' }}>
                    <div style={{
                      padding: isGif(m.text) ? 4 : '8px 12px',
                      borderRadius: 12,
                      background: isMe ? '#5865f2' : '#161b22',
                      borderBottomRightRadius: isMe ? 4 : 12,
                      borderBottomLeftRadius:  isMe ? 12 : 4,
                    }}>
                      {isGif(m.text) ? (
                        <img src={m.text} alt="gif" onClick={e => { e.stopPropagation(); setGifModal(m.text); }} style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8, display: 'block', cursor: 'zoom-in' }} />
                      ) : (
                        <span style={{ fontSize: 14, wordBreak: 'break-word' }}>
                          {renderText(translateOn && lang !== 'fr' && txCache[m._id] ? txCache[m._id] : m.text)}
                        </span>
                      )}
                    </div>

                    {/* Pending translation indicator */}
                    {translateOn && lang !== 'fr' && txPending.has(m._id) && (
                      <span style={{ fontSize: 10, color: '#5865f2', marginLeft: 4 }}>{t('translating')}</span>
                    )}
                    {/* Show original link when displaying translation */}
                    {translateOn && lang !== 'fr' && txCache[m._id] && txCache[m._id] !== m.text && (
                      <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>
                        — <span
                          title={m.text}
                          style={{ cursor: 'help', textDecoration: 'underline dotted' }}
                        >{t('showOriginal')}</span>
                      </span>
                    )}

                    {m.isEdited && <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>{t('modified')}</span>}
                    {m.createdAt && <span style={{ fontSize: 10, color: '#484f58', marginLeft: 6 }}>{formatTime(m.createdAt)}</span>}
                    {hoveredMsg === m._id && !isGif(m.text) && (
                      <button
                        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(m.text); setCopiedId(m._id); setTimeout(() => setCopiedId(null), 1500); }}
                        title="Copier le message"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copiedId === m._id ? '#3fb950' : '#6b7280', fontSize: 12, padding: '2px 4px', marginLeft: 2 }}
                      >{copiedId === m._id ? '✓' : '📋'}</button>
                    )}

                    {/* Edit button — always visible on own messages */}
                    {canEdit(m) && (
                      <button onClick={e => { e.stopPropagation(); startEdit(m); }}
                        title="Modifier ce message"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 12, padding: '2px 4px', marginTop: 2 }}>
                        {t('editBtn')}
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
                        title="Réagir"
                        style={{ background: '#2a2a2a', border: '1px solid #374151', borderRadius: 10, padding: '2px 8px', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>
                        😊
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
          {showScrollBtn && (
            <div style={{ position: 'sticky', bottom: 16, alignSelf: 'flex-end', zIndex: 10 }}>
              <button
                onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
                title="Aller en bas"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#5865f2', border: 'none', color: 'white',
                  fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >↓</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {typingText && (
          <div style={{ padding: '0 16px 4px', fontSize: 12, color: '#8b949e' }}>{typingText}</div>
        )}

        {/* GIF picker */}
        {showGif && (
          <div style={{ margin: '0 16px 8px', background: '#111318', borderRadius: 8, border: '1px solid #1c2128', padding: 12 }} onClick={e => e.stopPropagation()}>
            <input value={gifQ} onChange={e => setGifQ(e.target.value)} placeholder={t('searchGif')} autoFocus
              style={{ width: '100%', padding: '7px 12px', background: '#21262d', border: 'none', borderRadius: 6, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            {gifLoading && <div style={{ color: '#8b949e', fontSize: 12, marginTop: 8 }}>{t('loadingGif')}</div>}
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
          <form onSubmit={send} style={{ display: 'flex', alignItems: 'center', background: '#21262d', borderRadius: 8, padding: '0 8px', gap: 4 }}>
            <button type="button" onClick={e => { e.stopPropagation(); setShowGif(prev => !prev); }} title="GIF"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: '0 4px', color: showGif ? '#5865f2' : '#8b949e' }}>
              🎬
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as any); } }}
              placeholder={isMuted ? t('mutedLabel') : `${t('messagePlaceholder')} #${channelName}`}
              disabled={isMuted}
              rows={1}
              style={{ flex: 1, padding: '11px 8px', background: 'transparent', border: 'none', color: 'white', fontSize: 14, outline: 'none', cursor: isMuted ? 'not-allowed' : 'text', opacity: isMuted ? 0.5 : 1, resize: 'none', overflow: 'hidden', lineHeight: '1.4', fontFamily: 'inherit' }}
            />
            <button type="submit" disabled={!input.trim() || isMuted}
              style={{ background: input.trim() && !isMuted ? '#5865f2' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: input.trim() && !isMuted ? 'white' : '#8b949e', fontWeight: 700, fontSize: 16, transition: 'background 0.1s' }}>
              ➤
            </button>
          </form>
        </div>
      </div>

      {/* ═══════════════ MEMBERS SIDEBAR ═══════════════ */}
      <aside style={{ width: 200, background: '#111318', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1c2128', flexShrink: 0, overflowY: 'auto', color: '#e6edf3' }}
        onClick={e => e.stopPropagation()}>

        {(['owner', 'admin', 'member'] as const).map(role => {
          const group = members.filter(m => m.role === role);
          if (!group.length) return null;
          const label = role === 'owner' ? 'Owner' : role === 'admin' ? 'Admins' : 'Membres';
          const icon  = role === 'owner' ? '👑' : role === 'admin' ? '🛡️' : null;
          return (
            <div key={role}>
              <div style={{ padding: '16px 12px 6px', fontSize: 11, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>
                {label} — {group.length}
              </div>
              {group.map(member => (
                <div
                  key={member.id}
                  onClick={() => setActiveMenu(prev => prev?.member.id === member.id ? null : { member, x: 0, y: 0 })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', borderRadius: 4, margin: '1px 4px', position: 'relative', background: activeMenu?.member.id === member.id ? '#1c2128' : 'transparent' }}
                  onMouseEnter={e => { if (activeMenu?.member.id !== member.id) (e.currentTarget as HTMLElement).style.background = '#1c2128'; }}
                  onMouseLeave={e => { if (activeMenu?.member.id !== member.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(member.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                      {initials(member)}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 11, height: 11, borderRadius: '50%',
                      background: onlineGlobal.has(String(member.id)) ? '#3fb950' : '#6b7280',
                      border: '2px solid #111318',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.first_name} {member.name}
                      {String(member.id) === String(me?.id) && <span style={{ color: '#8b949e', fontSize: 10 }}> (vous)</span>}
                    </div>
                  </div>
                  {icon && <span style={{ fontSize: 13 }}>{icon}</span>}

                  {/* Inline dropdown when member is clicked */}
                  {activeMenu?.member.id === member.id && (
                    <div style={{ position: 'absolute', top: 40, right: 4, background: '#0e1117', border: '1px solid #1c2128', borderRadius: 8, padding: 6, zIndex: 200, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
                      onClick={e => e.stopPropagation()}>
                      {member.id !== me?.id && (
                        <button onClick={() => openDm(member.id)}
                          style={menuBtnStyle('#8b949e')}>
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
            <p style={{ color: '#8b949e', fontSize: 13, margin: '0 0 16px' }}>Choisissez la durée et la raison.</p>

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
            <p style={{ color: '#8b949e', fontSize: 13, margin: '0 0 16px' }}>L'utilisateur ne pourra pas envoyer de messages pendant la durée choisie.</p>

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

      {/* ═══════════════ GIF FULLSCREEN ═══════════════ */}
      {gifModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, cursor: 'zoom-out' }}
          onClick={() => setGifModal(null)}
        >
          <img src={gifModal} alt="gif" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }} />
        </div>
      )}
    </div>
  );
}

// ── markdown renderer ─────────────────────────────────────────────
function renderText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  let last = 0; let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith('**'))
      parts.push(<strong key={match.index}>{raw.slice(2, -2)}</strong>);
    else if (raw.startsWith('*'))
      parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>);
    else
      parts.push(<code key={match.index} style={{ background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 13 }}>{raw.slice(1, -1)}</code>);
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
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
  background: '#1c2128', borderRadius: 12, padding: 24, width: 380, maxWidth: '90vw',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#8b949e', display: 'block',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1,
};
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: '#21262d',
  border: '1px solid #374151', borderRadius: 6, color: 'white',
  fontSize: 14, marginBottom: 4, boxSizing: 'border-box',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', background: '#21262d', border: 'none',
  borderRadius: 6, color: 'white', cursor: 'pointer', fontWeight: 600,
};
