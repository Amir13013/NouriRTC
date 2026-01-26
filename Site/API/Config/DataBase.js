import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'devuser',
  password: 'devpass',
  database: 'devdb'
});

export default pool;
