import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserByMailService, getUserByIdService, createUserService } from "../Models/AuthModel.js";

const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({
        status, message, data
    });
};

export const createUser = async (req, res, next) => {
  try {
    // je récupère ce que l'utilisateur a rempli dans le formulaire
    const {name, first_name, phone_number, mail, password} = req.body;
    const saltRounds = 12;
    // je hash le mot de passe avec bcrypt — jamais stocké en clair dans la BDD
    // 12 rounds = niveau de sécurité, plus c'est haut plus c'est lent à craquer
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // j'insère le nouvel utilisateur en base PostgreSQL avec le mot de passe hashé
    const newUser = await createUserService(
      name,
      first_name,
      phone_number,
      mail,
      hashedPassword,
    );

    // tout s'est bien passé → je renvoie 201 (créé) avec les données du nouvel user
    handleResponse(res, 201, "User created successfully", newUser);

  } catch (error) {
    next(error);
  }
};

export const login = async (req, res) => {
  try {
    const { mail, password } = req.body;

    // si l'un des deux champs est absent → pas la peine de chercher en base
    if (!mail || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    // je cherche l'utilisateur par son email dans PostgreSQL
    const user = await getUserByMailService(mail);

    // aucun user trouvé avec cet email → on refuse
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    // je compare le mot de passe tapé avec le hash stocké en base
    // bcrypt.compare fait ça de façon sécurisée, impossible de tricher
    const isValid = await bcrypt.compare(password, user.password);

    // mot de passe incorrect → on refuse
    if (!isValid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // je prépare les infos à mettre dans le token (pas le mot de passe !)
    const payload = { id: user.id, mail: user.mail, name: user.name, first_name: user.first_name };
    // je génère le token JWT signé avec ma clé secrète, valable 6h
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "6h" }
    );

    // tout est bon → je renvoie le token + les infos de l'utilisateur au frontend
    return res.status(200).json({
      success: true,
      accessToken,
      message: "Connexion réussie",
      user: {
        id: user.id,
        mail: user.mail,
        name: user.name,
        first_name: user.first_name,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUser = async (req, res, next) => {
  try {
    const User = await getUserByIdService(req.user.id);
    if(!User) return handleResponse(res, 404, "User not found")
      handleResponse(res, 200, "User fetched successfully", User)
  } catch (error) {
    next(error);
  }
};