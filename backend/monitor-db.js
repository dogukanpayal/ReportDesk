// Database Monitoring Script
import sequelize from './src/utils/db.js';

console.log('📊 Starting Database Monitoring...');
console.log('Press Ctrl+C to stop monitoring\n');

let connectionCount = 0;
let errorCount = 0;

// Her 5 saniyede bir durum kontrolü
const monitor = setInterval(async () => {
  try {
    connectionCount++;
    await sequelize.authenticate();
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ Connection #${connectionCount}: OK`);
    
    // Pool durumunu kontrol et
    const pool = sequelize.connectionManager.pool;
    if (pool) {
      console.log(`    📈 Pool: ${pool.size || 'N/A'} total, ${pool.available || 'N/A'} available`);
    }
    
  } catch (error) {
    errorCount++;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ❌ Connection #${connectionCount}: FAILED - ${error.message}`);
  }
}, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping monitoring...');
  console.log(`📊 Final Stats: ${connectionCount} connections, ${errorCount} errors`);
  clearInterval(monitor);
  process.exit(0);
});
