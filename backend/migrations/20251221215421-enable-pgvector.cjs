'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Veritabanında 'vector' eklentisini aktif eder.
    // IF NOT EXISTS: Zaten aktifse hata vermesini engeller.
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
  },

  async down(queryInterface, Sequelize) {
    // İşlemi geri almak isterseniz (migration undo) eklentiyi kaldırır.
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS vector;');
  }
};