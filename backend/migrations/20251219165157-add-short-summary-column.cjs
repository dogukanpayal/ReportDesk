'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Reports tablosuna 'ai_summary_short' sütununu ekliyoruz
    await queryInterface.addColumn('reports', 'ai_summary_short', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    // Geri alma durumunda sütunu siliyoruz
    await queryInterface.removeColumn('reports', 'ai_summary_short');
  }
};