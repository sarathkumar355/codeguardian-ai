from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os

from parser_module import parse_dependencies
from ml_analyzer import MLAnalyzer

app = FastAPI(title="CodeGuardian AI API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Analyzer (loading index on startup)
data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cve_dataset.json")
analyzer = MLAnalyzer(data_path)

class AnalyzeRequest(BaseModel):
    content: str
    filename: Optional[str] = "requirements.txt"

@app.get("/")
def read_root():
    return {"message": "CodeGuardian AI Backend Running"}

@app.post("/analyze")
def analyze_text(request: AnalyzeRequest):
    content = request.content
    filename = request.filename
    
    if not content:
        raise HTTPException(status_code=400, detail="Content cannot be empty")
        
    dependencies = parse_dependencies(filename, content)
    if not dependencies:
        raise HTTPException(status_code=400, detail="No dependencies parsed. Check format.")
        
    results = analyzer.analyze_project(dependencies)
    return results

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content_bytes = await file.read()
    content = content_bytes.decode('utf-8')
    
    dependencies = parse_dependencies(file.filename, content)
    if not dependencies:
        raise HTTPException(status_code=400, detail="No dependencies parsed. Check format.")
        
    results = analyzer.analyze_project(dependencies)
    return results

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
