import { DataTypes } from 'sequelize';
import sequelize from '../utils/db.js';
import User from './User.js';

const DailyWarning = sequelize.define('DailyWarning', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  warningDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'warning_date'
  },
  warningTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'warning_time'
  },
  warningMessage: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'warning_message'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  isSaved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_saved'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'daily_report_warnings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// İlişkiler index.js dosyasında tanımlanıyor

export default DailyWarning;
