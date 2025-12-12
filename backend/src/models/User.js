import { DataTypes } from 'sequelize';
import sequelize from '../utils/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID, // UUID tipi kullan
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name', // Veritabanı column adı
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name', // Veritabanı column adı
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash', // Veritabanı column adı
  },
  role: {
    type: DataTypes.STRING, // ENUM yerine STRING kullan
    allowNull: false,
    defaultValue: 'Calisan',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
  // updatedAt alanını açıkça null olarak tanımlıyoruz
  updatedAt: {
    type: DataTypes.VIRTUAL, // Sanal alan - veritabanında karşılığı yok
  },
}, {
  tableName: 'users', // Küçük harfle users tablosunu kullan
  timestamps: false, // Timestamps'ı kapatıyoruz
  underscored: true, // snake_case column isimleri kullan
});

// Debug: Tablo adını log'la
console.log('=== User Model Debug ===');
console.log('Table name:', User.tableName);
console.log('Model name:', User.name);
console.log('Model fields:', Object.keys(User.rawAttributes));
console.log('=== End User Model Debug ===');

export default User; 