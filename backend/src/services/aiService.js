import axios from 'axios';

// Python servisinin adresi
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const triggerAIAnalysis = async (reportData) => {
    try {
        console.log(`[AI-Service] Analiz isteği gönderiliyor: Report ID ${reportData.id}`);
        
        // Python'daki /analyze endpoint'ine POST isteği
        const response = await axios.post(`${AI_SERVICE_URL}/analyze`, {
            report_id: reportData.id,
            file_path: reportData.filePath, // Veritabanındaki dosya adı/yolu
            original_name: reportData.originalFileName
        });

        console.log('[AI-Service] Python Yanıtı:', response.data);
        return response.data;

    } catch (error) {
        console.error('[AI-Service] Hata:', error.message);
        // Hata olsa bile ana akışı (upload) bozmamak için null dönüyoruz
        // İlerde buraya bir "Retry" mekanizması eklenebilir.
        return null;
    }
};