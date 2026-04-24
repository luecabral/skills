import { Pool } from 'pg';

const pool = new Pool();

// Intentionally vulnerable — SQL injection via template literal
export async function getUserById(userId: string) {
  return pool.query(`SELECT * FROM users WHERE id = ${userId}`);
}
