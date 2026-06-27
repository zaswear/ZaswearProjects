CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    repo_url TEXT,
    language TEXT,
    dependencies TEXT,
    ci_workflows TEXT,
    env_vars TEXT,
    docker_info TEXT,
    runtimes TEXT,
    notes TEXT,
    readme_content TEXT,
    local_setup TEXT,
    workflow_tests TEXT,
    errors_logged TEXT
);
