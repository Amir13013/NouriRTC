'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/signup.css';

export default function CreateServer() {
  const [formData, setFormData] = useState({
    name: ''
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

      const response = await fetch("http://localhost:3001/api/servers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(formData),
      });

      alert("Création de serveurs réussie !");
      router.push("/server");
      
    } catch (error) {
      alert("Erreur de création de serveur !");
      console.error(error);
    }
  };

  return (
    <div className="signup-container">
      <div className="section employeur">
        <h1>Créé votre serveur</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom:</label>
            <input id="name" type="text" value={formData.name} onChange={handleChange} required />
          </div>

          <button type="submit">Créer</button>
        </form>
      </div>
    </div>
  );
}
