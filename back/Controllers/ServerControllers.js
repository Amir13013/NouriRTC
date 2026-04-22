import {
  getAllServerService,
  getServerByIdService,
  createServerService,
  getServerByInviteCodeService,
  addUserToServerService,
  getAllMembersByServerService,
  deleteUserFromServerService,
  createChannelByServerIdService,
  deleteServerByIdService,
  getAllChannelByServerIdService,
  getAllUsersByServerService,
  updateMemberRoleService,
  updateServerService,
  getUserRoleInServerService,
  banUserFromServerService,
  isUserBannedFromServerService,
} from "../Models/ServerModel.js";
import { muteUserService, isUserMutedService, unmuteUserService } from "../Models/MuteModel.js";
import { randomBytes } from 'node:crypto';

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

// Déconnecte un utilisateur de tous les channels d'un serveur via Socket.IO
const disconnectUserFromServer = async (io, userId, serverId, eventName) => {
  const channels = await getAllChannelByServerIdService(serverId);
  const channelIds = channels.map(c => String(c.id));
  const sockets = await io.fetchSockets();

  for (const s of sockets) {
    if (String(s.data?.userId) === String(userId)) {
      for (const channelId of channelIds) {
        await s.leave(channelId);
      }
      // Notifie le client PUIS coupe la connexion socket immédiatement
      s.emit(eventName, { serverId, userId });
      s.disconnect(true);
    }
  }
};

// GET
export const getAllServer = async (_req, res, next) => {
  try {
    const allServers = await getAllServerService();
    handleResponse(res, 200, "Servers fetched successfully", allServers);
  } catch (error) {
    next(error);
  }
};

export const joinServerWithInviteCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user?.id;

    const server = await getServerByInviteCodeService(inviteCode);
    if (!server) return handleResponse(res, 404, "Server not found");

    const isBanned = await isUserBannedFromServerService(userId, server.id);
    if (isBanned) return handleResponse(res, 403, "You are banned from this server");

    const added = await addUserToServerService(userId, server.id);
    if (!added) return handleResponse(res, 409, "Already a member of this server", { serverId: server.id });
    handleResponse(res, 200, "User added to server successfully", { serverId: server.id });
  } catch (error) {
    next(error);
  }
};

export const getAllMembersByServer = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return handleResponse(res, 401, "Unauthorized");

    const servers = await getAllMembersByServerService(userId);
    handleResponse(res, 200, "Servers fetched successfully", servers);
  } catch (error) {
    next(error);
  }
};

export const getServerInviteCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await getServerByIdService(id);
    if (!server) return handleResponse(res, 404, "Server not found");

    handleResponse(res, 200, "Invite code fetched successfully", {
      inviteCode: server.invitecode
    });
  } catch (error) {
    next(error);
  }
};

export const getServer = async (req, res, next) => {
  try {
    const server = await getServerByIdService(req.params.id);
    if (!server) return handleResponse(res, 404, "Server not found");
    handleResponse(res, 200, "Server fetched successfully", server);
  } catch (error) {
    next(error);
  }
};

export const getAllUsersByServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const users = await getAllUsersByServerService(serverId);
    if (!users) return handleResponse(res, 404, "Cannot get users");
    handleResponse(res, 200, "Users fetched successfully", users);
  } catch (error) {
    next(error);
  }
};

export const getAllChannelByServerId = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const allChannels = await getAllChannelByServerIdService(serverId);
    handleResponse(res, 200, "Get all channels successfully", allChannels);
  } catch (error) {
    next(error);
  }
};

// DELETE
export const deleteUserFromServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;

    const deletedCount = await deleteUserFromServerService(userId, serverId);
    if (!deletedCount) return handleResponse(res, 404, "User not found in this server");

    handleResponse(res, 200, "User removed from server successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteServerById = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const deletedServer = await deleteServerByIdService(serverId);
    if (!deletedServer) return handleResponse(res, 404, "Cannot delete server");
    handleResponse(res, 200, "Server deleted successfully");
  } catch (error) {
    next(error);
  }
};

// CREATE
export const createServer = async (req, res, next) => {
  try {
    const { name } = req.body;
    const ownerId = req.user.id;

    const buf = randomBytes(6);
    const inviteCode = buf.toString('hex');

    const newServer = await createServerService(name, ownerId, inviteCode);
    handleResponse(res, 201, "Server created successfully", newServer);
  } catch (error) {
    next(error);
  }
};

export const createChannelByServerId = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { name } = req.body;

    const createdChannel = await createChannelByServerIdService(serverId, name);
    if (!createdChannel) return handleResponse(res, 404, "Cannot create a new channel");
    handleResponse(res, 200, "Channel created successfully", createdChannel);
  } catch (error) {
    next(error);
  }
};

// MUTE
export const muteUser = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;
    const { duration } = req.body; // duration in ms

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return handleResponse(res, 400, 'duration (ms) is required');
    }

    const expiresAt = await muteUserService(userId, serverId, duration);

    // Notify the muted user via socket so their UI updates immediately
    const io = req.app.get('io');
    if (io) {
      const sockets = await io.fetchSockets();
      for (const s of sockets) {
        if (String(s.data?.userId) === String(userId)) {
          s.emit('system:muted', { serverId, expiresAt });
        }
      }
    }

    handleResponse(res, 200, 'User muted', { expiresAt });
  } catch (error) {
    next(error);
  }
};

export const unmuteUser = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;
    await unmuteUserService(userId, serverId);
    handleResponse(res, 200, 'User unmuted');
  } catch (error) {
    next(error);
  }
};

export const getMuteStatus = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;
    const status = await isUserMutedService(userId, serverId);
    handleResponse(res, 200, 'Mute status', status);
  } catch (error) {
    next(error);
  }
};

// PUT
export const updateServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { name } = req.body;

    const updatedServer = await updateServerService(serverId, name);
    if (!updatedServer) return handleResponse(res, 404, "Cannot update server");
    handleResponse(res, 200, "Server updated successfully", updatedServer);
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;
    const { role } = req.body;

    if (!role) return handleResponse(res, 400, "Role is required");

    const updatedMember = await updateMemberRoleService(serverId, userId, role);
    if (!updatedMember) return handleResponse(res, 404, "Cannot update the member's role");
    handleResponse(res, 200, "Member's role updated successfully", updatedMember);
  } catch (error) {
    next(error);
  }
};

// KICK
export const kickUserFromServer = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;
    // 👉 le rôle de celui qui kick — mis dans la requête par le middleware checkRole
    const requesterRole = req.userRole;

    // 👉 je vérifie le rôle de la cible dans ce serveur
    const targetRole = await getUserRoleInServerService(serverId, userId);
    // 👉 la cible n'est même pas dans le serveur → 404
    if (!targetRole) return handleResponse(res, 404, "User not found in this server");

    // 👉 on peut jamais kick l'owner, même si on est admin
    if (targetRole.role === 'owner') {
      return handleResponse(res, 403, "Cannot kick the owner");
    }

    // 👉 un admin ne peut pas kicker un autre admin, seul l'owner peut
    if (targetRole.role === 'admin' && requesterRole !== 'owner') {
      return handleResponse(res, 403, "Only the owner can kick an admin");
    }

    // 👉 je supprime l'utilisateur de la table users_servers
    const deleted = await deleteUserFromServerService(userId, serverId);
    if (!deleted) return handleResponse(res, 404, "User not found in this server");

    // 👉 je récupère l'instance Socket.IO pour déconnecter l'user en temps réel
    const io = req.app.get('io');
    if (io) {
      // 👉 je lui envoie l'événement "member:kicked" et je coupe sa connexion socket direct
      await disconnectUserFromServer(io, userId, serverId, 'member:kicked');
    }

    handleResponse(res, 200, "User kicked from server");
  } catch (error) {
    next(error);
  }
};

// BAN
export const banUserFromServer = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;
    const { reason, expiresAt } = req.body;
    // 👉 le rôle de celui qui banne — mis dans la requête par checkRole
    const requesterRole = req.userRole;

    // 👉 je vérifie qu'il n'est pas déjà banni → évite les doublons
    const alreadyBanned = await isUserBannedFromServerService(userId, serverId);
    if (alreadyBanned) {
      return handleResponse(res, 400, "User is already banned from this server");
    }

    // 👉 je vérifie le rôle de la cible si elle est dans le serveur
    const targetRole = await getUserRoleInServerService(serverId, userId);
    if (targetRole) {
      // 👉 on peut jamais bannir l'owner
      if (targetRole.role === 'owner') {
        return handleResponse(res, 403, "Cannot ban the owner");
      }
      // 👉 un admin ne peut pas bannir un autre admin, seul l'owner peut
      if (targetRole.role === 'admin' && requesterRole !== 'owner') {
        return handleResponse(res, 403, "Only the owner can ban an admin");
      }
      // 👉 je le vire du serveur d'abord, puis j'enregistre le ban
      await deleteUserFromServerService(userId, serverId);
    }

    // 👉 j'enregistre le ban en base — permanent si pas de date, temporaire sinon
    const banned = await banUserFromServerService(userId, serverId, reason || null, expiresAt || null);
    if (!banned) return handleResponse(res, 500, "Failed to ban user");

    // 👉 s'il était connecté → je coupe sa connexion socket immédiatement
    if (targetRole) {
      const io = req.app.get('io');
      if (io) {
        await disconnectUserFromServer(io, userId, serverId, 'member:banned');
      }
    }

    handleResponse(res, 200, "User banned from server");
  } catch (error) {
    next(error);
  }
};
