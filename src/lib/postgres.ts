
import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  console.error(
    "[postgres.ts] CRITICAL ERROR: PostgreSQL connection URL (POSTGRES_URL) is NOT SET in environment variables. " +
    "Please set this variable in your .env file. " +
    "You MUST restart your Next.js development server after modifying the .env file."
  );
} else {
  console.log("[postgres.ts] PostgreSQL connection URL found in environment variables.");
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // You might need to configure SSL in production depending on your PostgreSQL provider
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('[postgres.ts] Connected to PostgreSQL database via pool.');
});

pool.on('error', (err) => {
  console.error('[postgres.ts] Unexpected error on idle client in pool', err);
  // process.exit(-1); // Consider if this is appropriate for your app's lifecycle
});

export const query = async (text: string, params?: any[]) => {
  if (!process.env.POSTGRES_URL) {
     throw new Error("[postgres.ts] query: POSTGRES_URL is not configured. Cannot execute query.");
  }
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[postgres.ts] executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[postgres.ts] Error executing query:', { text, params }, error);
    throw error;
  }
};

// Optional: A function to test the connection
export const testConnection = async () => {
  if (!process.env.POSTGRES_URL) {
    console.warn("[postgres.ts] testConnection: POSTGRES_URL is not configured. Skipping connection test.");
    return false;
  }
  try {
    const client = await pool.connect();
    console.log("[postgres.ts] Successfully connected to PostgreSQL for test.");
    await client.query('SELECT NOW()'); // Example query
    client.release();
    return true;
  } catch (error) {
    console.error("[postgres.ts] Failed to connect to PostgreSQL for test:", error);
    return false;
  }
};

// Call testConnection when the module loads if you want an immediate check (optional)
// testConnection();
