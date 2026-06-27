// inventory/webapp/src/db.rs
use serde::{Serialize, Deserialize};
use rusqlite::{params, Connection, Result as SqlResult};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkflowTest {
    pub name: String,
    pub commands: Vec<String>,
    pub success_criteria: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorLogged {
    pub date: String,
    pub workflow: String,
    pub error: String,
    pub cause: String,
    pub rule: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub repo_url: Option<String>,
    pub language: Option<String>,
    pub dependencies: Option<String>,
    pub ci_workflows: Option<String>,
    pub env_vars: Option<String>,
    pub docker_info: Option<String>,
    pub runtimes: Option<String>,
    pub notes: Option<String>,
    pub readme_content: Option<String>,
    pub local_setup: Option<String>,
    pub workflow_tests: Vec<WorkflowTest>,
    pub errors_logged: Vec<ErrorLogged>,
}

fn get_connection() -> SqlResult<Connection> {
    let db_path = Path::new("../inventory.db");
    Connection::open(db_path)
}

pub async fn get_all_projects() -> Result<Vec<Project>, String> {
    rocket::tokio::task::spawn_blocking(move || {
        let conn = get_connection().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, name, path, repo_url, language, dependencies, ci_workflows, env_vars, docker_info, runtimes, notes, readme_content, local_setup, workflow_tests, errors_logged FROM projects")
            .map_err(|e| e.to_string())?;
        let project_iter = stmt
            .query_map([], |row| {
                let wf_tests_str: Option<String> = row.get(13)?;
                let wf_tests: Vec<WorkflowTest> = wf_tests_str
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or_default();
                
                let err_logged_str: Option<String> = row.get(14)?;
                let err_logged: Vec<ErrorLogged> = err_logged_str
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or_default();

                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                    repo_url: row.get(3)?,
                    language: row.get(4)?,
                    dependencies: row.get(5)?,
                    ci_workflows: row.get(6)?,
                    env_vars: row.get(7)?,
                    docker_info: row.get(8)?,
                    runtimes: row.get(9)?,
                    notes: row.get(10)?,
                    readme_content: row.get(11)?,
                    local_setup: row.get(12)?,
                    workflow_tests: wf_tests,
                    errors_logged: err_logged,
                })
            })
            .map_err(|e| e.to_string())?;
        let mut projects = Vec::new();
        for proj in project_iter {
            projects.push(proj.map_err(|e| e.to_string())?);
        }
        Ok(projects)
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn get_project_by_name(name: &str) -> Result<Project, String> {
    let name_owned = name.to_string();
    rocket::tokio::task::spawn_blocking(move || {
        let conn = get_connection().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, name, path, repo_url, language, dependencies, ci_workflows, env_vars, docker_info, runtimes, notes, readme_content, local_setup, workflow_tests, errors_logged FROM projects WHERE name = ?1")
            .map_err(|e| e.to_string())?;
        stmt.query_row(params![name_owned], |row| {
            let wf_tests_str: Option<String> = row.get(13)?;
            let wf_tests: Vec<WorkflowTest> = wf_tests_str
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default();
            
            let err_logged_str: Option<String> = row.get(14)?;
            let err_logged: Vec<ErrorLogged> = err_logged_str
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default();

            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                repo_url: row.get(3)?,
                language: row.get(4)?,
                dependencies: row.get(5)?,
                ci_workflows: row.get(6)?,
                env_vars: row.get(7)?,
                docker_info: row.get(8)?,
                runtimes: row.get(9)?,
                notes: row.get(10)?,
                readme_content: row.get(11)?,
                local_setup: row.get(12)?,
                workflow_tests: wf_tests,
                errors_logged: err_logged,
            })
        })
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
