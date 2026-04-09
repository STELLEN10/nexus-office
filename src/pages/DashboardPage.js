import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { format } from "date-fns";

const TASKS = [
  { id:1, title:"Review Q2 design proposals",    project:"Design", priority:"high",   due:"Today",     done:false },
  { id:2, title:"Update API documentation",       project:"Docs",   priority:"medium", due:"Tomorrow",  done:false },
  { id:3, title:"Set up staging environment",     project:"Dev",    priority:"high",   due:"Today",     done:false },
  { id:4, title:"Send weekly status report",      project:"Admin",  priority:"low",    due:"Fri",       done:true  },
  { id:5, title:"Interview candidate — frontend", project:"Hiring", priority:"medium", due:"Thu",       done:false },
];

const ACTIVITY = [
  { id:1, color:"#6366f1", text:<><b>Sarah K.</b> completed task "Design system audit"</>,           time:"2m ago"  },
  { id:2, color:"#10b981", text:<><b>James R.</b> uploaded 3 files to Shared Docs</>,                time:"14m ago" },
  { id:3, color:"#f59e0b", text:<><b>You</b> created a new project "Q3 Roadmap"</>,                  time:"1h ago"  },
  { id:4, color:"#0ea5e9", text:<><b>Marcus T.</b> left a comment on "Brand Guidelines"</>,          time:"2h ago"  },
  { id:5, color:"#f43f5e", text:<><b>Deadline approaching:</b> "Product launch prep" due tomorrow</>, time:"3h ago"  },
];

const STATS = [
  { icon:"✅", label:"Tasks due today",  value:"4",  change:"+1 from yesterday",  dir:"neutral", color:"#6366f1", bg:"rgba(99,102,241,.1)"  },
  { icon:"📁", label:"Active projects",  value:"7",  change:"2 completing soon",  dir:"neutral", color:"#10b981", bg:"rgba(16,185,129,.1)"  },
  { icon:"💬", label:"Unread messages",  value:"12", change:"3 direct mentions",  dir:"neutral", color:"#0ea5e9", bg:"rgba(14,165,233,.1)"  },
  { icon:"👥", label:"Team online now",  value:"5",  change:"of 9 members",       dir:"up",      color:"#f59e0b", bg:"rgba(245,158,11,.1)"  },
];

const QUICK = [
  { icon:"✏️",  label:"New task"      },
  { icon:"📄",  label:"New document"  },
  { icon:"💬",  label:"New message"   },
  { icon:"📅",  label:"Schedule call" },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const { activeWs } = useWorkspace();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="page-scroll">
      <div className="dashboard-wrap">

        {/* Greeting */}
        <div className="dashboard-greeting">
          <h1>{greeting}, {profile?.name?.split(" ")[0] || "there"} 👋</h1>
          <p>{format(new Date(), "EEEE, MMMM d")} · {activeWs?.name} workspace</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {STATS.map(s => (
            <div key={s.label} className="stat-card" style={{"--card-color": s.color, "--card-bg": s.bg}}>
              <div className="stat-card-icon" style={{background: s.bg}}>
                <span style={{fontSize:16}}>{s.icon}</span>
              </div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className={`stat-card-change ${s.dir}`}>
                {s.dir === "up" ? "↑" : "•"} {s.change}
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="dashboard-grid">

          {/* Left column */}
          <div style={{display:"flex", flexDirection:"column", gap:20}}>

            {/* Tasks */}
            <div className="dash-panel">
              <div className="dash-panel-head">
                <h3>My tasks today</h3>
                <button className="dash-panel-link">View all →</button>
              </div>
              <div className="task-list">
                {TASKS.map(t => (
                  <div key={t.id} className="task-item">
                    <div className={`task-check ${t.done?"done":""}`}/>
                    <div className="task-info">
                      <div className={`task-title ${t.done?"done":""}`}>{t.title}</div>
                      <div className="task-meta">
                        <span>{t.project}</span>
                        <span>Due {t.due}</span>
                      </div>
                    </div>
                    <div className={`task-priority ${t.priority}`}>{t.priority}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="dash-panel">
              <div className="dash-panel-head">
                <h3>Quick actions</h3>
              </div>
              <div className="quick-actions">
                {QUICK.map(q => (
                  <button key={q.label} className="quick-action-btn">
                    <span className="quick-action-icon">{q.icon}</span>
                    <span className="quick-action-label">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — Activity */}
          <div className="dash-panel" style={{alignSelf:"start"}}>
            <div className="dash-panel-head">
              <h3>Team activity</h3>
              <button className="dash-panel-link">All activity →</button>
            </div>
            <div className="activity-list">
              {ACTIVITY.map(a => (
                <div key={a.id} className="activity-item">
                  <div className="activity-dot" style={{background: a.color}}/>
                  <div>
                    <div className="activity-text">{a.text}</div>
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
