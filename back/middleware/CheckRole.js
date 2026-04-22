import pool from '../Config/DataBase.js';
import { getUserRoleInServerService } from '../Models/ServerModel.js';

export const checkRole = (rolesAutorises = []) => {
  return async (req, res, next) => {
    try {
      const serverId = req.params.serverId;
      const userId   = req.user.id;

      if (!serverId) return res.status(400).json({ message: 'Server ID missing' });

      let roleData = await getUserRoleInServerService(serverId, userId);

      // Safety net: if the user has no role or a wrong role in users_servers,
      // but IS the declared owner in the servers table, auto-repair the row.
      // This fixes edge cases where the users_servers INSERT failed at creation time.
      if (!roleData || !['owner', 'admin', 'member'].includes(roleData.role)) {
        const srvRes = await pool.query(
          `SELECT owner FROM servers WHERE id = $1`, [serverId]
        );
        if (srvRes.rows.length > 0 && String(srvRes.rows[0].owner) === String(userId)) {
          await pool.query(
            `INSERT INTO users_servers (user_id, server_id, role)
             VALUES ($1, $2, 'owner')
             ON CONFLICT (user_id, server_id) DO UPDATE SET role = 'owner'`,
            [userId, serverId]
          );
          roleData = { role: 'owner' };
        }
      } else if (roleData.role !== 'owner') {
        // Also fix the case where the declared owner is stored as 'member'
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

      if (!roleData) {
        return res.status(403).json({ message: 'You are not a member of this server' });
      }

      const userRole = roleData.role;

      if (!rolesAutorises.includes(userRole)) {
        return res.status(403).json({ message: `Required role: ${rolesAutorises.join(', ')}` });
      }

      req.userRole = userRole;
      next();
    } catch (err) {
      next(err);
    }
  };
};
