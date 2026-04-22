'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/signup.css';

export default function Connexion() {
  const [formData, setFormData] = useState({
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
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        console.log('TOKEN SAUVÉ:', data.accessToken);
        
        alert("Connexion réussie !");
        router.push("/server"); // redirection vers l'accueil
      } else {
        alert("Erreur : " + (data.message || "Identifiants incorrects"));
      }
    } catch (error) {
      alert("Erreur de connexion au serveur !");
      console.error(error);
    }
  };

  return (
    <div className="signup-container">
      <div className="section employeur">
        <h1>Connexion</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mail">Email :</label>
            <input
              id="mail"
              type="text"
              value={formData.mail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe :</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">Connexion</button>
        </form>
      </div>

      <a href="/" className="formation-link home-link">
        Retour à la page d'accueil
      </a>
    </div>
  );
}
