from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import pdfplumber
import re
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

app = FastAPI(title="Report Desk AI Service")

class AnalysisRequest(BaseModel):
    report_id: int
    file_path: str
    original_name: str

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "uploads"))

# --- UZMAN ÖZETLEME MODELİ ---
# Bu model Türkçe dahil 45 dilde özetleme yapmak için özel eğitilmiştir.
print("Yapay Zeka Modeli Yükleniyor... (csebuetnlp/mT5_multilingual_XLSum)")
model_name = "csebuetnlp/mT5_multilingual_XLSum"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Pipeline oluşturma
summarizer = pipeline("summarization", model=model, tokenizer=tokenizer)

def clean_text(text):
    """Metni temizler ve gürültüden arındırır."""
    if not text: return ""
    
    # 1. PDF'ten gelen (cid:123) gibi bozuk karakterleri sil
    text = re.sub(r'\(cid:\d+\)', '', text)
    
    # 2. Satır sonlarını boşlukla değiştir
    text = text.replace('\n', ' ')
    
    # 3. Fazla boşlukları temizle
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def extract_text_from_pdf(file_path: str):
    full_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    full_text += extracted + " "
        return clean_text(full_text)
    except Exception as e:
        print(f"PDF Okuma Hatası: {e}")
        return None

def summarize_text(text):
    if len(text) < 50: return "İçerik çok kısa."

    try:
        # Tokenizer ile metni tokenlara ayır
        # XLSum modeli için metni 512 token ile sınırlıyoruz
        input_ids = tokenizer.encode(text, return_tensors="pt", max_length=512, truncation=True)
        
        # Modele özel bir prefix (ön ek) vermemize gerek yok, direkt metni veriyoruz.
        # Ancak pipeline içinde truncate edilmiş metni kullanmalıyız.
        truncated_text = tokenizer.decode(input_ids[0], skip_special_tokens=True)

        summary = summarizer(
            truncated_text, 
            max_length=84,   # Kısa ve öz bir özet (Başlık gibi)
            min_length=10,   # Çok kısa olmasın
            do_sample=False, # Rastgelelik kapalı (Tutarlı sonuç)
            num_beams=2,     # En iyi cümleyi bulmak için 2 yol dene
            truncation=True
        )[0]['summary_text']
        
        return summary

    except Exception as e:
        print(f"Özetleme hatası: {e}")
        return "Özet oluşturulamadı."

@app.post("/analyze")
async def analyze_report(request: AnalysisRequest):
    print(f"--- Rapor {request.report_id} İşleniyor ---")
    full_file_path = os.path.join(UPLOAD_DIR, request.file_path)
    
    if not os.path.exists(full_file_path):
        raise HTTPException(status_code=404, detail="Dosya yok")

    extracted_text = ""
    if request.file_path.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf(full_file_path)
    
    summary_result = ""
    if extracted_text and len(extracted_text) > 30:
        print("Özetleniyor...")
        summary_result = summarize_text(extracted_text)
        print(f"SONUÇ: {summary_result}")
    else:
        summary_result = "Okunabilir metin yok."
    
    return {
        "message": "Tamamlandı",
        "report_id": request.report_id,
        "text_preview": extracted_text[:100],
        "summary": summary_result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)