'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import '../../../styles/serverActions.css';

type Channel = {
  id: number;
  name: string;
  server_id: number;
};

type User = {
  name: string;
};

export default function ChannelPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const router = useRouter();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inviteCode, setInviteCode] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vous devez être connecté !");
        router.push("/connexion");
        return;
      }

      try {
        const resChannels = await fetch(
          `http://localhost:3001/api/servers/${serverId}/channels`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        if (!resChannels.ok) throw new Error("Erreur channels");
        const channelsData = await resChannels.json();
        setChannels(channelsData.data);

        const resUsers = await fetch(
          `http://localhost:3001/api/servers/${serverId}/users`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        if (!resUsers.ok) throw new Error("Erreur users");
        const usersData = await resUsers.json();
        setUsers(usersData.data);

        const resInvite = await fetch(
          `http://localhost:3001/api/servers/${serverId}/inviteCode`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        if (!resInvite.ok) throw new Error("Erreur invite code");
        const inviteData = await resInvite.json();
        setInviteCode(inviteData.data.inviteCode);

      } catch (err) {
        console.error(err);
        alert("Impossible de récupérer les données du serveur");
      }
    };

    if (serverId) fetchData();
  }, [serverId, router]);

  // Quitter le serveur
  const handleLeaveServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(
        `http://localhost:3001/api/servers/${serverId}`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token },
        }
      );

      alert("Vous avez quitté le serveur");
      router.push("/server");
    } catch (err) {
      console.error(err);
      alert("Impossible de quitter le serveur");
    }
  };

  // Supprimer le serveur
  const handleDeleteServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(
        `http://localhost:3001/api/servers/${serverId}/server`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token },
        }
      );

      alert("Vous avez supprimé le serveur");
      router.push("/server");
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer le serveur");
    }
  };

  return (
    <div>
      <nav>
        <Link href={`/channelCreation/${serverId}`}>Créer un channel</Link>
        <button onClick={handleLeaveServer}>Quitter le serveur</button>
        <button onClick={handleDeleteServer}>Supprimer le serveur</button>
      </nav>

      <section>
        <h2>Channels du serveur</h2>
        <p>Code d'invitation : <strong>{inviteCode}</strong></p>

        <ul>
          {channels.map(channel => (
            <li key={channel.id}>
              <Link href={`/chat/${channel.id}`}>{channel.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Membres du serveur</h2>

        <ul>
          {users.map((user, index) => (
            <li key={index}>{user.name}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
