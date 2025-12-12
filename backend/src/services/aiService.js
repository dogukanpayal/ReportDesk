import axios from 'axios';
import Report from '../models/Report.js'; // Report modelini import ettiğimizden emin ol

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const triggerAIAnalysis = async (reportData) => {
    try {
        console.log(`[AI-Service] Analiz isteği gönderiliyor: Report ID ${reportData.id}`);
        
        // İsteği gönder
        const response = await axios.post(`${AI_SERVICE_URL}/analyze`, {
            report_id: reportData.id,
            file_path: reportData.filePath,
            original_name: reportData.originalFileName
        });

        const aiResult = response.data;
        
        // --- BURASI DEĞİŞTİ: Log mesajına dikkat ---
        console.log('[AI-Service] Başarılı! Özet geldi.'); 

        // --- VERİTABANI GÜNCELLEME ---
        if (aiResult.summary) {
            await Report.update(
                { aiSummary: aiResult.summary }, // Güncellenecek alan
                { where: { id: reportData.id } } // Hangi rapor?
            );
            console.log(`[AI-Service] Rapor ID ${reportData.id} için özet veritabanına kaydedildi.`);
        }
        // -----------------------------

        return aiResult;

    } catch (error) {
        console.error('[AI-Service] Hata:', error.message);
        return null;
    }
};