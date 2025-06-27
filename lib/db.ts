import { Pool } from 'pg';

// TODO: when migrated from Vercel we need to enable SSL using the proper CA certificate for auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
}

export default pool; 