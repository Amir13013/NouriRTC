document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formAnnonce");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const first_name = document.getElementById('first_name').value;
    const phone_number = document.getElementById('phone_number').value;
    const mail = document.getElementById('mail').value;
    const password = document.getElementById('password').value;
    const adress = document.getElementById('adress').value;
    const city = document.getElementById('city').value;
    
    try {
      const response = await fetch("http://localhost:3000/api/People", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({name, first_name, phone_number, mail, password, adress, city}),
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