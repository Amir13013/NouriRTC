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

export default function ChatPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchServers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vous devez être connecté !");
        router.push("/connexion");
        return;
      }

      try {
        const res = await fetch("http://localhost:3001/api/servers/members", {
          headers: {
            "Authorization": "Bearer " + token,
          },
        });

        if (!res.ok) throw new Error("Erreur lors de la récupération des serveurs");

        const data = await res.json();
        setServers(data.data || []);
      } catch (err) {
        console.error(err);
        alert("Impossible de récupérer vos serveurs !");
      }
    };

    fetchServers();
  }, [router]);

  return (
    <div>

      <nav>
        <a href="/serverCreation">Créer un serveur  </a> |{" "}
        <a href="/joinServer" >Rejoindre un serveur</a>
      </nav>

      <section>
        <h2>Mes serveurs</h2>

          <ul>
            {servers.map(server => (
              <li key={server.id}>
                <a href={`/channel/${server.id}`}>{server.name}</a>
              </li>
            ))}
          </ul>
      </section>
    </div>
  );
}
