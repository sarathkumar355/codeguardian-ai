import json
import re
from typing import List, Dict

def parse_requirements(content: str) -> List[Dict[str, str]]:
    dependencies = []
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        # Match package==version, package>=version, etc.
        match = re.match(r'^([a-zA-Z0-9_\-\.]+)(.*)$', line)
        if match:
            pkg = match.group(1).lower()
            version_info = match.group(2).strip()
            
            # Simple version extraction
            version = "unknown"
            v_match = re.search(r'[\=\>\<\~\^]+([\d\.]+)', version_info)
            if v_match:
                version = v_match.group(1)
            
            dependencies.append({
                "package": pkg,
                "version": version
            })
    return dependencies

def parse_package_json(content: str) -> List[Dict[str, str]]:
    dependencies = []
    try:
        data = json.loads(content)
        deps = data.get("dependencies", {})
        dev_deps = data.get("devDependencies", {})
        
        all_deps = {**deps, **dev_deps}
        for pkg, version in all_deps.items():
            # Clean up version string (remove ^ or ~)
            clean_version = re.sub(r'^[\^\~]', '', version)
            dependencies.append({
                "package": pkg.lower(),
                "version": clean_version
            })
    except json.JSONDecodeError:
        pass
    
    return dependencies

def parse_dependencies(filename: str, content: str) -> List[Dict[str, str]]:
    if filename.endswith('package.json'):
        return parse_package_json(content)
    else:
        # Default to requirements.txt format
        return parse_requirements(content)
