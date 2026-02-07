import pool from "../Config/DataBase.js";

export const getAllUserService = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};

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

// export const updateUserByIdService = async (
//   id,
//   name,
//   first_name,
//   phone_number,
//   mail,
//   hashedPassword,
// ) => {
//   const result = await pool.query(
//     `UPDATE users
//      SET name = $2,
//          first_name = $3,
//          phone_number = $4,
//          mail = $5,
//          password = $6,
//      WHERE id = $1
//      RETURNING *`,
//     [id, name, first_name, phone_number, mail, hashedPassword]
//   );
//   return result.rows[0];
// };

// export const deleteUserByIdService = async (id) => {
//   const result = await pool.query(
//     "DELETE FROM users WHERE id = $1 RETURNING *",
//     [id]
//   );
//   return result.rows[0];
// };