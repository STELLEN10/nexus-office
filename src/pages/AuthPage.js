import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const friendly = (code) => ({
    "auth/email-already-in-use": "Email already registered.",
    "auth/invalid-credential":   "Invalid email or password.",
    "auth/weak-password":        "Password needs 6+ characters.",
    "auth/too-many-requests":    "Too many attempts. Try later.",
  })[code] || "Something went wrong.";

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else {
        if (!form.name.trim()) { setError("Name is required."); setLoading(false); return; }
        await register(form.name.trim(), form.email, form.password);
      }
    } catch (err) { setError(friendly(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="auth-logo-text">Nexus Office</div>
            <div className="auth-logo-sub">Your whole team. One place.</div>
          </div>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
          <button className={`auth-tab ${mode==="register"?"active":""}`} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-field">
              <label className="auth-label">Full name</label>
              <input className="auth-input" type="text" placeholder="Your name"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} required autoFocus/>
            </div>
          )}
          <div className="auth-field">
            <label className="auth-label">Work email</label>
            <input className="auth-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6}/>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <div className="spinner" style={{margin:"0 auto"}}/> :
              mode === "login" ? "Sign in to Nexus Office" : "Create your account"}
          </button>
        </form>
      </div>
    </div>
  );
}
