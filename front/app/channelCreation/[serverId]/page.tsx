'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '../../../styles/signup.css';

export default function CreateChannel() {
  const params = useParams();
  const serverId = params.serverId as string;
  const router = useRouter();

  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/connexion");

      const res = await fetch(`http://localhost:3001/servers/${serverId}/channels`, { // <-- enlever /api
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur lors de la création du channel");
      }

      alert("Channel créé !");
      router.push(`/channel/${serverId}`);

    } catch (err: any) {
      console.error(err);
      alert("Erreur de création de channel : " + err.message);
    }
  };

  return (
    <div className="signup-container">
      <div className="section employeur">
        <h1>Création de channel</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <button type="submit" >Créer</button>
        </form>
      </div>
    </div>
  );
}
