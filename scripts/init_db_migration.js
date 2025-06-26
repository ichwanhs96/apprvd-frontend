const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Read and execute the schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Schema file read successfully');
    
    // Execute the entire schema as one statement
    console.log('Executing schema...');
    await client.query(schema);
    
    // Verify tables were created
    console.log('Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('folder', 'user', 'document', 'document_ownership', 'comment', 'notification')
      ORDER BY table_name
    `);
    
    console.log('Created tables:', tablesResult.rows.map(row => row.table_name));
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error); 