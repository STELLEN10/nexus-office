import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";
import MainLayout from "./components/layout/MainLayout";
import AuthPage from "./pages/AuthPage";
import WorkspaceSetup from "./pages/WorkspaceSetup";
import DashboardPage from "./pages/DashboardPage";

const ComingSoon = ({ name }) => (
  <div style={{
    flex:1, display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", gap:12, color:"var(--text-2)",
    height:"100%", padding:40
  }}>
    <div style={{
      width:64, height:64, borderRadius:16,
      background:"var(--accent-bg)", border:"1.5px solid var(--accent-bd)",
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:28
    }}>
      🚧
    </div>
    <h2 style={{fontSize:20, fontWeight:700, color:"var(--text)", letterSpacing:"-.02em"}}>{name}</h2>
    <p style={{fontSize:14, color:"var(--text-2)", textAlign:"center", maxWidth:300}}>
      This module is coming soon. The foundation is ready — features are being built on top.
    </p>
    <div style={{
      background:"var(--accent-bg)", border:"1px solid var(--accent-bd)",
      borderRadius:20, padding:"4px 14px",
      fontSize:12, fontWeight:700, color:"var(--accent-2)", letterSpacing:".04em"
    }}>
      IN DEVELOPMENT
    </div>
  </div>
);

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="splash">
      <div className="splash-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      </div>
      <span>Nexus Office</span>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace/>;
  return children;
}

function WorkspaceGuard({ children }) {
  const { workspaces, loading } = useWorkspace();
  if (loading) return null;
  if (workspaces.length === 0) return <Navigate to="/setup" replace/>;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage/>}/>
      <Route path="/setup" element={<Guard><WorkspaceSetup/></Guard>}/>
      <Route element={<Guard><WorkspaceGuard><MainLayout/></WorkspaceGuard></Guard>}>
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/chat"      element={<ComingSoon name="Messages"/>}/>
        <Route path="/tasks"     element={<ComingSoon name="Tasks & Projects"/>}/>
        <Route path="/docs"      element={<ComingSoon name="Documents"/>}/>
        <Route path="/projects"  element={<ComingSoon name="Projects"/>}/>
        <Route path="/calls"     element={<ComingSoon name="Video Calls"/>}/>
        <Route path="/email"     element={<ComingSoon name="Email"/>}/>
        <Route path="/settings"  element={<ComingSoon name="Settings"/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <AppRoutes/>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
