import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserByMailService } from "../Models/UserModel.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const user = await getUserByMailService(email);

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const payload = { id: user.id, mail: user.mail, name : user.name, };
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "6h" }
    );

    return res.status(200).json({
      success: true,
      accessToken,
      message: "Connexion réussie",
      user: {
        id: user.id,
        mail: user.mail
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

