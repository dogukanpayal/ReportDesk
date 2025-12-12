import { DataTypes } from 'sequelize';
import sequelize from '../utils/db.js';
import User from './User.js';

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_path',
  },
  originalFileName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'original_file_name',
  },
  notes: {
    type: DataTypes.STRING(255), // 255 karakter limiti
    allowNull: true,
    validate: {
      len: [0, 255] // 0-255 karakter arası
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Submitted',
  },
  aiSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_summary' // Veritabanındaki adı
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  uploader_first_name: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'uploader_first_name',
  },
  uploader_last_name: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'uploader_last_name',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updated_at',
    defaultValue: null, // Varsayılan olarak null
  },
}, {
  tableName: 'reports',
  timestamps: false, // Manuel timestamp yönetimi
  underscored: true, // snake_case column isimleri kullan
  hooks: {
    // Yeni rapor oluşturulduğunda sadece created_at'i set et
    beforeCreate: (report, options) => {
      const currentDate = new Date();
      report.createdAt = currentDate;
      report.updatedAt = null;
    },
    // Rapor güncellendiğinde updated_at'i güncelle (sadece gerçek düzenleme için)
    beforeUpdate: (report, options) => {
      // Sadece status değişikliği değilse updated_at'i güncelle
      if (options.fields && !options.fields.includes('status')) {
        const currentDate = new Date();
        report.updatedAt = currentDate;
      }
    }
  }
});

// Virtual field - 24 saat içinde düzenlenebilir mi?
Report.prototype.isEditable = function() {
  const hoursSinceCreation = (Date.now() - new Date(this.createdAt)) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24;
};

// Instance method - düzenleme süresi kaldı mı?
Report.prototype.getTimeRemaining = function() {
  const hoursSinceCreation = (Date.now() - new Date(this.createdAt)) / (1000 * 60 * 60);
  const remainingHours = Math.max(0, 24 - hoursSinceCreation);
  return {
    canEdit: remainingHours > 0,
    remainingHours: Math.floor(remainingHours),
    remainingMinutes: Math.floor((remainingHours % 1) * 60)
  };
};

Report.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Report, { foreignKey: 'userId' });

export default Report; 