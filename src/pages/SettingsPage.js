import { useState } from "react";
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { auth } from "../firebase";

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{title}</h2>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="settings-field">
      <div className="settings-field-label">
        <span>{label}</span>
        {hint && <span className="settings-field-hint">{hint}</span>}
      </div>
      <div className="settings-field-control">{children}</div>
    </div>
  );
}

function Toast({ msg, type = "success" }) {
  return msg ? (
    <div className={`settings-toast ${type}`}>{msg}</div>
  ) : null;
}

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

const AVATAR_COLORS = ["#6366f1","#10b981","#f59e0b","#0ea5e9","#f43f5e","#8b5cf6","#ec4899","#14b8a6","#f97316"];

export default function SettingsPage() {
  const { user, profile, updateUserProfile, logout } = useAuth();
  const { activeWs, workspaces } = useWorkspace();

  const [tab, setTab] = useState("profile");

  /* Profile */
  const [name, setName]   = useState(profile?.name || "");
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor || AVATAR_COLORS[0]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  /* Security */
  const [curPass, setCurPass]   = useState("");
  const [newPass, setNewPass]   = useState("");
  const [confPass, setConfPass] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg]   = useState(null);

  /* Appearance */
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "dark");

  const applyTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "");
    localStorage.setItem("nexus-theme", t);
  };

  const saveProfile = async () => {
    if (!name.trim()) return;
    setProfileSaving(true);
    try {
      await updateUserProfile({ name: name.trim(), avatarColor });
      setProfileMsg({ type: "success", text: "Profile updated!" });
    } catch (e) {
      setProfileMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const changePassword = async () => {
    if (newPass !== confPass) { setPassMsg({ type: "error", text: "Passwords don't match." }); return; }
    if (newPass.length < 6)   { setPassMsg({ type: "error", text: "Password must be 6+ characters." }); return; }
    setPassSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, curPass);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPass);
      setCurPass(""); setNewPass(""); setConfPass("");
      setPassMsg({ type: "success", text: "Password changed successfully!" });
    } catch (e) {
      const msgs = {
        "auth/wrong-password": "Current password is incorrect.",
        "auth/too-many-requests": "Too many attempts. Try later.",
      };
      setPassMsg({ type: "error", text: msgs[e.code] || "Failed to change password." });
    } finally {
      setPassSaving(false);
      setTimeout(() => setPassMsg(null), 4000);
    }
  };

  const TABS = [
    { id: "profile",    label: "Profile" },
    { id: "workspace",  label: "Workspace" },
    { id: "appearance", label: "Appearance" },
    { id: "security",   label: "Security" },
  ];

  return (
    <div className="page-scroll">
      <div className="settings-wrap">
        <div className="settings-layout">

          {/* Sidebar nav */}
          <nav className="settings-nav">
            {TABS.map(t => (
              <button key={t.id} className={`settings-nav-item ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button className="settings-nav-item danger" onClick={logout}>Sign out</button>
          </nav>

          {/* Content */}
          <div className="settings-content">

            {tab === "profile" && (
              <>
                <h1 className="settings-page-title">Profile</h1>
                <Section title="Your identity">
                  <div className="settings-avatar-row">
                    <div className="settings-avatar" style={{ background: avatarColor + "22", color: avatarColor, border: `2px solid ${avatarColor}44` }}>
                      {getInitials(name || profile?.name)}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>Choose your avatar colour</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {AVATAR_COLORS.map(c => (
                          <div key={c} onClick={() => setAvatarColor(c)} style={{
                            width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer",
                            border: avatarColor === c ? "3px solid var(--text)" : "3px solid transparent",
                            transition: "border .12s",
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Field label="Full name">
                    <input className="tform-input" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" />
                  </Field>
                  <Field label="Email" hint="Cannot be changed here">
                    <input className="tform-input" value={user?.email || ""} disabled style={{ opacity: .6 }} />
                  </Field>
                  {profileMsg && <Toast msg={profileMsg.text} type={profileMsg.type} />}
                  <button className="btn-primary" style={{ marginTop: 4 }} onClick={saveProfile} disabled={profileSaving || !name.trim()}>
                    {profileSaving ? <div className="spinner" style={{ width: 14, height: 14, margin: "0 auto" }} /> : "Save profile"}
                  </button>
                </Section>
              </>
            )}

            {tab === "workspace" && (
              <>
                <h1 className="settings-page-title">Workspace</h1>
                <Section title="Your workspaces">
                  {workspaces.map(ws => (
                    <div key={ws.id} className="ws-settings-row">
                      <div className="ws-settings-avatar">{getInitials(ws.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{ws.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                          {ws.plan === "pro" ? "Pro plan" : "Free plan"} · {ws.members?.length || 1} member{ws.members?.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <span className={`plan-pill ${ws.plan}`}>{ws.plan}</span>
                      {activeWs?.id === ws.id && (
                        <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 700 }}>● Active</span>
                      )}
                    </div>
                  ))}
                </Section>
                <Section title="Members">
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                    Invite members by sharing your workspace ID with them: <br />
                    <code style={{ fontFamily: "var(--mono)", fontSize: 12, background: "var(--bg-2)", padding: "2px 8px", borderRadius: 4, color: "var(--accent-2)" }}>
                      {activeWs?.id}
                    </code>
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
                    Full invite system coming soon.
                  </p>
                </Section>
              </>
            )}

            {tab === "appearance" && (
              <>
                <h1 className="settings-page-title">Appearance</h1>
                <Section title="Theme">
                  <div className="theme-options">
                    {[
                      { id: "dark",  label: "Dark",  desc: "Easy on the eyes" },
                      { id: "light", label: "Light", desc: "Classic bright look" },
                    ].map(t => (
                      <div key={t.id} className={`theme-option ${theme === t.id ? "selected" : ""}`}
                        onClick={() => applyTheme(t.id)}>
                        <div className={`theme-preview ${t.id}`}>
                          <div className="tp-sidebar" />
                          <div className="tp-content">
                            <div className="tp-bar" />
                            <div className="tp-bar short" />
                            <div className="tp-bar shorter" />
                          </div>
                        </div>
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {tab === "security" && (
              <>
                <h1 className="settings-page-title">Security</h1>
                <Section title="Change password">
                  <Field label="Current password">
                    <input className="tform-input" type="password" value={curPass}
                      onChange={e => setCurPass(e.target.value)} placeholder="••••••••" />
                  </Field>
                  <Field label="New password">
                    <input className="tform-input" type="password" value={newPass}
                      onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" />
                  </Field>
                  <Field label="Confirm new password">
                    <input className="tform-input" type="password" value={confPass}
                      onChange={e => setConfPass(e.target.value)} placeholder="Repeat new password" />
                  </Field>
                  {passMsg && <Toast msg={passMsg.text} type={passMsg.type} />}
                  <button className="btn-primary" style={{ marginTop: 4 }}
                    disabled={!curPass || !newPass || !confPass || passSaving}
                    onClick={changePassword}>
                    {passSaving ? <div className="spinner" style={{ width: 14, height: 14, margin: "0 auto" }} /> : "Change password"}
                  </button>
                </Section>
                <Section title="Danger zone">
                  <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>
                    Sign out of all sessions on this device.
                  </p>
                  <button className="btn-danger" onClick={logout}>Sign out</button>
                </Section>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
