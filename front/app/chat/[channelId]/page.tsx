'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import '../../../styles/channel.css';

let typingTimeout: any = null;

export default function ChatPage() {
  const { channelId } = useParams();
  const router = useRouter();

  const [socket, setSocket] = useState<any>(null);
  const [channelName, setChannelName] = useState('');
  const [serverId, setServerId] = useState('');
  const [canManage, setCanManage] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [typingText, setTypingText] = useState('');

  // feature/message-edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const currentUserRef = useRef<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) currentUserRef.current = JSON.parse(userStr);
  }, []);

  useEffect(() => {
    const fetchChannel = async () => {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/connexion');
      try {
        const res = await fetch(`http://localhost:3001/channels/${channelId}`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setChannelName(data.data.name);
        const sid = data.data.server_id;
        setServerId(sid);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const me = JSON.parse(userStr);
          const resM = await fetch(`http://localhost:3001/servers/${sid}/users`, {
            headers: { Authorization: 'Bearer ' + token },
          });
          if (resM.ok) {
            const md = await resM.json();
            const myMember = (md.data || []).find((m: any) => m.id === me.id);
            if (myMember && ['owner', 'admin'].includes(myMember.role)) setCanManage(true);
          }
        }
      } catch { alert('Erreur channel'); router.push('/server'); }
    };
    fetchChannel();
  }, [channelId, router]);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`http://localhost:3001/message/channel/${channelId}`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.data.map((m: any) => ({
          type: 'chat',
          sender: m.userId,
          text: m.content,
          _id: String(m._id),
          isEdited: m.is_edited,
          editedAt: m.edited_at,
        })));
      } catch {}
    };
    if (channelId) fetchMessages();
  }, [channelId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const s = io('http://localhost:3001', { auth: { token }, autoConnect: false });

    s.on('system', (msg: string) => setMessages(prev => [...prev, { type: 'system', text: msg }]));

    s.on('channel message', (data: any) => {
      setMessages(prev => [...prev, {
        type: 'chat', sender: data.sender, text: data.msg, _id: String(data._id),
      }]);
    });

    s.on('channel users', (data: any) => {
      if (String(data.channelId) === String(channelId)) setUsers(data.users);
    });

    s.on('typing', (data: any) => {
      setTypingText(data.isTyping ? `${data.user} est en train d'écrire...` : '');
    });

    // feature/message-edit
    s.on('message:edited', (data: any) => {
      setMessages(prev => prev.map(m =>
        m._id === data.messageId
          ? { ...m, text: data.content, isEdited: true, editedAt: data.editedAt }
          : m
      ));
    });

    s.on('member:kicked', (data: any) => {
      const me = currentUserRef.current;
      if (me && String(data.userId) === String(me.id)) {
        s.disconnect(); alert('Vous avez été expulsé.'); router.push('/server');
      }
    });

    s.on('member:banned', (data: any) => {
      const me = currentUserRef.current;
      if (me && String(data.userId) === String(me.id)) {
        s.disconnect(); alert('Vous avez été banni.'); router.push('/server');
      }
    });

    s.connect();
    s.emit('join channel', channelId);
    setSocket(s);
    return () => { s.emit('leave channel', channelId); s.disconnect(); };
  }, [channelId]);

  const handleTyping = (value: string) => {
    setInput(value);
    if (!socket) return;
    socket.emit('typing', { channelId, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('typing', { channelId, isTyping: false }), 900);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('channel message', { channelId, msg: input });
    socket.emit('typing', { channelId, isTyping: false });
    setInput('');
  };

  // feature/message-edit
  const startEdit = (msg: any) => {
    const me = currentUserRef.current;
    if (!me || msg.sender !== me.id) return;
    setEditingId(msg._id);
    setEditContent(msg.text);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || !socket || !editingId) return;
    socket.emit('message:edit', { messageId: editingId, content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  };

  const leaveChannel = () => {
    if (!socket) return;
    socket.emit('leave channel', channelId);
    socket.disconnect();
    router.push(`/channel/${serverId}`);
  };

  const deleteChannel = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/channels/${channelId}`, {
        method: 'DELETE', headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) throw new Error();
      alert('Channel supprimé !');
      router.push(`/channel/${serverId}`);
    } catch { alert('Erreur suppression channel'); }
  };

  return (
    <div className="chat-app">
      <div className="header">
        <h1>{channelName}</h1>
        <button onClick={leaveChannel}>Leave</button>
      </div>

      {canManage && (
        <div className="actions">
          <button onClick={deleteChannel}>Supprimer le channel</button>
        </div>
      )}

      <div className="users">
        <strong>En ligne :</strong> {users.join(', ') || '...'}
      </div>

      {typingText && <div className="typing">{typingText}</div>}

      <div className="messages">
        <ul>
          {messages.map((m, i) => (
            <li key={m._id || i}>
              {m.type === 'system' ? (
                <div className="system">{m.text}</div>
              ) : editingId === m._id ? (
                <form onSubmit={submitEdit} style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    autoFocus
                    style={{ flex: 1, padding: '6px 10px', background: '#1a1a1a', border: '1px solid #5865f2', borderRadius: 4, color: 'white' }}
                  />
                  <button type="submit" style={{ background: '#5865f2', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>✓</button>
                  <button type="button" onClick={() => setEditingId(null)} style={{ background: '#4b5563', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>✕</button>
                </form>
              ) : (
                <div className="message other">
                  <div className="author">
                    {m.sender}
                    {m.isEdited && <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>(modifié)</span>}
                  </div>
                  <div
                    className="content"
                    onDoubleClick={() => startEdit(m)}
                    title="Double-cliquer pour modifier"
                  >
                    {m.text}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={send}>
        <input
          value={input}
          onChange={e => handleTyping(e.target.value)}
          placeholder="Message…"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
