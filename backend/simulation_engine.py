from typing import Dict, List

class SimulationEngine:
    """ Evaluates dependencies to generate attack simulations and prediction metrics. """
    
    @staticmethod
    def generate_simulation(evidence: List[Dict], package: str) -> dict:
        if not evidence:
            return {
                "scenario": f"No active attack paths identified for {package}.",
                "vector": "N/A",
                "impact": "None"
            }
            
        # Use the most severe evidence item
        primary_threat = sorted(evidence, key=lambda x: x.get("base_score", 0), reverse=True)[0]
        attack_vector = primary_threat.get("attack_vector", "Unknown Vector")
        description = primary_threat.get("description", "")
        
        scenario = f"An attacker could exploit this vulnerability via {attack_vector.lower()} input. " \
                   f"If successful, this may lead to system compromise or DoS, specifically targeting the {package} parser or logger."
        
        return {
            "scenario": scenario,
            "vector": attack_vector,
            "impact": "High" if primary_threat.get("severity") in ("High", "Critical") else "Medium"
        }
        
    @staticmethod
    def predict_risk(evidence: List[Dict], risk_score: int) -> dict:
        if not evidence:
            probability = "Low"
            desc = "Package appears currently stable with no imminent zero-day predictors."
        elif risk_score >= 7:
            probability = "High"
            desc = "High update frequency metrics indicate this package has historical patching issues. Expect future exploits."
        else:
            probability = "Medium"
            desc = "Moderate risk based on version age. The module is relatively stable but has an expanding attack surface."
            
        return {
            "probability": probability,
            "explanation": desc
        }
