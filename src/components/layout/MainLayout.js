import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";

// ── All icons as inline SVG ───────────────────────────────────
const Icons = {
  Dashboard: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Messages:  () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5V10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  Tasks:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2.5 2.5 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Docs:      () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 1.5H4a1 1 0 00-1 1v11a1 1 0 001 1h8a1 1 0 001-1V5.5L10 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 1.5V5.5H14M5.5 8.5h5M5.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Projects:  () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 12.5a1.5 1.5 0 01-1.5 1.5H3.5A1.5 1.5 0 012 12.5V4a1.5 1.5 0 011.5-1.5h3l1.5 2h4A1.5 1.5 0 0113.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 8.5H8M11 6l3 2.5L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calls:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 7l4-2.5v7l-4-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  Email:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 5.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Settings:  () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Bell:      () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 00-4.5 4.5c0 4.5-2 5.5-2 5.5h13s-2-1-2-5.5A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9.3 13.5a1.5 1.5 0 01-2.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Search:    () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Help:      () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 6a2 2 0 114 0c0 1.5-2 2-2 3M8 11.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Logout:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Plus:      () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Office:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/><path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
};

const NAV = [
  { id:"dashboard", label:"Dashboard", path:"/dashboard", Icon: Icons.Dashboard },
  { id:"chat",      label:"Messages",  path:"/chat",      Icon: Icons.Messages,  badge:3 },
  { id:"tasks",     label:"Tasks",     path:"/tasks",     Icon: Icons.Tasks },
  { id:"docs",      label:"Documents", path:"/docs",      Icon: Icons.Docs },
  { id:"projects",  label:"Projects",  path:"/projects",  Icon: Icons.Projects },
  { id:"calls",     label:"Calls",     path:"/calls",     Icon: Icons.Calls },
  { id:"email",     label:"Email",     path:"/email",     Icon: Icons.Email, badge:5 },
];

const BOTTOM_NAV = [
  { id:"settings", label:"Settings", path:"/settings", Icon: Icons.Settings },
];

function getInitials(name = "") { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?"; }

export default function MainLayout() {
  const { profile, logout } = useAuth();
  const { workspaces, activeWs, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const is = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const currentPage = NAV.find(n => is(n.path)) || BOTTOM_NAV.find(n => is(n.path));

  return (
    <div className="shell">

      {/* ── Workspace rail ── */}
      <div className="workspace-rail">
        <div className="ws-logo"><Icons.Office /></div>

        {workspaces.map(ws => (
          <div key={ws.id} className={`ws-avatar ${activeWs?.id===ws.id?"active":""}`}
            onClick={() => switchWorkspace(ws)} title={ws.name}>
            {getInitials(ws.name)}
          </div>
        ))}

        <div className="ws-add" title="New workspace" onClick={() => navigate("/setup")}>
          <Icons.Plus />
        </div>

        <div className="ws-rail-bottom">
          <button className="ws-rail-btn" onClick={logout} title="Sign out">
            <Icons.Logout />
          </button>
          <div className="ws-user-avatar" title={profile?.name} onClick={() => navigate("/settings")}>
            {getInitials(profile?.name)}
          </div>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-workspace">
          <span className="sidebar-workspace-name">{activeWs?.name || "Nexus Office"}</span>
          <span className="sidebar-workspace-plan">{activeWs?.plan || "free"}</span>
        </div>

        <div className="sidebar-section">Main</div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button key={item.id} className={`nav-item ${is(item.path)?"active":""}`}
              onClick={() => navigate(item.path)}>
              <span className="nav-icon"><item.Icon /></span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section" style={{paddingLeft:0}}>More</div>
          {BOTTOM_NAV.map(item => (
            <button key={item.id} className={`nav-item ${is(item.path)?"active":""}`}
              onClick={() => navigate(item.path)}>
              <span className="nav-icon"><item.Icon /></span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        <div className="topbar">
          <h2 className="topbar-title">{currentPage?.label || "Nexus Office"}</h2>

          <div className="topbar-search">
            <Icons.Search />
            <input placeholder="Search everything…" />
            <span className="topbar-search-kbd">⌘K</span>
          </div>

          <button className="topbar-btn" title="Notifications">
            <Icons.Bell />
            <span className="topbar-badge" />
          </button>

          <button className="topbar-btn" title="Help">
            <Icons.Help />
          </button>

          <div className="topbar-user" onClick={() => navigate("/settings")}>
            <div className="topbar-user-avatar">{getInitials(profile?.name)}</div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{profile?.name || "You"}</span>
              <span className="topbar-user-ws">{activeWs?.name}</span>
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
