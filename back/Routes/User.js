import express from "express";
import { createUser, getAllUser, getUser } from "../Controllers/UserController.js";

const router = express.Router();

/**
 * @swagger
 * /api/User:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Users fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       name:
 *                         type: string
 *                         example: Dupont
 *                       first_name:
 *                         type: string
 *                         example: Alice
 *                       phone_number:
 *                         type: string
 *                         example: "0612345678"
 *                       mail:
 *                         type: string
 *                         example: alice.dupont@mail.com
 *                       password:
 *                         type: string
 *                         example: passAlice
 */
router.get ("/User", getAllUser);

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
router.get ("/User/:id", getUser);

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
router.post("/User", createUser);

export default router ;