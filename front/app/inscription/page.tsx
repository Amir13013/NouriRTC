'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/signup.css';

export default function Inscription() {
  const [formData, setFormData] = useState({
    name: '',
    first_name: '',
    phone_number: '',
    mail: '',
    password: ''
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
      const response = await fetch("http://localhost:3001/api/User", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/connexion");
      } else {
        alert("Erreur : " + data.message);
      }
    } catch (error) {
      alert("Erreur de connexion au serveur !");
      console.error(error);
    }
  };

  return (
    <div className="signup-container">
      <div className="section employeur">
        <h1>S'inscrire</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Prénom :</label>
            <input id="name" type="text" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="first_name">Nom :</label>
            <input id="first_name" type="text" value={formData.first_name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Téléphone :</label>
            <input id="phone_number" type="text" value={formData.phone_number} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label htmlFor="mail">Email :</label>
            <input id="mail" type="mail" value={formData.mail} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe :</label>
            <input id="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit">Inscription</button>
        </form>
      </div>

      <a href="/" className="formation-link home-link">Retour à la page d'accueil</a>
    </div>
  );
}
