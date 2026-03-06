'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "../../../styles/channel.css";

let typingTimeout: any = null;

export default function ChatPage() {
  const { channelId } = useParams();
  const router = useRouter();

  const [socket, setSocket] = useState<any>(null);

  const [channelName, setChannelName] = useState("");
  const [serverId, setServerId] = useState("");

  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [typingText, setTypingText] = useState("");

  // Récupération infos channel via API nom server
  useEffect(() => {
    const fetchChannel = async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/connexion");

      try {
        // Utilisation de la route testée GET /channels/:channelId
        const res = await fetch(
          `http://localhost:3001/channels/${channelId}`,
          { headers: { Authorization: "Bearer " + token } }
        );

        if (!res.ok) throw new Error("Impossible de récupérer le channel");

        const data = await res.json();
        setChannelName(data.data.name);
        setServerId(data.data.server_id);
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la récupération du channel");
        router.push("/server");
      }
    };

    fetchChannel();
  }, [channelId, router]);

  // --- Récupération messages persistants MongoDB ---
  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(
          `http://localhost:3001/message/channel/${channelId}`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );

        if (!res.ok) throw new Error("Impossible de récupérer les messages");

        const data = await res.json();

        // On mappe pour correspondre à la structure du front
        const mappedMessages = data.data.map((m: any) => ({
          type: "chat",
          sender: m.userId, // ou m.userName si tu as stocké le nom
          text: m.content,
          _id: m._id,
          createdAt: m.createdAt
        }));

        setMessages(mappedMessages);
      } catch (err) {
        console.error(err);
      }
    };

    if (channelId) fetchMessages();
  }, [channelId]);

  // Connexion socket + listeners
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io("http://localhost:3001", {
      auth: { token },
      autoConnect: false,
    });

    // msg système
    s.on("system", (msg: string) => {
      setMessages(prev => [...prev, { type: "system", text: msg }]);
    });

    // msg chnl
    s.on("channel message", (data: any) => {
      setMessages(prev => [
        ...prev,
        { type: "chat", sender: data.sender, text: data.msg },
      ]);
    });

    // users online
    s.on("channel users", (data: any) => {
      if (String(data.channelId) === String(channelId)) {
        setUsers(data.users);
      }
    });

    // typing
    s.on("typing", (data: any) => {
      setTypingText(
        data.isTyping ? `${data.user} est en train d'écrire...` : ""
      );
    });

    s.connect();
    s.emit("join channel", channelId);

    setSocket(s);

    return () => {
      s.emit("leave channel", channelId);
      s.disconnect();
    };
  }, [channelId]);

  // Typing avec debounce
  const handleTyping = (value: string) => {
    setInput(value);
    if (!socket) return;

    socket.emit("typing", { channelId, isTyping: true });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("typing", { channelId, isTyping: false });
    }, 900);
  };

  // Envoi message
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    socket.emit("channel message", { channelId, msg: input });
    socket.emit("typing", { channelId, isTyping: false });

    setInput("");
  };

  // Quitter le channel
  const leaveChannel = () => {
    if (!socket) return;

    socket.emit("leave channel", channelId);
    socket.disconnect();
    router.push(`/channel/${serverId}`);
  };

  // Supprimer le channel
  const deleteChannel = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Utilisation de la route testée DELETE /channels/:channelId
      const res = await fetch(
        `http://localhost:3001/channels/${channelId}`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token },
        }
      );

      if (!res.ok) throw new Error("Impossible de supprimer le channel");

      alert("Channel supprimé !");
      router.push(`/channel/${serverId}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du channel");
    }
  };

  return (
    <div className="chat-app">
      <div className="header">
        <h1>{channelName}</h1>
        <button onClick={leaveChannel}>Leave</button>
      </div>

      <div className="actions">
        <button onClick={deleteChannel}>Supprimer le channel</button>
      </div>

      <div className="users">
        <strong>Utilisateurs :</strong> {users.join(", ") || "..."}
      </div>

      {typingText && <div className="typing">{typingText}</div>}

      <div className="messages">
        <ul>
          {messages.map((m, i) => (
            <li key={i}>
              {m.type === "system" ? (
                <div className="system">{m.text}</div>
              ) : (
                <div className="message other">
                  <div className="author">{m.sender}</div>
                  <div className="content">{m.text}</div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={send}>
        <input
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Message…"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
