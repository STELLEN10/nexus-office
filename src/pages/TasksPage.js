import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot, addDoc,
  updateDoc, deleteDoc, doc, serverTimestamp, where
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

const PRIORITIES = ["low", "medium", "high"];
const STATUSES   = ["todo", "in_progress", "done"];
const STATUS_LABEL = { todo: "To Do", in_progress: "In Progress", done: "Done" };
const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High" };

function dueBadge(dueDate) {
  if (!dueDate) return null;
  const d = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  if (isToday(d)) return { label: "Today", cls: "amber" };
  if (isTomorrow(d)) return { label: "Tomorrow", cls: "blue" };
  if (isPast(d)) return { label: "Overdue", cls: "rose" };
  return { label: format(d, "MMM d"), cls: "default" };
}

/* ── Task Form Modal ── */
function TaskModal({ task, projects, wsId, currentUid, currentName, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title:     task?.title     || "",
    desc:      task?.desc      || "",
    priority:  task?.priority  || "medium",
    status:    task?.status    || "todo",
    dueDate:   task?.dueDate   || "",
    projectId: task?.projectId || "",
    assignee:  task?.assignee  || currentUid,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const data = {
        ...form,
        title: form.title.trim(),
        updatedAt: serverTimestamp(),
      };
      if (isEdit) {
        await updateDoc(doc(db, "workspaces", wsId, "tasks", task.id), data);
      } else {
        await addDoc(collection(db, "workspaces", wsId, "tasks"), {
          ...data,
          createdBy: currentUid,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    await deleteDoc(doc(db, "workspaces", wsId, "tasks", task.id));
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{isEdit ? "Edit task" : "New task"}</h3>

        <div className="tform-field">
          <label className="tform-label">Title</label>
          <input className="tform-input" autoFocus placeholder="What needs to be done?"
            value={form.title} onChange={e => set("title", e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()} />
        </div>

        <div className="tform-field">
          <label className="tform-label">Description</label>
          <textarea className="tform-input tform-textarea" placeholder="Add details…"
            value={form.desc} onChange={e => set("desc", e.target.value)} rows={3} />
        </div>

        <div className="tform-row">
          <div className="tform-field" style={{ flex: 1 }}>
            <label className="tform-label">Priority</label>
            <select className="tform-select" value={form.priority} onChange={e => set("priority", e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
          <div className="tform-field" style={{ flex: 1 }}>
            <label className="tform-label">Status</label>
            <select className="tform-select" value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="tform-row">
          <div className="tform-field" style={{ flex: 1 }}>
            <label className="tform-label">Due date</label>
            <input className="tform-input" type="date"
              value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
          </div>
          <div className="tform-field" style={{ flex: 1 }}>
            <label className="tform-label">Project</label>
            <select className="tform-select" value={form.projectId} onChange={e => set("projectId", e.target.value)}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          {isEdit && (
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!form.title.trim() || loading} onClick={handleSave}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14, margin: "0 auto" }} /> : isEdit ? "Save changes" : "Create task"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Project Form Modal ── */
function ProjectModal({ project, wsId, currentUid, onClose }) {
  const isEdit = !!project;
  const [name, setName]   = useState(project?.name || "");
  const [color, setColor] = useState(project?.color || "#6366f1");
  const [loading, setLoading] = useState(false);
  const COLORS = ["#6366f1","#10b981","#f59e0b","#0ea5e9","#f43f5e","#8b5cf6","#ec4899","#14b8a6"];

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = { name: name.trim(), color, updatedAt: serverTimestamp() };
      if (isEdit) {
        await updateDoc(doc(db, "workspaces", wsId, "projects", project.id), data);
      } else {
        await addDoc(collection(db, "workspaces", wsId, "projects"), {
          ...data, createdBy: currentUid, createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this project? Tasks won't be deleted.")) return;
    await deleteDoc(doc(db, "workspaces", wsId, "projects", project.id));
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{isEdit ? "Edit project" : "New project"}</h3>
        <div className="tform-field">
          <label className="tform-label">Project name</label>
          <input className="tform-input" autoFocus placeholder="e.g. Q3 Roadmap"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()} />
        </div>
        <div className="tform-field">
          <label className="tform-label">Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: "50%", background: c,
                cursor: "pointer", border: color === c ? "3px solid var(--text)" : "3px solid transparent",
                transition: "border .12s",
              }} />
            ))}
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: 20 }}>
          {isEdit && <button className="btn-danger" onClick={handleDelete}>Delete</button>}
          <div style={{ flex: 1 }} />
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!name.trim() || loading} onClick={handleSave}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14, margin: "0 auto" }} /> : isEdit ? "Save" : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Task Card ── */
function TaskCard({ task, projects, onClick, onStatusToggle }) {
  const proj = projects.find(p => p.id === task.projectId);
  const due  = dueBadge(task.dueDate);
  return (
    <div className="tcard" onClick={onClick}>
      <div className="tcard-top">
        <button className={`tcard-check ${task.status === "done" ? "done" : ""}`}
          onClick={e => { e.stopPropagation(); onStatusToggle(task); }}>
          {task.status === "done" && "✓"}
        </button>
        <span className={`tcard-title ${task.status === "done" ? "done" : ""}`}>{task.title}</span>
        <span className={`task-priority ${task.priority}`}>{task.priority}</span>
      </div>
      {task.desc && <p className="tcard-desc">{task.desc}</p>}
      <div className="tcard-footer">
        {proj && (
          <span className="tcard-proj" style={{ background: proj.color + "22", color: proj.color, borderColor: proj.color + "44" }}>
            {proj.name}
          </span>
        )}
        {due && <span className={`tcard-due ${due.cls}`}>{due.label}</span>}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function TasksPage() {
  const { user, profile } = useAuth();
  const { activeWs } = useWorkspace();
  const wsId = activeWs?.id;

  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [view, setView]         = useState("board"); // board | list
  const [filterProj, setFilterProj] = useState("");
  const [filterPri, setFilterPri]   = useState("");
  const [editTask, setEditTask]     = useState(null);
  const [showNewTask, setShowNewTask]   = useState(false);
  const [showNewProj, setShowNewProj]   = useState(false);
  const [editProj, setEditProj]     = useState(null);

  /* Load tasks */
  useEffect(() => {
    if (!wsId) return;
    const q = query(collection(db, "workspaces", wsId, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [wsId]);

  /* Load projects */
  useEffect(() => {
    if (!wsId) return;
    const q = query(collection(db, "workspaces", wsId, "projects"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [wsId]);

  const toggleStatus = async (task) => {
    const next = task.status === "done" ? "todo" : "done";
    await updateDoc(doc(db, "workspaces", wsId, "tasks", task.id), { status: next, updatedAt: serverTimestamp() });
  };

  const filtered = tasks.filter(t => {
    if (filterProj && t.projectId !== filterProj) return false;
    if (filterPri  && t.priority  !== filterPri)  return false;
    return true;
  });

  const byStatus = (s) => filtered.filter(t => t.status === s);

  /* Stats */
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === "done").length;
  const overdue  = tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== "done").length;
  const today    = tasks.filter(t => t.dueDate && isToday(parseISO(t.dueDate)) && t.status !== "done").length;

  return (
    <div className="page-scroll">
      <div className="tasks-wrap">

        {/* Header */}
        <div className="tasks-header">
          <div>
            <h1 className="tasks-title">Tasks & Projects</h1>
            <p className="tasks-sub">{done}/{total} tasks complete · {overdue > 0 ? `${overdue} overdue` : "nothing overdue"}</p>
          </div>
          <div className="tasks-header-actions">
            <div className="view-toggle">
              <button className={view === "board" ? "active" : ""} onClick={() => setView("board")} title="Board">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>
              </button>
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} title="List">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => setShowNewProj(true)}>+ Project</button>
            <button className="btn-primary btn-sm" onClick={() => setShowNewTask(true)}>+ Task</button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="tasks-stats">
          {[
            { label: "Total tasks", val: total, color: "#6366f1" },
            { label: "Completed",   val: done,  color: "#10b981" },
            { label: "Due today",   val: today, color: "#f59e0b" },
            { label: "Overdue",     val: overdue, color: "#f43f5e" },
          ].map(s => (
            <div key={s.label} className="tstat" style={{ "--tc": s.color }}>
              <div className="tstat-val">{s.val}</div>
              <div className="tstat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Projects */}
        <div className="tasks-filters">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            <select className="tform-select filter-select" value={filterProj} onChange={e => setFilterProj(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="tform-select filter-select" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
              <option value="">All priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
          {/* Project chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {projects.map(p => (
              <div key={p.id} className="proj-chip" style={{ background: p.color + "18", borderColor: p.color + "40", color: p.color }}
                onClick={() => setEditProj(p)}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Board view */}
        {view === "board" && (
          <div className="tasks-board">
            {STATUSES.map(s => (
              <div key={s} className="board-col">
                <div className="board-col-head">
                  <span className={`board-col-dot ${s}`} />
                  <span className="board-col-title">{STATUS_LABEL[s]}</span>
                  <span className="board-col-count">{byStatus(s).length}</span>
                </div>
                <div className="board-col-body">
                  {byStatus(s).length === 0 && (
                    <div className="board-empty">No tasks here</div>
                  )}
                  {byStatus(s).map(t => (
                    <TaskCard key={t.id} task={t} projects={projects}
                      onClick={() => setEditTask(t)}
                      onStatusToggle={toggleStatus} />
                  ))}
                  {s === "todo" && (
                    <button className="board-add-btn" onClick={() => setShowNewTask(true)}>+ Add task</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <div className="tasks-list-panel">
            {filtered.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                No tasks yet. <button className="inline-link" onClick={() => setShowNewTask(true)}>Create one →</button>
              </div>
            )}
            {filtered.map(t => (
              <div key={t.id} className="tlist-row" onClick={() => setEditTask(t)}>
                <button className={`tcard-check ${t.status === "done" ? "done" : ""}`} style={{ flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); toggleStatus(t); }}>
                  {t.status === "done" && "✓"}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={`tcard-title ${t.status === "done" ? "done" : ""}`} style={{ fontSize: 13 }}>{t.title}</div>
                  {t.desc && <div className="tcard-desc" style={{ marginTop: 2 }}>{t.desc}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {(() => { const proj = projects.find(p => p.id === t.projectId); return proj ? (
                    <span className="tcard-proj" style={{ background: proj.color + "22", color: proj.color, borderColor: proj.color + "44" }}>{proj.name}</span>
                  ) : null; })()}
                  <span className={`task-priority ${t.priority}`}>{t.priority}</span>
                  {(() => { const due = dueBadge(t.dueDate); return due ? <span className={`tcard-due ${due.cls}`}>{due.label}</span> : null; })()}
                  <span className={`tlist-status ${t.status}`}>{STATUS_LABEL[t.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showNewTask || editTask) && (
        <TaskModal
          task={editTask}
          projects={projects}
          wsId={wsId}
          currentUid={user.uid}
          currentName={profile?.name}
          onClose={() => { setShowNewTask(false); setEditTask(null); }}
        />
      )}
      {(showNewProj || editProj) && (
        <ProjectModal
          project={editProj}
          wsId={wsId}
          currentUid={user.uid}
          onClose={() => { setShowNewProj(false); setEditProj(null); }}
        />
      )}
    </div>
  );
}
