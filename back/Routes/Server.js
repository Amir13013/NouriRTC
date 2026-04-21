import express from "express";
import {
  deleteServerById,
  createChannelByServerId,
  deleteUserFromServer,
  createServer,
  getAllServer,
  getServer,
  getServerInviteCode,
  joinServerWithInviteCode,
  getAllMembersByServer,
  getAllChannelByServerId,
  getAllUsersByServer,
  updateServer,
  updateMemberRole,
  kickUserFromServer,
  banUserFromServer,
  muteUser,
  unmuteUser,
  getMuteStatus,
} from "../Controllers/ServerControllers.js";
import { authenticate } from "../middleware/authentificationJwt.js";
import { checkRole } from "../middleware/CheckRole.js";

const router = express.Router();

// GET
/**
 * @swagger
 * /api/:
 *   get:
 *     summary: Récupérer tous les serveurs
 *     tags: [Servers]
 *     responses:
 *       200:
 *         description: Liste des serveurs
 */
router.get("/", authenticate, getAllServer);

/**
 * @swagger
 * /api/members:
 *   get:
 *     summary: Récupérer tous les serveurs de l'utilisateur connecté
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des serveurs du membre
 */
router.get("/members", authenticate, getAllMembersByServer);

/**
 * @swagger
 * /api/{id}:
 *   get:
 *     summary: Récupérer un serveur par son ID
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du serveur
 */
router.get("/:id", authenticate, getServer);

router.get("/:serverId/users", authenticate, getAllUsersByServer);

router.get("/:serverId/channels", authenticate, getAllChannelByServerId);

/**
 * @swagger
 * /api/{id}/inviteCode:
 *   get:
 *     summary: Récupérer le code d'invitation d'un serveur
 *     tags: [Servers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Code d'invitation
 */
router.get("/:id/inviteCode", authenticate, getServerInviteCode);


// DELETE
router.delete("/:serverId", authenticate, checkRole(["owner"]), deleteServerById);

router.delete("/:serverId/leave", authenticate, checkRole(["owner", "admin", "member"]), deleteUserFromServer);


// POST
/**
 * @swagger
 * /api/:
 *   post:
 *     summary: Créer un nouveau serveur
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Serveur créé avec succès
 */
router.post("/", authenticate, createServer);

/**
 * @swagger
 * /api/join:
 *   post:
 *     summary: Rejoindre un serveur avec un code d'invitation
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Serveur rejoint avec succès
 *       403:
 *         description: Utilisateur banni de ce serveur
 */
router.post("/join", authenticate, joinServerWithInviteCode);

router.post("/:serverId/channels", authenticate, checkRole(["owner"]), createChannelByServerId);

/**
 * @swagger
 * /api/{serverId}/kick/{userId}:
 *   post:
 *     summary: Expulser un membre du serveur
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Membre expulsé
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Membre introuvable
 */
router.post("/:serverId/kick/:userId", authenticate, checkRole(["owner", "admin"]), kickUserFromServer);

/**
 * @swagger
 * /api/{serverId}/ban/{userId}:
 *   post:
 *     summary: Bannir un membre du serveur
 *     tags: [Servers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison du ban (optionnel)
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'expiration du ban (null = permanent)
 *     responses:
 *       200:
 *         description: Membre banni
 *       400:
 *         description: Déjà banni
 *       403:
 *         description: Permissions insuffisantes
 */
router.post("/:serverId/ban/:userId", authenticate, checkRole(["owner", "admin"]), banUserFromServer);

router.post("/:serverId/mute/:userId", authenticate, checkRole(["owner", "admin"]), muteUser);

router.delete("/:serverId/mute/:userId", authenticate, checkRole(["owner", "admin"]), unmuteUser);

router.get("/:serverId/mute/me", authenticate, getMuteStatus);


// PUT
router.put("/:serverId", authenticate, checkRole(["owner"]), updateServer);

router.put("/:serverId/members/:userId", authenticate, checkRole(["owner"]), updateMemberRole);

export default router;
