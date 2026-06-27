// inventory/webapp/src/main.rs
#[macro_use] extern crate rocket;

mod routes;
mod db;

use rocket_dyn_templates::Template;

#[launch]
fn rocket() -> _ {
    // Load environment variables if present
    dotenvy::dotenv().ok();

    // Configure to listen on all interfaces (WSL2 -> Windows) at port 8000
    let config = rocket::Config::figment()
        .merge(("address", "0.0.0.0"))
        .merge(("port", 8002));

    rocket::custom(config)
        .attach(Template::fairing())
        .mount("/", routes![
            routes::index, 
            routes::project_detail,
            routes::manifest,
            routes::service_worker
        ])
        .mount("/static", rocket::fs::FileServer::from("static"))
        .mount("/portal", rocket::fs::FileServer::from("../../portal"))
}
