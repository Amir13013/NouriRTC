import pool from "../Config/DataBase.js";

export const getAllAdvertisementsService = async () => {
  const result = await pool.query("SELECT * FROM Advertisements");
  return result.rows;
};

export const getAdvertisementsByBusinessSectorService = async (business_sector) => {
  const result = await pool.query(
    "SELECT * FROM Advertisements WHERE business_sector = $1",
    [business_sector]
  );
  return result.rows;
};

export const getAdvertisementsByCityService = async (city) => {
  const result = await pool.query(
    "SELECT * FROM Advertisements WHERE city = $1",
    [city]
  );
  return result.rows;
};

export const createAdvertisementsService = async (
  company_name,
  job_name,
  contract_type,
  business_sector,
  salary,
  city,
  adress,
  description
) => {
  const result = await pool.query(
    `INSERT INTO Advertisements (company_name, job_name, contract_type, business_sector, salary, city, adress, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [company_name, job_name, contract_type, business_sector, salary, city, adress, description]
  );
  return result.rows[0];
};

export const updateAdvertisementsByIdService = async (
  id,
  company_name,
  job_name,
  contract_type,
  business_sector,
  salary,
  city,
  adress,
  description
) => {
  const result = await pool.query(
    `UPDATE Advertisements
     SET company_name = $2, job_name = $3, contract_type = $4, business_sector = $5, salary = $6,
         city = $7, adress = $8, description = $9
     WHERE id = $1
     RETURNING *`,
    [id, company_name, job_name, contract_type, business_sector, salary, city, adress, description]
  );
  return result.rows[0];
};

export const deleteAdvertisementsByIdService = async (id) => {
  const result = await pool.query(
    "DELETE FROM Advertisements WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
