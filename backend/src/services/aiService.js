import axios from 'axios';
import Report from '../models/Report.js';

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

        console.log('[AI-Service] Python yanıtı alındı:', { status: response.status, data: aiResult }); // Debug için log ekledik

        // --- KRİTİK DÜZELTME ---
        // Python artık 'detailed_summary' ve 'short_summary' gönderiyor.
        // Bunları veritabanı modelindeki 'aiSummary' ve 'aiSummaryShort' alanlarına eşliyoruz.
        
        if (aiResult.detailed_summary || aiResult.short_summary) {
            // Daha güvenli: önce raporu yükle, alanları set et ve save çağır
            const report = await Report.findByPk(reportData.id);
            if (report) {
                report.aiSummary = typeof aiResult.detailed_summary === 'string' ? aiResult.detailed_summary : String(aiResult.detailed_summary || '');
                report.aiSummaryShort = typeof aiResult.short_summary === 'string' ? aiResult.short_summary : String(aiResult.short_summary || '');
                await report.save();
                console.log(`[AI-Service] BAŞARILI: Rapor ID ${reportData.id} için özetler veritabanına kaydedildi.`);
            } else {
                console.error(`[AI-Service] HATA: Rapor bulunamadı: ID ${reportData.id}`);
            }
        } else {
            console.error('[AI-Service] HATA: Python servisi beklenen özet alanlarını döndürmedi.');
        }

        return aiResult;

    } catch (error) {
        // Daha ayrıntılı hata kaydı - axios hatalarında response olabilir
        console.error('[AI-Service] Hata:', error.message);
        if (error.response) {
            console.error('[AI-Service] Hata response.data:', error.response.data);
            console.error('[AI-Service] Hata response.status:', error.response.status);
        }
        console.error('[AI-Service] Stack:', error.stack);
        return null;
    }
};