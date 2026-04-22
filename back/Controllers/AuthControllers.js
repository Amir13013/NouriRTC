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
    
    const {name, first_name, phone_number, mail, password} = req.body;
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    const newUser = await createUserService(
      name,
      first_name,
      phone_number,
      mail,
      hashedPassword,
    );
    
    handleResponse(res, 201, "User created successfully", newUser);
    
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res) => {
  try {
    const { mail, password } = req.body;

    if (!mail || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const user = await getUserByMailService(mail);

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const payload = { id: user.id, mail: user.mail, name: user.name, first_name: user.first_name };
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