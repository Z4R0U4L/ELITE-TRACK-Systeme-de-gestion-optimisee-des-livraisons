const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('merchant', 'driver', 'client')),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(20) UNIQUE NOT NULL,
        merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
        driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
        client_name VARCHAR(100) NOT NULL,
        client_phone VARCHAR(20),
        client_email VARCHAR(150),
        delivery_address TEXT NOT NULL,
        delivery_lat DECIMAL(10, 8),
        delivery_lng DECIMAL(11, 8),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'delivered', 'cancelled')),
        notes TEXT,
        tracking_token UUID DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS driver_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        is_sharing BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(30) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    console.log('Migrations completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

migrate();
