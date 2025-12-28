'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Önce vector eklentisinin açık olduğundan emin olalım
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // 2. reports tablosuna embedding sütununu ekleyelim (768 boyutlu vector)
    await queryInterface.sequelize.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS embedding vector(768);');
  },

  async down(queryInterface, Sequelize) {
    // Geri alma işlemi: sütunu sil
    await queryInterface.sequelize.query('ALTER TABLE reports DROP COLUMN IF EXISTS embedding;');
  }
};