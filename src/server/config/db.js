import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'whizmo_seller';

// Create database if it doesn't exist
export const createDatabase = async () => {
  try {
    // Create a connection without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    
    console.log('Checking if database exists...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    console.log(`Database ${DB_NAME} created or already exists`);
    
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
  }
};

// Create connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database with tables
export const initDb = async () => {
  try {
    await createDatabase();
    
    const connection = await pool.getConnection();
    
    // Create users table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255),
        reset_token_expiry DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Check if role column exists, add it if it doesn't
    try {
      // Try to select using role column to test if it exists
      await connection.execute('SELECT role FROM users LIMIT 1');
      console.log('Role column already exists in users table');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        // Role column doesn't exist, add it
        console.log('Adding role column to users table...');
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
        `);
        console.log('Role column added successfully');
      } else {
        // Some other error occurred
        throw error;
      }
    }
    
    // Create services table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        long_description TEXT,
        image_path VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create documents table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'other',
        document_path VARCHAR(255) NOT NULL,
        thumbnail_path VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Check if preview_text column exists in documents table, add it if it doesn't
    try {
      // Try to select using preview_text column to test if it exists
      await connection.execute('SELECT preview_text FROM documents LIMIT 1');
      console.log('preview_text column already exists in documents table');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        // preview_text column doesn't exist, add it
        console.log('Adding preview_text column to documents table...');
        await connection.execute(`
          ALTER TABLE documents 
          ADD COLUMN preview_text TEXT AFTER description
        `);
        console.log('preview_text column added successfully');
      } else {
        // Some other error occurred
        console.error('Error checking for preview_text column:', error);
      }
    }
    
    // Check for existing admin user
    try {
      const [adminRows] = await connection.execute(
        'SELECT * FROM users WHERE role = "admin" LIMIT 1'
      );
      
      // Create default admin user if none exists
      if (adminRows.length === 0) {
        // Use default admin credentials if not in .env
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@whizmo.com';
        const adminPassword = process.env.ADMIN_PASSWORD || '$2a$10$QrRzR2ZbKZJ4.A5OdMoHe.eN1UJ3L7n4NpB.oMTa.NdDIqYzUj2im'; // hashed 'admin123'
        
        await connection.execute(
          'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
          [adminEmail, adminPassword, 'admin']
        );
        
        console.log(`Default admin user created: ${adminEmail}`);
      }
    } catch (error) {
      console.error('Error checking for admin user:', error);
    }
    
    connection.release();
    console.log('Database and tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};
