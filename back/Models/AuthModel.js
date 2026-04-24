import pool from "../Config/DataBase.js";

export const getUserByIdService = async (id) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const getUserByMailService = async (mail) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE mail = $1",
    [mail]
  );
  return result.rows[0];
};

export const createUserService = async (
  name,
  first_name,
  phone_number,
  mail,
  hashedPassword,
) => {
  const result = await pool.query(
    `INSERT INTO users (name, first_name, phone_number, mail, password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, first_name, phone_number, mail, hashedPassword]
  );
  return result.rows[0];
};
