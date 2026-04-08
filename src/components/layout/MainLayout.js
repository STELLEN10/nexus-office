import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";

const NAV = [
  { id:"dashboard", label:"Dashboard", path:"/dashboard", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
  )},
  { id:"chat", label:"Messages", path:"/chat", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ), badge:3},
  { id:"tasks", label:"Tasks", path:"/tasks", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { id:"docs", label:"Documents", path:"/docs", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  )},
  { id:"projects", label:"Projects", path:"/projects", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { id:"calls", label:"Calls", path:"/calls", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.309a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { id:"email", label:"Email", path:"/email", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ), badge: 5},
];

const BOTTOM_NAV = [
  { id:"settings", label:"Settings", path:"/settings", icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>
  )},
];

function getInitials(name = "") { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?"; }

export default function MainLayout() {
  const { profile, logout } = useAuth();
  const { workspaces, activeWs, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const is = (path) => location.pathname.startsWith(path);

  // silence unused warning
  void useState;

  return (
    <div className="shell">
      {/* Workspace rail */}
      <div className="workspace-rail">
        <div className="ws-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </div>

        {workspaces.map(ws => (
          <div
            key={ws.id}
            className={`ws-avatar ${activeWs?.id === ws.id ? "active" : ""}`}
            onClick={() => switchWorkspace(ws)}
            title={ws.name}
          >
            {getInitials(ws.name)}
          </div>
        ))}

        <div className="ws-add" title="Add workspace" onClick={() => navigate("/setup")}>+</div>

        <div className="ws-rail-bottom">
          <button className="ws-rail-btn" onClick={logout} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--accent-bg)", border: "1.5px solid var(--accent-bd)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "var(--accent-2)", cursor:"pointer"
          }} title={profile?.name}>
            {getInitials(profile?.name)}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-workspace">
          <span className="sidebar-workspace-name">{activeWs?.name || "Nexus Office"}</span>
          <span className="sidebar-workspace-plan">{activeWs?.plan || "free"}</span>
        </div>

        <div className="sidebar-section">Main</div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${is(item.path) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section" style={{paddingLeft:0}}>More</div>
          {BOTTOM_NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${is(item.path) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="main-area">
        <div className="topbar">
          <h2 className="topbar-title">
            {NAV.find(n => is(n.path))?.label || "Nexus Office"}
          </h2>
          <div className="topbar-search">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{color:"var(--text-3)",flexShrink:0}}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input placeholder="Search everything…"/>
          </div>
          <button className="topbar-btn" title="Notifications">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="topbar-badge"/>
          </button>
          <button className="topbar-btn" title="Help">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <Outlet/>
      </div>
    </div>
  );
}
