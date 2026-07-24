'use strict';
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db/pool');

async function prepareRuntime() {
  if (process.env.MIGRATE_ON_START === 'true') {
    for (const filename of ['001_governed_trademark_matter.sql', '002_users.sql', '003_runtime_support.sql']) {
      await pool.query(fs.readFileSync(path.join(__dirname, 'migrations', filename), 'utf8'));
    }
  }
  const email = (process.env.PROVISION_ADMIN_EMAIL || 'runtime-admin@example.com').trim().toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.PROVISION_ADMIN_PASSWORD || 'RuntimeAcceptance123!', 12);
  await pool.query(
    `INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,'admin')
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role='admin'`,
    [email, passwordHash, process.env.PROVISION_ADMIN_NAME || 'RuntimeAdmin']
  );
}

module.exports = { prepareRuntime };
