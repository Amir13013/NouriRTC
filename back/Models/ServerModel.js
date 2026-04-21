import pool from "../Config/DataBase.js";

// GET
export const getAllServerService = async () => {
  const result = await pool.query("SELECT * FROM Servers");
  return result.rows;
};

export const getServerByIdService = async (id) => {
  const result = await pool.query(
    "SELECT * FROM Servers WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const getServerByInviteCodeService = async (inviteCode) => {
  const result = await pool.query(
    "SELECT * FROM Servers WHERE inviteCode = $1",
    [inviteCode]
  );
  return result.rows[0];
};

export const getAllMembersByServerService = async (userId) => {
  const result = await pool.query(
    `SELECT s.*
     FROM servers s
     JOIN users_servers us ON us.server_id = s.id
     WHERE us.user_id = $1`,
    [userId]
  );
  return result.rows;
};

export const getAllUsersByServerService = async (serverId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.first_name, us.role
     FROM users u
     JOIN users_servers us ON u.id = us.user_id
     WHERE us.server_id = $1`,
    [serverId]
  );
  return result.rows;
};

export const getAllChannelByServerIdService = async (serverId) => {
  const result = await pool.query(
    `SELECT * FROM channels WHERE server_id = $1`,
    [serverId]
  );
  return result.rows;
};

export const getUserRoleInServerService = async (serverId, userId) => {
  const result = await pool.query(
    `SELECT role FROM users_servers WHERE server_id = $1 AND user_id = $2`,
    [serverId, userId]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// DELETE
export const deleteUserFromServerService = async (userID, serverID) => {
  const result = await pool.query(
    `DELETE FROM users_servers WHERE user_id = $1 AND server_id = $2`,
    [userID, serverID]
  );
  return result.rowCount;
};

export const deleteServerByIdService = async (serverID) => {
  const result = await pool.query(
    `DELETE FROM Servers WHERE id = $1`,
    [serverID]
  );
  return result.rowCount;
};

// CREATE
export const createServerService = async (name, ownerId, inviteCode) => {
  const result = await pool.query(
    `INSERT INTO Servers (name, owner, inviteCode)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, ownerId, inviteCode]
  );
  const newServer = result.rows[0];
  await pool.query(
    `INSERT INTO users_servers (user_id, server_id, role) VALUES ($1, $2, 'owner')`,
    [ownerId, newServer.id]
  );
  return newServer;
};

export const createChannelByServerIdService = async (serverId, name) => {
  const result = await pool.query(
    `INSERT INTO channels (name, server_id) VALUES ($1, $2) RETURNING *`,
    [name, serverId]
  );
  return result.rows[0];
};

export const addUserToServerService = async (userId, serverId) => {
  const existing = await pool.query(
    `SELECT 1 FROM users_servers WHERE user_id = $1 AND server_id = $2`,
    [userId, serverId]
  );
  if (existing.rows.length > 0) return null;
  const result = await pool.query(
    `INSERT INTO users_servers (user_id, server_id) VALUES ($1, $2) RETURNING *`,
    [userId, serverId]
  );
  return result.rows[0];
};

// PUT
export const updateMemberRoleService = async (serverId, userId, role) => {
  const result = await pool.query(
    `UPDATE users_servers SET role = $1 WHERE server_id = $2 AND user_id = $3 RETURNING *`,
    [role, serverId, userId]
  );
  return result.rows[0];
};

export const updateServerService = async (serverId, name) => {
  const result = await pool.query(
    `UPDATE servers SET name = $1 WHERE id = $2 RETURNING *`,
    [name, serverId]
  );
  return result.rows[0];
};

// BAN
export const banUserFromServerService = async (userId, serverId, reason = null, expiresAt = null) => {
  const result = await pool.query(
    `INSERT INTO banned_users (user_id, server_id, reason, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, server_id) DO NOTHING`,
    [userId, serverId, reason, expiresAt]
  );
  return result.rowCount;
};

export const isUserBannedFromServerService = async (userId, serverId) => {
  const result = await pool.query(
    `SELECT 1 FROM banned_users
     WHERE user_id = $1 AND server_id = $2
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId, serverId]
  );
  return result.rows.length > 0;
};
