// Script: Update existing reports with originalFileName - IMPROVED VERSION
import sequelize from '../src/utils/db.js';
import Report from '../src/models/Report.js';
import path from 'path';

async function updateOriginalFileNames() {
  let transaction;
  
  try {
    console.log('🔄 Starting original file names update...');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    // Transaction başlat
    transaction = await sequelize.transaction();
    
    // Tüm raporları getir (sadece gerekli alanlar)
    const reports = await Report.findAll({
      attributes: ['id', 'filePath', 'originalFileName'],
      where: {
        originalFileName: null // Sadece eksik olanları getir
      },
      transaction
    });
    
    console.log(`📊 Found ${reports.length} reports to update`);
    
    if (reports.length === 0) {
      console.log('✅ No reports need updating');
      await transaction.commit();
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Batch processing için gruplar oluştur
    const batchSize = 50; // Küçük batch size (güvenli)
    const batches = [];
    
    for (let i = 0; i < reports.length; i += batchSize) {
      batches.push(reports.slice(i, i + batchSize));
    }
    
    console.log(`📦 Processing ${batches.length} batches of ${batchSize} reports each`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const updates = [];
      
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} reports)`);
      
      for (const report of batch) {
        try {
          const originalFileName = extractOriginalFileName(report.filePath);
          
          if (originalFileName && isValidFileName(originalFileName)) {
            updates.push({
              id: report.id,
              originalFileName: originalFileName
            });
            console.log(`  ✅ Report ${report.id}: ${report.filePath} -> ${originalFileName}`);
          } else {
            console.warn(`  ⚠️  Skipping report ${report.id}: Invalid filename extracted from "${report.filePath}"`);
            errorCount++;
          }
        } catch (error) {
          console.error(`  ❌ Error processing report ${report.id}:`, error.message);
          errors.push({ id: report.id, error: error.message });
          errorCount++;
        }
      }
      
      // Batch update
      if (updates.length > 0) {
        try {
          await Promise.all(
            updates.map(update => 
              Report.update(
                { originalFileName: update.originalFileName },
                { 
                  where: { id: update.id },
                  transaction
                }
              )
            )
          );
          
          updatedCount += updates.length;
          console.log(`  📈 Batch ${batchIndex + 1} completed: ${updates.length} reports updated`);
        } catch (error) {
          console.error(`  ❌ Batch ${batchIndex + 1} update failed:`, error.message);
          throw error; // Transaction rollback için
        }
      }
    }
    
    await transaction.commit();
    
    // Sonuç raporu
    console.log('\n📊 UPDATE COMPLETED');
    console.log('='.repeat(50));
    console.log(`✅ Successfully updated: ${updatedCount} reports`);
    console.log(`❌ Failed to update: ${errorCount} reports`);
    console.log(`📈 Success rate: ${((updatedCount / reports.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Completed at: ${new Date().toISOString()}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(({ id, error }) => {
        console.log(`   Report ${id}: ${error}`);
      });
    }
    
    console.log('\n🎉 Script completed successfully!');
    
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
      console.log('🔄 Transaction rolled back due to error');
    }
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Geliştirilmiş dosya adı çıkarma fonksiyonu
function extractOriginalFileName(filePath) {
  if (!filePath) return null;
  
  // Dosya adını al
  const fileName = path.basename(filePath);
  
  // Timestamp formatı kontrolü: 1755697676475-842431634-isgg.pdf
  const timestampPattern = /^\d{13}-\d{9}-(.+)$/;
  const match = fileName.match(timestampPattern);
  
  if (match) {
    return match[1]; // Son kısım (isgg.pdf)
  }
  
  // Eğer timestamp formatı değilse, orijinal dosya adını döndür
  return fileName;
}

// Dosya adı validasyonu
function isValidFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return false;
  
  // Boş string kontrolü
  if (fileName.trim().length === 0) return false;
  
  // Uzunluk kontrolü (max 255 karakter)
  if (fileName.length > 255) return false;
  
  // Tehlikeli karakterler kontrolü
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) return false;
  
  // Dosya uzantısı kontrolü
  const hasExtension = /\.\w+$/.test(fileName);
  if (!hasExtension) return false;
  
  return true;
}

// Script'i çalıştır
updateOriginalFileNames();
