from typing import Dict, List

class DecisionEngine:
    """ Evaluates dependencies and provides detailed decision guidance (Upgrade vs Replace vs Ignore). """
    
    @staticmethod
    def evaluate(risk_score: int, evidence: List[Dict]) -> dict:
        severity_levels = [ev.get("severity", "Low") for ev in evidence]
        is_critical = "High" in severity_levels or "Critical" in severity_levels
        
        if risk_score >= 7 or is_critical:
            best_action = "upgrade"
            consequences = "Critical risk of being compromised. Known exploits exist in the wild."
        elif risk_score >= 4:
            best_action = "replace" if "Medium" in severity_levels else "upgrade"
            consequences = "Moderate risk. Attackers could chain this vulnerability with other vectors."
        else:
            best_action = "ignore"
            consequences = "Negligible risk currently, but keep monitoring for future CVEs."

        return {
            "best_action": best_action,
            "options": {
                "upgrade": {
                    "benefits": "Patches known vulnerabilities immediately.",
                    "risks": "May introduce breaking changes in newer versions.",
                    "time_to_fix": "~15 minutes"
                },
                "replace": {
                    "benefits": "Moves away from an historically vulnerable or unmaintained package.",
                    "risks": "Requires refactoring implementation code.",
                    "time_to_fix": "~2-4 hours"
                },
                "ignore": {
                    "consequences": consequences,
                    "time_to_fix": "Risk increases over time"
                }
            }
        }
