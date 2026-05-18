# ZasProjects

Portfolio personal de proyectos web — un launcher minimalista instalable como PWA.

**URL:** `zaswear.github.io/ZaswearProjects` (o desde GitHub Pages)  
**Repo:** `github.com/zaswear`

---

## Proyectos

| # | Nombre | Estado | Tema |
|---|--------|--------|------|
| 01 | [Mijn Utrecht](https://zaswear.github.io/mijnutrecht) | live · GitHub Pages | Bitácora visual de Utrecht — mapa, rutas bici, fotos |
| 02 | [Meal Planner](https://github.com/zaswear/weekly-meal-planner) | repo | Planificador de menú semanal con recetas |
| 03 | [NASA Explorer](https://github.com/zaswear/nasaexplorer) | repo | Explorador espacial con la NASA API |
| 04 | [Salud360](https://github.com/zaswear/Salud360) | repo | App de seguimiento de salud (9 meses, Notion data) |
| 05 | [Art Noveau](https://github.com/zaswear/theartnoveau) | repo | Diseño y arte digital |
| 06 | [Pursue Project](https://github.com/zaswear/pursueproject) | repo | Investigación UAP / OVNIs |

---

## Stack

- **HTML5** vanilla — sin frameworks, todo en `Index.html`
- **CSS** inline — paleta crema + verdes botánicos
- **PWA** — instalable con `manifest.json` y banner nativo
- **Google Fonts** — Playfair Display + Space Mono + Inter

No hay build step. Es HTML estático puro.

---

## Estructura

```
ZaswearProjects/
├── Index.html       ← Toda la web en un archivo
├── manifest.json    ← Configuración PWA
└── README.md        ← Este archivo
```

---

## Añadir un proyecto nuevo

1. Abrir `Index.html` y duplicar un bloque `.card` en el grid
2. Actualizar: número `[0N]`, emoji, nombre, tag, URL del `href`
3. Elegir un `--card-color` de la paleta (ver variables CSS en `:root`)
4. Actualizar el contador en el header: `// N proyectos activos`
5. Commit + push → listo

---

## Paleta

| Variable | Valor | Uso |
|----------|-------|-----|
| `--cream` | `#f7f2e8` | Fondo principal |
| `--green` | `#4a7050` | Acento primario |
| `--blue` | `#6080a0` | Utrecht / canales |
| `--gold` | `#b89040` | NASA / espacio |
| `--terra` | `#b86040` | Recetas / calidez |
| `--teal` | `#408080` | UAP / misterio |
| `--mauve` | `#8060a0` | Arte / diseño |

---

*52.0907°N 5.1214°E · Utrecht, NL*
