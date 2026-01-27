import pool from "../Config/DataBase.js";

export const getAllPeopleService = async () => {
  const result = await pool.query("SELECT * FROM People");
  return result.rows;
};

export const getPeopleByIdService = async (id) => {
  const result = await pool.query(
    "SELECT * FROM People WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createPeopleService = async (
  name,
  first_name,
  phone_number,
  mail,
  password,
) => {
  const result = await pool.query(
    `INSERT INTO People (name, first_name, phone_number, mail, password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, first_name, phone_number, mail, password]
  );
  return result.rows[0];
};

export const updatePeopleByIdService = async (
  id,
  name,
  first_name,
  phone_number,
  mail,
  password,
) => {
  const result = await pool.query(
    `UPDATE People
     SET name = $2,
         first_name = $3,
         phone_number = $4,
         mail = $5,
         password = $6,
     WHERE id = $1
     RETURNING *`,
    [id, name, first_name, phone_number, mail, password]
  );
  return result.rows[0];
};

export const deletePeopleByIdService = async (id) => {
  const result = await pool.query(
    "DELETE FROM People WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};