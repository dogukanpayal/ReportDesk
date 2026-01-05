'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 'Reports' yerine 'reports' kullanıyoruz
    await queryInterface.addColumn('reports', 'sentiment_label', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('reports', 'sentiment_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Geri alma (undo) işlemi için de 'reports'
    await queryInterface.removeColumn('reports', 'sentiment_label');
    await queryInterface.removeColumn('reports', 'sentiment_score');
  }
};