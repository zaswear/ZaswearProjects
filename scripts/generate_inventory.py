#!/usr/bin/env python3
import os
import re
import json
import sqlite3
import subprocess
from pathlib import Path

# Paths
HOME = Path(os.environ.get("HOME", "/home/zaswear"))
PROJECTS_DIR = HOME / "projects"
DB_FILE = HOME / "projects/zaswear-nexus/inventory/inventory.db"
SCHEMA_FILE = HOME / "projects/zaswear-nexus/inventory/schema.sql"
DOCS_DIR = PROJECTS_DIR / ".docs/local-actions"
ACTIONS_LOCAL_MD = DOCS_DIR / "actions-local.md"
WORKFLOW_TESTS_MD = DOCS_DIR / "workflow-tests.md"

def get_projects_list():
    projects = []
    for item in PROJECTS_DIR.iterdir():
        if item.is_dir() and not item.name.startswith("."):
            projects.append(item.name)
    return sorted(projects)

def parse_actions_local(filepath, projects_list):
    setup_by_project = {}
    if not filepath.exists():
        print(f"Warning: {filepath} not found.")
        return setup_by_project
    
    content = filepath.read_text(encoding='utf-8')
    
    # 1. Parse headings: ### `project_name`
    pattern = r'###\s+`([^`]+)`[^\n]*'
    matches = list(re.finditer(pattern, content))
    
    for i, match in enumerate(matches):
        proj_name = match.group(1).strip()
        start_idx = match.end()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content)
        
        proj_markdown = content[start_idx:end_idx].strip()
        
        # Cut off at the next level 2 heading
        next_heading_match = re.search(r'\n##\s+', proj_markdown)
        if next_heading_match:
            proj_markdown = proj_markdown[:next_heading_match.start()].strip()
            
        # Find matching project from list
        matched_proj = None
        for p in projects_list:
            if p.lower() == proj_name.lower():
                matched_proj = p
                break
        
        if matched_proj:
            setup_by_project[matched_proj] = proj_markdown

    # 2. Parse Section 5 table for third-party repos
    table_pattern = r'\|\s*`([^`]+)`\s*\|\s*([^\|]+)\s*\|\s*`([^`]+)`\s*\|\s*([^\|]+)\|'
    for match in re.finditer(table_pattern, content):
        proj_name = match.group(1).strip()
        stack = match.group(2).strip()
        cmd = match.group(3).strip()
        note = match.group(4).strip()
        
        matched_proj = None
        for p in projects_list:
            if p.lower() == proj_name.lower():
                matched_proj = p
                break
        
        if matched_proj:
            setup_by_project[matched_proj] = f"**Stack:** {stack}\n\n**Comando de Test/Build local:**\n```bash\n{cmd}\n```\n\n**Nota:** {note}"

    return setup_by_project

def parse_workflow_tests(filepath, projects_list):
    tests_by_project = {}
    errors_by_project = {}
    
    if not filepath.exists():
        print(f"Warning: {filepath} not found.")
        return tests_by_project, errors_by_project
        
    content = filepath.read_text(encoding='utf-8')
    
    # 1. Parse errors table (Registro rápido de errores)
    error_section_match = re.search(r'##\s+📒\s*Registro rápido de errores', content)
    if error_section_match:
        error_table_text = content[error_section_match.end():].strip()
        for line in error_table_text.split('\n'):
            if line.strip().startswith('|') and not line.strip().startswith('|---') and not line.strip().startswith('|  ---'):
                parts = [p.strip() for p in line.split('|')[1:-1]]
                if len(parts) >= 5 and parts[0] != "Fecha":
                    date = parts[0]
                    proj_wf = parts[1]
                    error = parts[2]
                    cause = parts[3]
                    rule = parts[4]
                    
                    proj_wf_clean = proj_wf.replace('`', '')
                    proj_name = proj_wf_clean.split('·')[0].strip() if '·' in proj_wf_clean else proj_wf_clean.strip()
                    workflow_name = proj_wf_clean.split('·')[1].strip() if '·' in proj_wf_clean else "N/A"
                    
                    err_obj = {
                        "date": date,
                        "workflow": workflow_name,
                        "error": error,
                        "cause": cause,
                        "rule": rule
                    }
                    
                    matched_proj = None
                    for p in projects_list:
                        if p.lower() == proj_name.lower():
                            matched_proj = p
                            break
                    if matched_proj:
                        if matched_proj not in errors_by_project:
                            errors_by_project[matched_proj] = []
                        errors_by_project[matched_proj].append(err_obj)

    # 2. Parse workflow tests sections
    pattern = r'##\s+\d+[^ \n]*\s+([^\n]+)'
    matches = list(re.finditer(pattern, content))
    
    for i, match in enumerate(matches):
        section_title = match.group(1).strip()
        
        # Check which projects match
        matched_projects = []
        for p in projects_list:
            if p.lower() in section_title.lower():
                matched_projects.append(p)
                
        if "repos clonados" in section_title.lower() or "repos de terceros" in section_title.lower():
            for p in ["markitdown", "agent-browser", "web-to-app", "Stirling-PDF"]:
                if p not in matched_projects and p in projects_list:
                    matched_projects.append(p)
                    
        if not matched_projects:
            continue
            
        start_idx = match.end()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content)
        
        section_text = content[start_idx:end_idx].strip()
        next_heading_match = re.search(r'\n##\s+', section_text)
        if next_heading_match:
            section_text = section_text[:next_heading_match.start()].strip()
            
        wf_matches = list(re.finditer(r'###\s+`([^`]+)`[^\n]*', section_text))
        
        section_tests = []
        for j, wf_match in enumerate(wf_matches):
            wf_name = wf_match.group(1).strip()
            wf_start = wf_match.end()
            wf_end = wf_matches[j+1].start() if j + 1 < len(wf_matches) else len(section_text)
            wf_content = section_text[wf_start:wf_end].strip()
            
            # Extract commands in code blocks
            commands = []
            for cb in re.findall(r'```bash\n(.*?)\n```', wf_content, re.DOTALL):
                commands.extend([line.strip() for line in cb.split('\n') if line.strip() and not line.strip().startswith('#')])
                
            # Extract success criteria
            success_match = re.search(r'\*\*✅\s*Éxito:\*\*([^\n]*)', wf_content, re.IGNORECASE)
            success_criteria = success_match.group(1).strip() if success_match else ""
            
            test_obj = {
                "name": wf_name,
                "commands": commands,
                "success_criteria": success_criteria
            }
            section_tests.append(test_obj)
            
        for proj in matched_projects:
            if proj not in tests_by_project:
                tests_by_project[proj] = []
            tests_by_project[proj].extend(section_tests)
            
    return tests_by_project, errors_by_project

def scrape_project_details(proj_name):
    proj_path = PROJECTS_DIR / proj_name
    
    # 1. Get repo URL via git
    try:
        repo_url = subprocess.check_output(
            ["git", "-C", str(proj_path), "config", "--get", "remote.origin.url"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        repo_url = "N/A"
        
    # 2. Language and Dependencies
    language = "Desconocido"
    deps = "N/A"
    
    package_json = proj_path / "package.json"
    requirements_txt = proj_path / "requirements.txt"
    go_mod = proj_path / "go.mod"
    cargo_toml = proj_path / "Cargo.toml"
    build_gradle = proj_path / "build.gradle"
    
    if package_json.exists():
        language = "JavaScript/Node"
        try:
            with open(package_json, "r") as f:
                data = json.load(f)
                deps_dict = data.get("dependencies", {})
                dev_deps_dict = data.get("devDependencies", {})
                merged = {**deps_dict, **dev_deps_dict}
                deps = "; ".join([f"{k}: {v}" for k, v in merged.items()])
        except Exception:
            pass
    elif requirements_txt.exists():
        language = "Python"
        try:
            deps = requirements_txt.read_text(encoding='utf-8').replace('\n', '; ')
        except Exception:
            pass
    elif go_mod.exists():
        language = "Go"
        try:
            lines = go_mod.read_text(encoding='utf-8').split('\n')
            req_lines = [l.strip() for l in lines if l.strip().startswith("require") or (l.strip() and not l.strip().startswith("module") and not l.strip().startswith("go"))]
            deps = "; ".join(req_lines)
        except Exception:
            pass
    elif cargo_toml.exists():
        language = "Rust"
        deps = "Cargo.toml managed"
    elif build_gradle.exists():
        language = "Java/Android"
        deps = "Gradle managed"

    # 3. CI workflows
    ci_workflows = "N/A"
    workflow_dir = proj_path / ".github/workflows"
    if workflow_dir.is_dir():
        workflows = [f.name for f in workflow_dir.iterdir() if f.is_file() and (f.suffix == ".yml" or f.suffix == ".yaml")]
        if workflows:
            ci_workflows = "; ".join(workflows)
            
    # 4. Env vars status
    env_vars = "No .env"
    env_files = list(proj_path.glob(".env*"))
    if env_files:
        env_vars = f"Existe {env_files[0].name}"
        
    # 5. Docker info
    docker_info = "Sin Dockerfile"
    if (proj_path / "Dockerfile").exists():
        docker_info = "Dockerfile presente"
    elif (proj_path / "docker-compose.yml").exists():
        docker_info = "docker-compose presente"
        
    # 6. Runtimes
    runtimes = "N/A"
    if (proj_path / ".nvmrc").exists():
        runtimes = f"Node { (proj_path / '.nvmrc').read_text().strip() }"
    elif (proj_path / ".python-version").exists():
        runtimes = f"Python { (proj_path / '.python-version').read_text().strip() }"
    elif (proj_path / ".node-version").exists():
        runtimes = f"Node { (proj_path / '.node-version').read_text().strip() }"
        
    # 7. Notes (First line of README)
    notes = "N/A"
    readme_path = proj_path / "README.md"
    readme_content = ""
    if readme_path.exists():
        try:
            readme_content = readme_path.read_text(encoding='utf-8')
            lines = [l.strip() for l in readme_content.split('\n') if l.strip()]
            if lines:
                notes = lines[0].replace("#", "").strip()
        except Exception:
            pass
            
    return {
        "name": proj_name,
        "path": f"/home/zaswear/projects/{proj_name}",
        "repo_url": repo_url,
        "language": language,
        "dependencies": deps,
        "ci_workflows": ci_workflows,
        "env_vars": env_vars,
        "docker_info": docker_info,
        "runtimes": runtimes,
        "notes": notes,
        "readme_content": readme_content
    }

def main():
    print("Scraping metadata and documents...")
    projects_list = get_projects_list()
    setup_by_project = parse_actions_local(ACTIONS_LOCAL_MD, projects_list)
    tests_by_project, errors_by_project = parse_workflow_tests(WORKFLOW_TESTS_MD, projects_list)
    
    # Connect to SQLite and load schema
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    
    if SCHEMA_FILE.exists():
        print("Recreating database schema...")
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS projects")
        conn.executescript(SCHEMA_FILE.read_text(encoding='utf-8'))
    
    cursor = conn.cursor()
    
    for proj_name in projects_list:
        details = scrape_project_details(proj_name)
        
        # Add the parsed info
        local_setup = setup_by_project.get(proj_name, "")
        workflow_tests = json.dumps(tests_by_project.get(proj_name, []))
        errors_logged = json.dumps(errors_by_project.get(proj_name, []))
        
        cursor.execute("""
            INSERT INTO projects (
                name, path, repo_url, language, dependencies, ci_workflows,
                env_vars, docker_info, runtimes, notes, readme_content,
                local_setup, workflow_tests, errors_logged
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            details["name"], details["path"], details["repo_url"], details["language"],
            details["dependencies"], details["ci_workflows"], details["env_vars"],
            details["docker_info"], details["runtimes"], details["notes"],
            details["readme_content"], local_setup, workflow_tests, errors_logged
        ))
        
    conn.commit()
    conn.close()
    print("Database updated successfully!")

if __name__ == "__main__":
    main()
