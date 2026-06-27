// inventory/webapp/src/routes.rs
use rocket::http::Status;
use rocket_dyn_templates::Template;
use crate::db::Project;
use serde::Serialize;

#[derive(Serialize)]
struct IndexContext {
    projects: Vec<Project>,
}

#[derive(Serialize)]
struct ProjectContext {
    project: Project,
}

#[get("/")]
pub async fn index() -> Template {
    let projects = crate::db::get_all_projects().await.unwrap_or_default();
    let ctx = IndexContext { projects };
    Template::render("index", &ctx)
}

#[get("/project/<name>")]
pub async fn project_detail(name: &str) -> Result<Template, Status> {
    match crate::db::get_project_by_name(name).await {
        Ok(project) => {
            let ctx = ProjectContext { project };
            Ok(Template::render("project", &ctx))
        }
        Err(_) => Err(Status::NotFound),
    }
}

#[get("/manifest.json")]
pub async fn manifest() -> Option<rocket::fs::NamedFile> {
    rocket::fs::NamedFile::open("static/manifest.json").await.ok()
}

#[get("/service-worker.js")]
pub async fn service_worker() -> Option<rocket::fs::NamedFile> {
    rocket::fs::NamedFile::open("static/service-worker.js").await.ok()
}

