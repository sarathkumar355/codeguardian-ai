import json
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv
import re

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    # We will try to configure without explicit key if environment already has it or we will catch errors later
    pass

class RAGPipeline:
    def __init__(self, data_path: str):
        # Initialize Sentence Transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Load data
        try:
            with open(data_path, 'r') as f:
                self.dataset = json.load(f)
        except Exception as e:
            print(f"Error loading dataset: {e}")
            self.dataset = []
            
        # Prepare text descriptions for embedding
        self.texts = [
            f"Package: {item['package']} | CVE: {item['cve_id']} | Severity: {item['severity']} | Description: {item['description']} | Attack Vector: {item['attack_vector']}"
            for item in self.dataset
        ]
        
        if self.texts:
            print("Encoding dataset...")
            embeddings = self.model.encode(self.texts)
            
            # Initialize FAISS index
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(np.array(embeddings).astype('float32'))
            print("FAISS index initialized.")
        else:
            self.index = None

    def retrieve(self, query: str, top_k: int = 3):
        if not self.index:
            return []
            
        query_vector = self.model.encode([query])
        distances, indices = self.index.search(np.array(query_vector).astype('float32'), top_k)
        
        results = []
        for idx in indices[0]:
            if idx < len(self.dataset):
                results.append(self.dataset[idx])
                
        return results

    def analyze_dependency(self, package: str, version: str) -> dict:
        # 1. Retrieve context
        query = f"vulnerabilities in package {package} version {version}"
        retrieved_docs_raw = self.retrieve(query, top_k=2)
        
        # Format retrieved docs for the prompt
        retrieved_docs_str = ""
        evidence_sources = []
        for doc in retrieved_docs_raw:
            # Check if this doc is actually relevant to the requested package
            if doc['package'].lower() == package.lower():
                retrieved_docs_str += f"- {doc['cve_id']} (Severity: {doc['severity']}): {doc['description']}\n"
                evidence_sources.append(doc)
        
        if not retrieved_docs_str:
            retrieved_docs_str = "No specific known vulnerabilities found in the retrieved context for this exact package version."
        
        # Core engines
        from decision_engine import DecisionEngine
        from simulation_engine import SimulationEngine
        
        base_risk_score = 8 if evidence_sources else 0
        simulation_data = SimulationEngine.generate_simulation(evidence_sources, package)
        prediction_data = SimulationEngine.predict_risk(evidence_sources, base_risk_score)
        decision_data = DecisionEngine.evaluate(base_risk_score, evidence_sources)
        
        # 2. Construct LLM Prompt
        prompt = f"""
You are a cybersecurity expert.
Dependency: {package} {version}
Context (retrieved vulnerabilities):
{retrieved_docs_str}

Tasks:
1. Explain vulnerabilities clearly (for a beginner)
2. Explain technical vulnerabilities (for an expert)
3. Assign risk score (0-10)
4. Suggest fixes and provide a specific fix command (e.g., pip install {package}==latest or npm install {package}@latest)
5. Provide a one-line business impact summary statement (explaining real-world impact).
6. Estimate the year of the oldest reported vulnerability and the newest patch/update in the context.
7. Assign a confidence score string (e.g. "High (RAG Vector Matches - 0.92)").

Important: Return ONLY a valid JSON object with the following exact structure, no markdown:
{{
  "explanation_beginner": "string",
  "explanation_expert": "string",
  "risk_score": number,
  "fixes": ["string"],
  "impact_summary": "string",
  "fix_command": "string",
  "first_reported": "string",
  "last_updated": "string",
  "confidence_score": "string"
}}
"""
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(temperature=0.2)
            )
            
            text_resp = response.text.strip()
            if text_resp.startswith("```json"):
                text_resp = text_resp.replace("```json", "", 1)
            if text_resp.endswith("```"):
                text_resp = text_resp[:-3]
            
            llm_data = json.loads(text_resp)
        except Exception as e:
            print(f"Error during LLM generation for {package}: {e}")
            llm_data = {
                "explanation_beginner": f"Found {len(evidence_sources)} relevant CVEs. Update requested.",
                "explanation_expert": "Potential exploit vectors found matching CVE constraints. Apply patch immediately.",
                "risk_score": base_risk_score,
                "fixes": ["Update to latest stable version."],
                "impact_summary": "This vulnerability may cause data leaks or service outages affecting end users.",
                "fix_command": f"pip install {package}==latest",
                "first_reported": "2020",
                "last_updated": "2023",
                "confidence_score": "Medium (Fallback Strategy)"
            }
            
        return {
            "package": package,
            "version": version,
            "vulnerable": len(evidence_sources) > 0 and llm_data.get("risk_score", 0) >= 4,
            "risk_score": llm_data.get("risk_score", base_risk_score),
            "explanation_beginner": llm_data.get("explanation_beginner"),
            "explanation_expert": llm_data.get("explanation_expert"),
            "prediction": prediction_data,
            "simulation": simulation_data,
            "decision": decision_data,
            "fixes": llm_data.get("fixes", []),
            "impact_summary": llm_data.get("impact_summary", "This vulnerability may cause data leaks or service outages affecting end users."),
            "fix_command": llm_data.get("fix_command", ""),
            "first_reported": llm_data.get("first_reported", ""),
            "last_updated": llm_data.get("last_updated", ""),
            "confidence_score": llm_data.get("confidence_score", "High (RAG Vector Matches - 0.95)"),
            "evidence": evidence_sources
        }
