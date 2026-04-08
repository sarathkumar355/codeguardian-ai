from typing import List, Dict
from rag_pipeline import RAGPipeline
import os

class MLAnalyzer:
    def __init__(self, data_path: str):
        self.rag = RAGPipeline(data_path)

    def analyze_project(self, dependencies: List[Dict[str, str]]) -> dict:
        results = []
        total_risk = 0
        vulnerable_count = 0
        weakest_dependency = None
        max_risk = -1
        
        for dep in dependencies:
            analysis = self.rag.analyze_dependency(dep['package'], dep['version'])
            results.append(analysis)
            
            risk_score = analysis.get('risk_score', 0)
            total_risk += risk_score
            
            if analysis['vulnerable']:
                vulnerable_count += 1
                
            if risk_score > max_risk:
                max_risk = risk_score
                weakest_dependency = dep['package']
                
        avg_risk = total_risk / len(dependencies) if dependencies else 0
        
        # Determine overall project status
        project_status = "Safe"
        if avg_risk > 6 or vulnerable_count > 0:
            project_status = "Critical"
        elif avg_risk > 3:
            project_status = "Warning"
            
        summary = {
            "dependencies_analyzed": len(dependencies),
            "vulnerable_count": vulnerable_count,
            "overall_risk_score": round(avg_risk, 1),
            "project_status": project_status,
            "weakest_dependency": weakest_dependency,
            "max_risk": max_risk
        }
            
        return {
            "summary": summary,
            "detailed_results": results
        }
