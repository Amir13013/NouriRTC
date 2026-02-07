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

      await fetch(`http://localhost:3001/api/servers/${serverId}/channels`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ name }),
      });

      alert("Channel créé !");
      router.push(`/channel/${serverId}`);

    } catch (err) {
      console.error(err);
      alert("Erreur de création de channel");
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
