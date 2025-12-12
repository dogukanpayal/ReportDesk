'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('reports', 'ai_summary', {
      type: Sequelize.TEXT, // Uzun metinler için TEXT kullanıyoruz
      allowNull: true,
      defaultValue: null
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('reports', 'ai_summary');
  }
};