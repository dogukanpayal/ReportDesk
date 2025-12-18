from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import pdfplumber
import google.generativeai as genai
from dotenv import load_dotenv

# .env dosyasını yükle (API Key güvenliği için)
load_dotenv()

app = FastAPI(title="Report Desk AI Service (Gemini)")

# API Key Kontrolü
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("UYARI: GEMINI_API_KEY bulunamadı! Lütfen .env dosyasını kontrol et.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

class AnalysisRequest(BaseModel):
    report_id: int
    file_path: str
    original_name: str

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "uploads"))

def extract_text_from_pdf(file_path: str):
    """PDF dosyasından metin ayıklar."""
    full_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    full_text += extracted + "\n"
        return full_text
    except Exception as e:
        print(f"PDF Okuma Hatası: {e}")
        return None

def summarize_with_gemini(text):
    """Gemini API kullanarak metni özetler."""
    if not text or len(text) < 50:
        return "İçerik özet çıkarmak için çok kısa."

    try:
        # Gemini 1.5 Flash modeli hızlı ve ücretsiz katman için idealdir
        model = genai.GenerativeModel('gemini-flash-latest')       
        prompt = f"""
        Aşağıdaki metni kurumsal bir rapor formatında, Türkçe olarak özetle. 
        Önemli noktaları vurgula ve gereksiz detaylardan kaçın.
        
        Metin:
        {text}
        """
        
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"Gemini Hatası: {e}")
        return "Yapay zeka servisine erişilemedi veya bir hata oluştu."

@app.post("/analyze")
async def analyze_report(request: AnalysisRequest):
    print(f"--- Rapor {request.report_id} İşleniyor (Gemini) ---")
    full_file_path = os.path.join(UPLOAD_DIR, request.file_path)
    
    if not os.path.exists(full_file_path):
        raise HTTPException(status_code=404, detail="Dosya sunucuda bulunamadı")

    extracted_text = ""
    if request.file_path.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf(full_file_path)
    
    summary_result = ""
    if extracted_text and len(extracted_text) > 30:
        print("Gemini'ye gönderiliyor...")
        summary_result = summarize_with_gemini(extracted_text)
        print("Özet başarıyla alındı.")
    else:
        summary_result = "Okunabilir metin bulunamadı."
    
    return {
        "message": "Tamamlandı",
        "report_id": request.report_id,
        "text_preview": extracted_text[:100] if extracted_text else "",
        "summary": summary_result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)