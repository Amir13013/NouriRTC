import mongoose from "mongoose";

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connecté"))
.catch(err => console.error("Erreur de connexion MongoDB", err));