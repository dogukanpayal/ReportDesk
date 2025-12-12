import User from './User.js';
import Report from './Report.js';
import DailyWarning from './DailyWarning.js';

// Model associations
User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(DailyWarning, { foreignKey: 'employeeId', as: 'dailyWarnings' });
DailyWarning.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

export { User, Report, DailyWarning };


