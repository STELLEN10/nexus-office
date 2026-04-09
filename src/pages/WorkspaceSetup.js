import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";

const PLANS = [
  { id:"free", name:"Free", price:"$0", sub:"/month",
    features:["Up to 5 members","5GB storage","Basic chat + tasks","Community support"], badge:null },
  { id:"pro", name:"Pro", price:"$12", sub:"/user/month",
    features:["Unlimited members","100GB storage","All features + AI","Priority support"], badge:"Most Popular" },
];

export default function WorkspaceSetup() {
  const { createWorkspace } = useWorkspace();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [wsName, setWsName] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!wsName.trim()) return;
    setLoading(true); setError("");
    try {
      await createWorkspace({ name: wsName.trim(), plan });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to create workspace. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="setup-wrap">
      <div className="setup-card">
        <div className="setup-step">
          {[0,1].map(i => (
            <div key={i} className={`setup-step-dot ${i < step?"done":i===step?"active":""}`}/>
          ))}
        </div>
        {step === 0 && (
          <>
            <h2 className="setup-title">Create your workspace</h2>
            <p className="setup-sub">Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! Let's set up your team's home.</p>
            <div className="setup-form">
              <div className="setup-field">
                <label className="setup-label">Workspace name</label>
                <input className="setup-input" type="text" placeholder="Acme Inc, My Team…"
                  value={wsName} onChange={e => setWsName(e.target.value)} autoFocus
                  onKeyDown={e => e.key==="Enter" && wsName.trim() && setStep(1)}/>
              </div>
              <button className="btn-primary" style={{marginTop:8}}
                onClick={() => wsName.trim() && setStep(1)} disabled={!wsName.trim()}>Continue →</button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="setup-title">Choose a plan</h2>
            <p className="setup-sub">Start free — upgrade anytime.</p>
            <div className="plan-grid" style={{marginBottom:20}}>
              {PLANS.map(p => (
                <div key={p.id} className={`plan-card ${plan===p.id?"selected":""}`} onClick={() => setPlan(p.id)}>
                  {p.badge && <div className="plan-badge">{p.badge}</div>}
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-price">{p.price}<span>{p.sub}</span></div>
                  {p.features.map(f => <div key={f} className="plan-feature">{f}</div>)}
                </div>
              ))}
            </div>
            {error && <div className="auth-error" style={{marginBottom:12}}>{error}</div>}
            <div style={{display:"flex",gap:10}}>
              <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn-primary" style={{flex:1}} onClick={handleCreate} disabled={loading}>
                {loading ? <div className="spinner" style={{margin:"0 auto"}}/> : "Create workspace →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
