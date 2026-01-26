document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formAnnonce");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const response = await fetch("http://localhost:3000/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({email, password }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Connexion réussie !");
        window.location.replace("jb.html");
      } else {
        alert("Erreur : " + data.message);
      }
    } catch (error) {
      alert("Erreur de connexion au serveur !");
      console.error(error);
    }
  });
});
console.log("connexion.js")
