'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/signup.css';

export default function JoinServer() {
  const [formData, setFormData] = useState({
    inviteCode: ''
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vous devez être connecté !");
        router.push("/connexion");
        return;
      }

      const response = await fetch("http://localhost:3001/servers/join", { // route backend alignée
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok || response.status === 409) {
        // 409 = already a member — redirect anyway
        router.push(`/channel/${data.data.serverId}`);
      } else {
        alert("Erreur : " + (data.message || "Impossible de rejoindre le serveur"));
      }
    } catch (error) {
      alert("Impossible de rejoindre le serveur !");
      console.error(error);
    }
  };

  return (
    <div className="signup-container">
      <div className="section employeur">
        <h1>Rejoindre un serveur</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="inviteCode">Code d'invitation :</label>
            <input
              id="inviteCode"
              type="text"
              value={formData.inviteCode}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">Rejoindre</button>
        </form>
      </div> 
    </div>
  );
}