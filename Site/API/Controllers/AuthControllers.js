import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
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

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      user: {
        id: user.id,
        mail: user.mail
      }
    });

    // const token = jwt.sign(
    //   { id: user.id, email: user.email },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1h" }
    // );

    // res.json({
    //   token,
    //   user: {
    //     id: user.id,
    //     name: user.name,
    //     email: user.email,
    //   },
    // });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
