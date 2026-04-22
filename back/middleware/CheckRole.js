import pool from '../Config/DataBase.js';
import { getUserRoleInServerService } from '../Models/ServerModel.js';

// ce middleware prend en paramètre la liste des rôles autorisés pour une route
// exemple : checkRole(["owner"]) → seul l'owner passe
// exemple : checkRole(["owner", "admin"]) → owner et admin passent
export const checkRole = (rolesAutorises = []) => {
  return async (req, res, next) => {
    try {
      const serverId = req.params.serverId;
      // je récupère l'ID de l'utilisateur connecté depuis le token (mis par authenticate)
      const userId   = req.user.id;

      // si y'a pas de serverId dans l'URL → quelque chose cloche
      if (!serverId) return res.status(400).json({ message: 'Server ID missing' });

      // je cherche le rôle de cet utilisateur dans ce serveur en base PostgreSQL
      let roleData = await getUserRoleInServerService(serverId, userId);

      // cas limite : l'user n'a pas de rôle dans users_servers (ou un rôle invalide)
      // mais si c'est lui l'owner déclaré dans la table servers → je répare la ligne automatiquement
      // ça couvre le bug rare où le INSERT dans users_servers a foiré à la création du serveur
      if (!roleData || !['owner', 'admin', 'member'].includes(roleData.role)) {
        const srvRes = await pool.query(
          `SELECT owner FROM servers WHERE id = $1`, [serverId]
        );
        if (srvRes.rows.length > 0 && String(srvRes.rows[0].owner) === String(userId)) {
          // ON CONFLICT = si la ligne existe déjà (peu importe le rôle), je la remplace par 'owner'
          await pool.query(
            `INSERT INTO users_servers (user_id, server_id, role)
             VALUES ($1, $2, 'owner')
             ON CONFLICT (user_id, server_id) DO UPDATE SET role = 'owner'`,
            [userId, serverId]
          );
          roleData = { role: 'owner' };
        }
      } else if (roleData.role !== 'owner') {
        // deuxième cas : l'user est en base avec le rôle 'member' mais c'est en fait l'owner
        // je corrige juste le rôle sans toucher au reste
        const srvRes = await pool.query(
          `SELECT owner FROM servers WHERE id = $1`, [serverId]
        );
        if (srvRes.rows.length > 0 && String(srvRes.rows[0].owner) === String(userId)) {
          await pool.query(
            `UPDATE users_servers SET role = 'owner'
             WHERE user_id = $1 AND server_id = $2`,
            [userId, serverId]
          );
          roleData = { role: 'owner' };
        }
      }

      // l'utilisateur n'est pas membre du serveur → accès refusé
      if (!roleData) {
        return res.status(403).json({ message: 'You are not a member of this server' });
      }

      const userRole = roleData.role;

      // son rôle n'est pas dans la liste autorisée → 403
      // par exemple si c'est un "member" et que la route demande "owner" → bloqué
      if (!rolesAutorises.includes(userRole)) {
        return res.status(403).json({ message: `Required role: ${rolesAutorises.join(', ')}` });
      }

      // je colle le rôle dans la requête pour que le controller sache qui fait l'action
      // utile pour kick/ban : le controller sait si c'est l'owner ou un admin qui agit
      req.userRole = userRole;
      // tout est ok → on passe au controller
      next();
    } catch (err) {
      next(err);
    }
  };
};
