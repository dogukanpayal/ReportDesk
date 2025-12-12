from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import pdfplumber
from transformers import pipeline

app = FastAPI(title="Report Desk AI Service")

# Node.js'ten gelecek veri şablonu
class AnalysisRequest(BaseModel):
    report_id: int
    file_path: str
    original_name: str

# Raporların yüklendiği klasörün yolu (backend/uploads)
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "uploads"))

# Modeli global olarak bir kez yüklüyoruz
print("Yapay Zeka Modeli Yükleniyor... (İlk açılışta yavaş olabilir)")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def extract_text_from_pdf(file_path: str):
    """PDF dosyasından metin çıkarır."""
    full_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                full_text += page.extract_text() or ""
        return full_text
    except Exception as e:
        print(f"PDF Okuma Hatası: {e}")
        return None

def summarize_text(text):
    """Metni yapay zeka ile özetler."""
    if len(text) < 200:
        return "Metin özetlemek için çok kısa."
    
    try:
        # Maksimum 1024 karakteri modele veriyoruz (Performans için)
        input_text = text[:1024] 
        
        # Özetleme işlemi
        summary = summarizer(input_text, max_length=130, min_length=30, do_sample=False)
        return summary[0]['summary_text']
    except Exception as e:
        print(f"Özetleme Hatası: {e}")
        return "Özet çıkarılamadı."

@app.post("/analyze")
async def analyze_report(request: AnalysisRequest):
    print(f"--- Analiz Başlıyor: Report ID {request.report_id} ---")
    
    # 1. Dosyanın tam yolunu oluştur
    full_file_path = os.path.join(UPLOAD_DIR, request.file_path)
    print(f"Dosya aranıyor: {full_file_path}")

    # 2. Dosya var mı kontrol et
    if not os.path.exists(full_file_path):
        print("HATA: Dosya bulunamadı!")
        raise HTTPException(status_code=404, detail="Dosya sunucuda bulunamadı")

    # 3. Metni çıkar (Sadece PDF ise)
    extracted_text = ""
    if request.file_path.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf(full_file_path)
        print(f"Okunan Metin (İlk 100 karakter): {extracted_text[:100]}...")
    else:
        extracted_text = "Şimdilik sadece PDF analizi destekleniyor."

    # 4. Yapay Zeka ile Özetle (BURAYI EKLEDİK)
    summary_result = ""
    if extracted_text and len(extracted_text) > 50:
        print("Yapay Zeka Özetliyor...")
        summary_result = summarize_text(extracted_text)
        print(f"Özet: {summary_result}")
    
    return {
        "message": "Analiz tamamlandı",
        "report_id": request.report_id,
        "text_preview": extracted_text[:200],
        "summary": summary_result  # <--- Yeni eklenen özet alanı
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)