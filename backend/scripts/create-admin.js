'use strict';
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') throw new Error('Explicit bootstrap acknowledgement is required');
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = (process.env.PROVISION_ADMIN_NAME || '').trim();
  if (!email || !name || password.length < 12) throw new Error('Admin email, name, and a 12+ character password are required');
  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [email]);
  if (existing.rows.length) return console.log('Initial admin already exists; credentials were not changed.');
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)', [email, passwordHash, name, 'admin']);
  console.log('Initial admin created.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
