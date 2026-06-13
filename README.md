# ZasProjects

Portfolio personal de proyectos web — un launcher minimalista instalable como PWA.

**URL:** `zaswear.github.io/ZaswearProjects`  
**Repo:** `github.com/zaswear`

---

## Proyectos

| # | Nombre | Estado | Tema | URL |
|---|--------|--------|------|-----|
| 01 | [Mijn Utrecht](https://zaswear.github.io/mijnutrecht) | live · GitHub Pages | Bitácora visual de Utrecht — mapa, rutas bici, fotos | zaswear.github.io/mijnutrecht |
| 02 | [Meal Planner](https://zaswear.github.io/weekly-meal-planner/) | live · GitHub Pages | Planificador de menú semanal con recetas | zaswear.github.io/weekly-meal-planner |
| 03 | [NASA Explorer · UAP](https://pursue-uap-project.github.io/nasaexplorer/en/) | live · GitHub Pages | Explorador espacial NASA + investigación UAP/OVNIs (fusión de NASA Explorer y Pursue Project) | pursue-uap-project.github.io/nasaexplorer/en |
| 04 | [Salud360](https://zaswear.github.io/Salud360/) | live · GitHub Pages | App de seguimiento de salud — yoga y ejercicios | zaswear.github.io/Salud360 |
| 05 | [Art Noveau](https://zaswear.github.io/theartnoveau/) | live · GitHub Pages | Diseño y arte digital | zaswear.github.io/theartnoveau |
| 06 | [Tengo Hambre](https://zaswear.github.io/tengohambre/) | live · GitHub Pages | Descubridor de restaurantes | zaswear.github.io/tengohambre |
| 07 | [GameCalendar](https://gamecalendar-iota.vercel.app/) | live · Vercel | Lanzamientos de videojuegos — IGDB + Steam | gamecalendar-iota.vercel.app |
| 08 | [Director's Cut](https://directorscut-five.vercel.app) | live · Vercel | Base de datos personal de películas con PostgreSQL | directorscut-five.vercel.app |
| 09 | [Cosas de Xela](https://cosasdexela.vercel.app) | live · Vercel | Blog de recetas de cocina tradicional gallega | cosasdexela.vercel.app |
| 10 | [CheckStatus](https://checkstatus-eight.vercel.app/) | live · Vercel | Monitor de disponibilidad (uptime robot personal) | checkstatus-eight.vercel.app |
| U1 | ReClip | utilidad · Render | Descargador de vídeos y música (panel integrado) | reclip-icxk.onrender.com |

---

## Stack

- **HTML5** vanilla — sin frameworks, todo en `index.html`
- **CSS** inline — paleta crema + verdes botánicos, modo oscuro
- **PWA** — instalable con `manifest.json` y banner nativo
- **Google Fonts** — Playfair Display + Space Mono + Inter
- **Modo oscuro** — detecta `prefers-color-scheme` y permite toggle manual
- **Temas estacionales** — el acento de color cambia según la época del año

No hay build step. Es HTML estático puro.

---

## Estructura

```
ZaswearProjects/
├── index.html       ← Toda la web en un archivo
├── manifest.json    ← Configuración PWA
└── README.md        ← Este archivo
```

---

## Añadir un proyecto nuevo

1. Abrir `index.html` y duplicar un bloque `.card` en el grid
2. Actualizar: número `[0N]`, emoji, nombre, tag, URL del `href`
3. Elegir un `--card-color` de la paleta (ver variables CSS en `:root`)
4. Actualizar el contador en el header: `// N proyectos activos`
5. Commit + push → listo

---

## Paleta

| Variable | Valor | Uso |
|----------|-------|-----|
| `--cream` | `#f7f2e8` | Fondo principal |
| `--green` | `#4a7050` | Acento primario (primavera) |
| `--blue` | `#6080a0` | Utrecht / canales |
| `--gold` | `#b89040` | NASA / espacio (otoño) |
| `--terra` | `#b86040` | Recetas / calidez (verano) |
| `--teal` | `#408080` | UAP / misterio (invierno) |
| `--mauve` | `#8060a0` | Arte / diseño |

---

*52.0907°N 5.1214°E · Utrecht, NL*
