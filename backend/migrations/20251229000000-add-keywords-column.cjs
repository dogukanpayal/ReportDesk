// backend/migrations/20251229000000-add-keywords-column.cjs
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('reports', 'ai_keywords', {
      type: Sequelize.JSON, // Anahtar kelimeleri JSON dizisi olarak tutacağız ["tag1", "tag2"]
      allowNull: true,
      defaultValue: []
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('reports', 'ai_keywords');
  }
};