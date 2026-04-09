import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { format } from "date-fns";

// ── SVG icon set ──────────────────────────────────────────────
const Icon = {
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Clock: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Folder: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 4.5A1 1 0 012.5 3.5h4l1.5 2h5.5a1 1 0 011 1v6a1 1 0 01-1 1H2.5a1 1 0 01-1-1V4.5z" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Message: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5V10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11 7.5c1.1.5 2 1.7 2 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="12" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Doc: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9.5 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9.5 2v3.5H13M5.5 8.5h5M5.5 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Video: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 6.5l4-2v7l-4-2V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <rect x="2" y="4.5" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Task: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M2 11l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const TASKS = [
  { id:1, title:"Review Q2 design proposals",    project:"Design", priority:"high",   due:"Today",    done:false },
  { id:2, title:"Update API documentation",       project:"Docs",   priority:"medium", due:"Tomorrow", done:false },
  { id:3, title:"Set up staging environment",     project:"Dev",    priority:"high",   due:"Today",    done:false },
  { id:4, title:"Send weekly status report",      project:"Admin",  priority:"low",    due:"Fri",      done:true  },
  { id:5, title:"Interview candidate — frontend", project:"Hiring", priority:"medium", due:"Thu",      done:false },
];

const ACTIVITY = [
  { id:1, color:"#6366f1", user:"Sarah K.", action:'completed task "Design system audit"',        time:"2m ago"  },
  { id:2, color:"#10b981", user:"James R.", action:"uploaded 3 files to Shared Docs",            time:"14m ago" },
  { id:3, color:"#f59e0b", user:"You",      action:'created a new project "Q3 Roadmap"',         time:"1h ago"  },
  { id:4, color:"#0ea5e9", user:"Marcus T.",action:'commented on "Brand Guidelines"',            time:"2h ago"  },
  { id:5, color:"#f43f5e", user:"⚠ Alert", action:'"Product launch prep" deadline tomorrow',     time:"3h ago"  },
];

const STATS = [
  { IconComp: Icon.Task,    label:"Tasks due today",  value:"4",  change:"↑ 1 from yesterday", color:"#6366f1", bg:"rgba(99,102,241,.12)"  },
  { IconComp: Icon.Folder,  label:"Active projects",  value:"7",  change:"2 completing soon",  color:"#10b981", bg:"rgba(16,185,129,.12)"  },
  { IconComp: Icon.Message, label:"Unread messages",  value:"12", change:"3 direct mentions",  color:"#0ea5e9", bg:"rgba(14,165,233,.12)"  },
  { IconComp: Icon.Users,   label:"Team online",      value:"5",  change:"of 9 members active",color:"#f59e0b", bg:"rgba(245,158,11,.12)"  },
];

const QUICK = [
  { IconComp: Icon.Task,    label:"New task",      color:"#6366f1" },
  { IconComp: Icon.Doc,     label:"New document",  color:"#10b981" },
  { IconComp: Icon.Message, label:"New message",   color:"#0ea5e9" },
  { IconComp: Icon.Video,   label:"Schedule call", color:"#f59e0b" },
];

function getInitials(str = "") { return str.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "?"; }

export default function DashboardPage() {
  const { profile } = useAuth();
  const { activeWs } = useWorkspace();
  const [tasks, setTasks] = useState(TASKS);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="page-scroll">
      <div className="dashboard-wrap">

        {/* ── Greeting ── */}
        <div className="dashboard-greeting">
          <h1>{greeting}, {profile?.name?.split(" ")[0] || "there"} 👋</h1>
          <p>{format(new Date(), "EEEE, MMMM d")} · {activeWs?.name || "Your"} workspace</p>
        </div>

        {/* ── Stats ── */}
        <div className="stats-row">
          {STATS.map(s => (
            <div key={s.label} className="stat-card" style={{"--card-color": s.color}}>
              <div className="stat-card-icon" style={{background: s.bg, color: s.color}}>
                <s.IconComp />
              </div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-change">
                <Icon.TrendUp /> {s.change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="dashboard-grid">
          <div style={{display:"flex", flexDirection:"column", gap:20}}>

            {/* Tasks panel */}
            <div className="dash-panel">
              <div className="dash-panel-head">
                <h3>My tasks today</h3>
                <button className="dash-panel-link">
                  View all <Icon.ArrowRight />
                </button>
              </div>
              <div className="task-list">
                {tasks.map(t => (
                  <div key={t.id} className="task-item" onClick={() => toggleTask(t.id)}>
                    <div className={`task-check ${t.done?"done":""}`}>
                      {t.done && <Icon.Check />}
                    </div>
                    <div className="task-info">
                      <div className={`task-title ${t.done?"done":""}`}>{t.title}</div>
                      <div className="task-meta">
                        <span style={{display:"flex", alignItems:"center", gap:4}}>
                          <Icon.Folder />{t.project}
                        </span>
                        <span style={{display:"flex", alignItems:"center", gap:4}}>
                          <Icon.Clock />Due {t.due}
                        </span>
                      </div>
                    </div>
                    <div className={`task-priority ${t.priority}`}>{t.priority}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="dash-panel">
              <div className="dash-panel-head"><h3>Quick actions</h3></div>
              <div className="quick-actions">
                {QUICK.map(q => (
                  <button key={q.label} className="quick-action-btn">
                    <div className="quick-action-icon" style={{color: q.color}}>
                      <q.IconComp />
                    </div>
                    <span className="quick-action-label">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="dash-panel" style={{alignSelf:"start"}}>
            <div className="dash-panel-head">
              <h3>Team activity</h3>
              <button className="dash-panel-link">All activity <Icon.ArrowRight /></button>
            </div>
            <div className="activity-list">
              {ACTIVITY.map(a => (
                <div key={a.id} className="activity-item">
                  <div className="activity-avatar" style={{background: a.color + "22", color: a.color}}>
                    {getInitials(a.user)}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="activity-text">
                      <b>{a.user}</b> {a.action}
                    </div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
