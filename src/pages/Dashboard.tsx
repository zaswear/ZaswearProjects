import { useState } from "react";
import { Link } from "react-router-dom";
import { projects, categories, greeting } from "../lib/data";
import { useClock, useLocalStorage, uid } from "../lib/storage";
import type { Task } from "../types";
import ProjectCard from "../components/ProjectCard";

export default function Dashboard() {
  const now = useClock();
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [draft, setDraft] = useState("");

  const open = tasks.filter((t) => !t.done);
  const FEATURED = ["gamecalendar", "directorscut", "weekly-meal-planner", "salud360", "recetario"];
  const featured = FEATURED.map((id) => projects.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  function add(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setTasks([{ id: uid(), text, done: false, createdAt: Date.now() }, ...tasks]);
    setDraft("");
  }
  function toggle(id: string) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  return (
    <div className="rise">
      <header className="dash-head">
        <div>
          <div className="mono dash-date">{dateStr}</div>
          <h1 className="serif dash-hi">{greeting()}, Zaswear.</h1>
        </div>
        <div className="serif dash-clock tnum">{timeStr}</div>
      </header>

      <div className="dash-stats mono">
        <span><b className="tnum">{projects.length}</b> proyectos</span>
        <span className="sep">·</span>
        <span><b className="tnum">{categories.length}</b> categorías</span>
        <span className="sep">·</span>
        <span className={open.length ? "hot" : ""}><b className="tnum">{open.length}</b> tareas abiertas</span>
      </div>

      <div className="dash-grid">
        <section>
          <SecHead title="Tu día" to="/tareas" cta="ver todo" />
          <div className="card-surface dash-tasks">
            <form onSubmit={add} className="dash-add">
              <input
                className="field"
                placeholder="Añadir una tarea para hoy…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Nueva tarea"
              />
              <button className="btn btn--accent" type="submit">Añadir</button>
            </form>
            {open.length === 0 ? (
              <p className="dash-empty mono">Sin tareas. Día limpio. ✦</p>
            ) : (
              <ul className="dash-list">
                {open.slice(0, 6).map((t) => (
                  <li key={t.id}>
                    <button className="dash-check" onClick={() => toggle(t.id)} aria-label="Completar tarea" />
                    <span>{t.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <SecHead title="Proyectos destacados" to="/proyectos" cta="los 19" />
          <div className="dash-projects">
            {featured.map((p, i) => (
              <ProjectCard key={p.id} p={p} index={i} />
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .dash-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 26px; }
        .dash-date { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); }
        .dash-hi { font-size: clamp(30px, 5vw, 46px); line-height: 1.05; margin-top: 4px; }
        .dash-clock { font-size: clamp(30px, 5vw, 46px); color: var(--text-mid); }
        .dash-stats { display: flex; gap: 10px; flex-wrap: wrap; align-items: baseline; margin: -8px 0 26px; font-size: 13px; color: var(--text-dim); }
        .dash-stats b { color: var(--text-mid); font-weight: 600; }
        .dash-stats .sep { opacity: .4; }
        .dash-stats .hot b { color: var(--accent); }
        .dash-grid { display: grid; gap: 28px; grid-template-columns: 1fr; }
        @media (min-width: 940px) { .dash-grid { grid-template-columns: 0.9fr 1.3fr; align-items: start; } }
        .dash-tasks { padding: 16px; }
        .dash-add { display: flex; gap: 8px; margin-bottom: 12px; }
        .dash-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
        .dash-list li { display: flex; align-items: center; gap: 11px; padding: 9px 4px; border-bottom: 1px solid var(--line); font-size: 14px; }
        .dash-list li:last-child { border-bottom: none; }
        .dash-check { width: 19px; height: 19px; border-radius: 6px; border: 1.6px solid var(--line-hi); background: transparent; flex-shrink: 0; transition: border-color .15s, background .15s; }
        .dash-check:hover { border-color: var(--accent); }
        .dash-empty { color: var(--text-dim); font-size: 13px; padding: 14px 4px; }
        .dash-projects { display: grid; gap: 13px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 1100px) { .dash-projects { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </div>
  );
}


function SecHead({ title, to, cta }: { title: string; to: string; cta: string }) {
  return (
    <div className="sec-head">
      <h2 className="sec-title">{title}</h2>
      <Link to={to} className="mono sec-cta">{cta} →</Link>
      <style>{`
        .sec-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
        .sec-title { font-size: 14px; letter-spacing: .04em; text-transform: uppercase; color: var(--text-mid); font-weight: 600; }
        .sec-cta { font-size: 12px; color: var(--text-dim); transition: color .15s; }
        .sec-cta:hover { color: var(--accent); }
      `}</style>
    </div>
  );
}
