from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import pdfplumber

app = FastAPI(title="Report Desk AI Service")

# Node.js'ten gelecek veri şablonu
class AnalysisRequest(BaseModel):
    report_id: int
    file_path: str
    original_name: str

# Raporların yüklendiği klasörün yolu (backend/uploads)
# ai-service klasöründen bir yukarı çık (..), sonra backend/uploads'a gir
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "uploads"))

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

    # 4. Sonucu (veya özeti) Node.js'e dön
    # İleride burada Özetleme (Summarization) yapacağız.
    return {
        "message": "Analiz tamamlandı",
        "report_id": request.report_id,
        "text_preview": extracted_text[:200], # Node.js loglarında görmek için ilk 200 karakter
        "character_count": len(extracted_text)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)