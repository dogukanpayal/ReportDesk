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
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
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
    field: 'ai_summary' 
  },
  // --- YENİ EKLENEN ALAN ---
  aiSummaryShort: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_summary_short'
  },
  aiKeywords: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: [],
    field: 'ai_keywords'
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
    defaultValue: null,
  },
}, {
  tableName: 'reports',
  timestamps: false,
  underscored: true,
  hooks: {
    beforeCreate: (report, options) => {
      const currentDate = new Date();
      report.createdAt = currentDate;
      report.updatedAt = null;
    },
    beforeUpdate: (report, options) => {
      // If update is triggered only for AI-generated fields, do not mark as edited.
      // Determine which fields are being saved in this update.
      const fields = Array.isArray(options && options.fields) ? options.fields : [];

      // Remove AI-only fields from consideration
      const nonAIFocused = fields.filter(f => !['aiSummary', 'aiSummaryShort', 'ai_summary', 'ai_summary_short'].includes(f));

      // If there are any non-AI fields being updated and status is not the only excluded field,
      // then update the updatedAt timestamp. This keeps AI-only updates from marking the report as edited.
      if (nonAIFocused.length > 0 && !nonAIFocused.includes('status')) {
        const currentDate = new Date();
        report.updatedAt = currentDate;
      }
    }
  }
});

Report.prototype.isEditable = function() {
  const hoursSinceCreation = (Date.now() - new Date(this.createdAt)) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24;
};

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