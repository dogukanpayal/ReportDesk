import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import config from '../../config/database.cjs';

dotenv.config();

// Environment'ı belirle
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Sequelize instance oluştur
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Bağlantı testi
sequelize.authenticate()
  .then(() => {
    console.log(`✅ Database connection established successfully (${env})`);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

export default sequelize; 