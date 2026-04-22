import express from "express";
import { login } from "../Controllers/AuthControllers.js";
import { createUser, getUser } from "../Controllers/AuthControllers.js";
import { authenticate } from "../middleware/authentificationJwt.js";

const router = express.Router();

/**
 * @swagger
 * /api/User:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - first_name
 *               - phone_number
 *               - mail
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Augustin
 *               first_name:
 *                 type: string
 *                 example: Augustin
 *               phone_number:
 *                 type: string
 *                 example: "0612345678"
 *               mail:
 *                 type: string
 *                 example: augustin@mail.com
 *               password:
 *                 type: string
 *                 example: myPassword123
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "4"
 *                     name:
 *                       type: string
 *                       example: Augustin
 *                     first_name:
 *                       type: string
 *                       example: Augustin
 *                     phone_number:
 *                       type: string
 *                       example: "0612345678"
 *                     mail:
 *                       type: string
 *                       example: augustin@mail.com
 *                     password:
 *                       type: string
 *                       example: $2b$12$hashedPassword
 */
router.post("/signup", createUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mail
 *               - password
 *             properties:
 *               mail:
 *                 type: string
 *                 example: augustin@mail.com
 *               password:
 *                 type: string
 *                 example: myPassword123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 message:
 *                   type: string
 *                   example: Connexion réussie
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "3"
 *                     mail:
 *                       type: string
 *                       example: augustin@mail.com
 *       401:
 *         description: Identifiants invalides
 */
router.post("/login", login);

/**
 * @swagger
 * /api/User/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/me", authenticate, getUser);

// /**
//  * @swagger
//  * /api/User:
//  *   get:
//  *     summary: Récupérer tous les utilisateurs
//  *     tags: [Users]
//  *     responses:
//  *       200:
//  *         description: Liste des utilisateurs récupérée avec succès
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 status:
//  *                   type: integer
//  *                   example: 200
//  *                 message:
//  *                   type: string
//  *                   example: Users fetched successfully
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       id:
//  *                         type: string
//  *                         example: "1"
//  *                       name:
//  *                         type: string
//  *                         example: Dupont
//  *                       first_name:
//  *                         type: string
//  *                         example: Alice
//  *                       phone_number:
//  *                         type: string
//  *                         example: "0612345678"
//  *                       mail:
//  *                         type: string
//  *                         example: alice.dupont@mail.com
//  *                       password:
//  *                         type: string
//  *                         example: passAlice
//  */
// router.get ("/User", getAllUser);

export default router;
