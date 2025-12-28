from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import pdfplumber
import google.generativeai as genai
from dotenv import load_dotenv
import json

# .env dosyasını yükle
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

# YENİ: Arama sorgusu için model
class QueryRequest(BaseModel):
    text: str

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
    """Gemini API kullanarak metni özetler ve anahtar kelime çıkarır."""
    if not text or len(text) < 50:
        return {
            "short": "İçerik çok kısa.", 
            "detailed": "İçerik özet çıkarmak için çok kısa.",
            "keywords": []
        }

    try:
        model = genai.GenerativeModel('gemini-flash-latest')       
        
        prompt = f"""
        Aşağıdaki rapor metnini analiz et ve bana MUTLAKA geçerli bir JSON formatında yanıt ver.
        
        İstenen JSON Formatı:
        {{
            "short": "Buraya raporun 2-3 cümlelik, yöneticinin hızlıca okuyabileceği raporun ne içerdiğini anlatan çok kısa ve vurucu bir özetini yaz.",
            "detailed": "Buraya raporun maddeler halinde (bullet points), geniş kapsamlı, detaylı ve profesyonel analizini yaz.",
            "keywords": ["AnahtarKelime1", "AnahtarKelime2", "AnahtarKelime3", "AnahtarKelime4", "AnahtarKelime5"]
        }}

        ÖNEMLİ TALİMATLAR:
        1. "short" kısmı: Kısa, öz ve net olsun.
        2. "detailed" kısmı: BURASI ÇOK ÖNEMLİ. Asla kısa kesme. Metni kurumsal bir rapor formatında, Türkçe olarak, maddeler halinde detaylandırarak yaz.
        3. "keywords" kısmı: Metnin içeriğini en iyi yansıtan, aranabilirliği yüksek 5 ila 7 adet teknik terim veya konuyu içeren bir String Listesi (Array) olsun.
        4. Sadece saf JSON döndür. Markdown etiketi (```json) kullanma.
        
        Rapor Metni:
        {text}
        """
        
        response = model.generate_content(prompt)
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            print("JSON ayrıştırma hatası, düz metin dönülüyor.")
            # Hata durumunda kurtarma senaryosu
            return {
                "short": response.text[:200] + "...",
                "detailed": response.text,
                "keywords": []
            }
            
    except Exception as e:
        print(f"Gemini Hatası: {e}")
        return {"short": "AI Servisi Hatası", "detailed": f"Model hatası: {str(e)}", "keywords": []}

# YENİ: Embedding oluşturma fonksiyonu
def generate_embedding(text):
    """Metni vektöre çevirir (768 boyutlu)."""
    try:
        # Metin çok uzunsa kırpma yapılabilir ama Gemini genelde iyi yönetir
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text[:9000], # Güvenlik sınırı
            task_type="retrieval_document",
            title="Rapor İçeriği"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embedding Hatası: {e}")
        return None

@app.post("/analyze")
async def analyze_report(request: AnalysisRequest):
    print(f"--- Rapor {request.report_id} İşleniyor (Gemini) ---")
    full_file_path = os.path.join(UPLOAD_DIR, request.file_path)
    
    if not os.path.exists(full_file_path):
        raise HTTPException(status_code=404, detail="Dosya sunucuda bulunamadı")

    extracted_text = ""
    if request.file_path.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf(full_file_path)
    
    summary_result = {"short": "", "detailed": "", "keywords": []}
    embedding_vector = [] 

    if extracted_text and len(extracted_text) > 30:
        print("Gemini ile özetleniyor ve etiketleniyor...")
        summary_result = summarize_with_gemini(extracted_text)
        
        # Embedding oluştur
        print("Embedding oluşturuluyor...")
        embedding_vector = generate_embedding(extracted_text)
        print("Analiz tamamlandı.")
    else:
        summary_result = {"short": "Metin yok.", "detailed": "Okunabilir metin bulunamadı.", "keywords": []}
    
    return {
        "message": "Tamamlandı",
        "report_id": request.report_id,
        "text_preview": extracted_text[:100] if extracted_text else "",
        "short_summary": summary_result.get("short"),
        "detailed_summary": summary_result.get("detailed"),
        "keywords": summary_result.get("keywords", []), # YENİ: Anahtar kelimeler eklendi
        "embedding": embedding_vector 
    }

# YENİ: Arama sorgusu için endpoint
@app.post("/embed-query")
async def embed_query(request: QueryRequest):
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=request.text,
            task_type="retrieval_query"
        )
        return {"embedding": result['embedding']}
    except Exception as e:
        print(f"Query Embedding Hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)