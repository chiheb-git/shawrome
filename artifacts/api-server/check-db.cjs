const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    const tableCheck = await pool.query("SELECT to_regclass('public.users') AS exists");
    console.log("Table users existe :", tableCheck.rows[0].exists !== null);

    if (tableCheck.rows[0].exists !== null) {
      const countResult = await pool.query("SELECT count(*) FROM users");
      console.log("Nombre d'utilisateurs :", countResult.rows[0].count);

      const adminResult = await pool.query("SELECT email, role, active FROM users WHERE email = $1", ["admin@shewrome.dz"]);
      console.log("Compte admin trouve :", adminResult.rows.length > 0 ? JSON.stringify(adminResult.rows[0]) : "AUCUN");
    }
  } catch (err) {
    console.error("ERREUR DB :", err.message);
  } finally {
    await pool.end();
  }
}

main();
