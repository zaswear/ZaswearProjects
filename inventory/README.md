# Inventario Tecnológico – Guía de Uso

Este directorio contiene una herramienta completa para generar y consultar la **configuración y tareas de mantenimiento** de todos tus proyectos bajo `~/projects`.

## Estructura
```
inventory/
├─ README.md                # Esta guía
├─ generate_inventory.sh    # Script que escanea los proyectos y crea el inventario
├─ schema.sql               # Esquema SQLite usado por la webapp
├─ markdown/                # Plantilla Markdown y archivos generados (opcional)
└─ webapp/                  # Aplicación web ligera escrita en Rust + Rocket
   ├─ Cargo.toml
   └─ src/
       ├─ main.rs
       ├─ routes.rs
       └─ db.rs
```

## Requisitos
- **Rust** (stable) y **Cargo**: `curl https://sh.rustup.rs -sSf | sh`
- **SQLite3** (`sudo apt-get install sqlite3` en WSL)
- **Bash** (para ejecutar el script de generación)

## Generar el inventario
```bash
cd ~/inventory
./generate_inventory.sh
```
El script recorrerá cada carpeta en `~/projects`, extraerá información (README, package.json, requirements.txt, Dockerfile, .github/workflows/*.yml, etc.) y:
1. Creará un archivo Markdown en `markdown/<project>.md` usando la plantilla incluida.
2. Insertará una fila en la base de datos `inventory.db` con los campos seleccionados.

## Ejecutar la webapp
```bash
cd ~/inventory/webapp
cargo run --release
```
Abre tu navegador y navega a `http://127.0.0.1:8000`.

- La página principal lista todos los proyectos.
- Cada proyecto muestra los detalles almacenados en la base de datos.
- **Sin login**: la aplicación está accesible solo desde tu usuario del SO (permiso 700 en la carpeta).

## Seguridad
```bash
chmod -R 700 ~/inventory
```
Solo tu usuario podrá leer/escribir los archivos.

---
*Archivo creado en* `\wsl.localhost\Ubuntu\home\zaswear\inventory\README.md`
