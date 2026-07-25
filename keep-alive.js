const { Client } = require('./lib/db/node_modules/pg');

async function ping() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    console.log(new Date().toLocaleTimeString('fr-FR'), '- Base reveillee (ping OK)');
  } catch (err) {
    console.log(new Date().toLocaleTimeString('fr-FR'), '- Ping echoue:', err.message);
  }
}

console.log('Keep-alive demarre - ping toutes les 4 minutes. Ctrl+C pour arreter.');
ping();
setInterval(ping, 4 * 60 * 1000);
