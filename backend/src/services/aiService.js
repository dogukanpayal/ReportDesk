import axios from 'axios';
import Report from '../models/Report.js';
import sequelize from '../utils/db.js'; // Sequelize import edildi

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const triggerAIAnalysis = async (reportData) => {
    try {
        console.log(`[AI-Service] Analiz isteği gönderiliyor: Report ID ${reportData.id}`);
        
        // Python servisine istek at
        const response = await axios.post(`${AI_SERVICE_URL}/analyze`, {
            report_id: reportData.id,
            file_path: reportData.filePath,
            original_name: reportData.originalFileName
        });

        const aiResult = response.data;

        // Normalize AI service output types: ensure summaries are strings
        let detailed = aiResult.detailed_summary;
        let shortS = aiResult.short_summary;

        if (Array.isArray(detailed)) {
            detailed = detailed.join('\n\n- ');
        } else if (typeof detailed === 'object' && detailed !== null) {
            detailed = JSON.stringify(detailed, null, 2);
        }

        if (Array.isArray(shortS)) {
            shortS = shortS.join(' ');
        } else if (typeof shortS === 'object' && shortS !== null) {
            shortS = JSON.stringify(shortS);
        }

        // Replace in result for later usage/logging
        aiResult.detailed_summary = detailed;
        aiResult.short_summary = shortS;

        console.log('[AI-Service] Python yanıtı alındı:', { status: response.status, data: aiResult });

        // Veritabanına kaydetme işlemi
        if (aiResult.detailed_summary || aiResult.short_summary) {
            
            const detailedContent = typeof aiResult.detailed_summary === 'string' ? aiResult.detailed_summary : String(aiResult.detailed_summary || '');
            const shortContent = typeof aiResult.short_summary === 'string' ? aiResult.short_summary : String(aiResult.short_summary || '');
            
            // Embedding dizisini string formatına çevir (pgvector için gerekli format: "[0.1, 0.2, ...]")
            let embeddingString = null;
            if (aiResult.embedding && Array.isArray(aiResult.embedding)) {
                embeddingString = JSON.stringify(aiResult.embedding);
            }

            try {
                // Raw Query kullanarak güncelleme yapıyoruz (Vector tipi için en güvenli yöntem)
                await sequelize.query(
                    `UPDATE reports 
                     SET ai_summary = :detailed, 
                         ai_summary_short = :short, 
                         embedding = :embedding 
                     WHERE id = :id`,
                    {
                        replacements: {
                            detailed: detailedContent,
                            short: shortContent,
                            embedding: embeddingString, // Eğer null ise null kaydedilir
                            id: reportData.id
                        }
                    }
                );
                
                console.log(`[AI-Service] BAŞARILI: Rapor ID ${reportData.id} için özet ve embedding kaydedildi.`);
                
            } catch (dbError) {
                console.error(`[AI-Service] DB Hatası:`, dbError);
            }

        } else {
            console.error('[AI-Service] HATA: Python servisi beklenen özet alanlarını döndürmedi.');
        }

        return aiResult;

    } catch (error) {
        // Daha ayrıntılı hata kaydı
        console.error('[AI-Service] Hata:', error.message);
        if (error.response) {
            console.error('[AI-Service] Hata response.data:', error.response.data);
            console.error('[AI-Service] Hata response.status:', error.response.status);
        }
        console.error('[AI-Service] Stack:', error.stack);
        return null;
    }
};