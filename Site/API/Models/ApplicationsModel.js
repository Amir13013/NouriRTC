import pool from "../Config/DataBase.js";

export const getAllApplicationsService = async () => {
  const result = await pool.query("SELECT * FROM Applications");
  return result.rows;
};

export const getApplicationsByIdService = async (id) => {
  const result = await pool.query(
    "SELECT * FROM Applications WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createApplicationsService = async (
  name,
  mail,
  cover_letter,
  application_status
) => {
  const result = await pool.query(
    `INSERT INTO Applications (name, mail, cover_letter, application_status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, mail, cover_letter, application_status]
  );
  return result.rows[0];
};

export const updateApplicationsByIdService = async (
  id,
  name,
  mail,
  cover_letter,
  application_status
) => {
  const result = await pool.query(
    `UPDATE Applications
     SET name = $2,
         mail = $3,
         cover_letter = $4,
         application_status = $5
     WHERE id = $1
     RETURNING *`,
    [id, name, mail, cover_letter, application_status]
  );
  return result.rows[0];
};

export const deleteApplicationsByIdService = async (id) => {
  const result = await pool.query(
    "DELETE FROM Applications WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

