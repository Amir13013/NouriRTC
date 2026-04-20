'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import '../../../styles/serverActions.css';

type Channel = {
  id: string;
  name: string;
  server_id: string;
};

type Member = {
  id: string;
  name: string;
  first_name: string;
  role: 'owner' | 'admin' | 'member';
};

type ContextMenu = {
  x: number;
  y: number;
  member: Member;
};

export default function ChannelPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const router = useRouter();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [banTarget, setBanTarget] = useState<Member | null>(null);
  const [banReason, setBanReason] = useState<string>("");

  // Récupère l'id de l'utilisateur connecté
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      } catch {}
    }
  }, []);

  // Ferme le menu contextuel au clic ailleurs
  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Fetch channels, membres, invite code
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/connexion"); return; }

      try {
        const [resChannels, resMembers, resInvite] = await Promise.all([
          fetch(`http://localhost:3001/servers/${serverId}/channels`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://localhost:3001/servers/${serverId}/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://localhost:3001/servers/${serverId}/inviteCode`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const channelsData = await resChannels.json();
        setChannels(channelsData.data || []);

        const membersData = await resMembers.json();
        setMembers(membersData.data || []);

        const inviteData = await resInvite.json();
        setInviteCode(inviteData.data?.inviteCode || "");
      } catch (err) {
        console.error(err);
        alert("Impossible de récupérer les données du serveur");
      }
    };

    if (serverId) fetchData();
  }, [serverId, router]);

  // Rôle de l'utilisateur connecté dans ce serveur
  const currentUserRole = members.find(m => m.id === currentUserId)?.role ?? null;

  // Peut-on agir sur ce membre ?
  const canActOn = useCallback((target: Member): boolean => {
    if (!currentUserRole) return false;
    if (target.id === currentUserId) return false;
    if (target.role === 'owner') return false;
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && target.role === 'member') return true;
    return false;
  }, [currentUserRole, currentUserId]);

  // Clic droit sur un membre
  const handleRightClick = (e: React.MouseEvent, member: Member) => {
    if (!canActOn(member)) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, member });
  };

  // Kick
  const handleKick = async (member: Member) => {
    setContextMenu(null);
    if (!confirm(`Expulser ${member.first_name} ${member.name} du serveur ?`)) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}/kick/${member.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${member.first_name} ${member.name} a été expulsé.`);
        setMembers(prev => prev.filter(m => m.id !== member.id));
      } else {
        alert("Erreur : " + data.message);
      }
    } catch {
      alert("Erreur réseau");
    }
  };

  // Ban
  const handleBan = async () => {
    if (!banTarget) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}/ban/${banTarget.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason || null }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${banTarget.first_name} ${banTarget.name} a été banni.`);
        setMembers(prev => prev.filter(m => m.id !== banTarget.id));
      } else {
        alert("Erreur : " + data.message);
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setBanTarget(null);
      setBanReason("");
    }
  };

  // Quitter le serveur
  const handleLeaveServer = async () => {
    if (!confirm("Quitter ce serveur ?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      alert("Vous avez quitté le serveur");
      router.push("/server");
    } catch {
      alert("Impossible de quitter le serveur");
    }
  };

  // Supprimer le serveur
  const handleDeleteServer = async () => {
    if (!confirm("Supprimer définitivement ce serveur ?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3001/servers/${serverId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      alert("Serveur supprimé");
      router.push("/server");
    } catch {
      alert("Impossible de supprimer le serveur");
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'owner') return <span className="badge badge-owner">👑 Owner</span>;
    if (role === 'admin') return <span className="badge badge-admin">🛡️ Admin</span>;
    return <span className="badge badge-member">Membre</span>;
  };

  return (
    <div>
      <nav>
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <Link href={`/channelCreation/${serverId}`}>Créer un channel</Link>
        )}
        <button onClick={handleLeaveServer}>Quitter le serveur</button>
        {currentUserRole === 'owner' && (
          <button onClick={handleDeleteServer} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
            Supprimer le serveur
          </button>
        )}
      </nav>

      <section>
        <h2>Channels</h2>
        <p>Code d'invitation : <strong style={{ color: '#38bdf8' }}>{inviteCode}</strong></p>
        <ul>
          {channels.map(channel => (
            <li key={channel.id}>
              <Link href={`/chat/${channel.id}`}>{channel.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>
          Membres
          {currentUserRole && (
            <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '10px' }}>
              — vous êtes {roleBadge(currentUserRole)}
            </span>
          )}
        </h2>
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            Clic droit sur un membre pour l'expulser ou le bannir
          </p>
        )}
        <ul className="members-list">
          {members.map(member => (
            <li
              key={member.id}
              onContextMenu={(e) => handleRightClick(e, member)}
              className={`member-item ${canActOn(member) ? 'member-actionable' : ''}`}
            >
              <div className="member-info">
                <span className="member-name">
                  {member.first_name} {member.name}
                  {member.id === currentUserId && <span className="you-tag"> (vous)</span>}
                </span>
                {roleBadge(member.role)}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Menu contextuel clic droit */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="context-menu-header">
            {contextMenu.member.first_name} {contextMenu.member.name}
          </div>
          <button className="context-btn context-kick" onClick={() => handleKick(contextMenu.member)}>
            👢 Expulser (Kick)
          </button>
          <button className="context-btn context-ban" onClick={() => {
            setBanTarget(contextMenu.member);
            setContextMenu(null);
          }}>
            🔨 Bannir
          </button>
        </div>
      )}

      {/* Modal de bannissement */}
      {banTarget && (
        <div className="modal-overlay" onClick={() => { setBanTarget(null); setBanReason(""); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🔨 Bannir {banTarget.first_name} {banTarget.name}</h3>
            <p>Cette action est permanente. L'utilisateur ne pourra plus rejoindre ce serveur.</p>
            <input
              type="text"
              className="modal-input"
              placeholder="Raison du ban (optionnel)"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setBanTarget(null); setBanReason(""); }}>
                Annuler
              </button>
              <button className="btn-ban" onClick={handleBan}>
                Confirmer le ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
