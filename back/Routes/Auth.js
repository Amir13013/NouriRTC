import express from "express";
import { login } from "../Controllers/AuthControllers.js";

const router = express.Router();

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

export default router;
