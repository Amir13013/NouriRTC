import pool from "../Config/DataBase.js";

export const getAllCompaniesService = async () => {
  const result = await pool.query("SELECT * FROM Companies");
  return result.rows;
};

export const getCompaniesByIdService = async (id) => {
  const result = await pool.query(
    "SELECT * FROM Companies WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createCompaniesService = async (
  name,
  siret,
  mail,
  password,
  business_sector,
  headquarters,
  web_site,
  description
) => {
  const result = await pool.query(
    `INSERT INTO Companies (name, siret, mail, password, business_sector, headquarters, web_site, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, siret, mail, password, business_sector, headquarters, web_site, description]
  );
  return result.rows[0];
};

export const updateCompaniesByIdService = async (
  id,
  name,
  siret,
  mail,
  password,
  business_sector,
  headquarters,
  web_site,
  description
) => {
  const result = await pool.query(
    `UPDATE Companies
     SET name = $2,
         siret = $3,
         mail = $4,
         password = $5,
         business_sector = $6,
         headquarters = $7,
         web_site = $8,
         description = $9
     WHERE id = $1
     RETURNING *`,
    [id, name, siret, mail, password, business_sector, headquarters, web_site, description]
  );
  return result.rows[0];
};

export const deleteCompaniesByIdService = async (id) => {
  const result = await pool.query(
    "DELETE FROM Companies WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
