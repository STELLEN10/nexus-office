import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot, addDoc,
  updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { formatDistanceToNow } from "date-fns";

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

const ICONS = ["📄","📝","📊","📋","📌","🗒️","📑","🗂️"];

/* ── Doc list item ── */
function DocItem({ doc: d, active, onClick, onDelete }) {
  const [menu, setMenu] = useState(false);
  const ts = d.updatedAt?.toDate ? d.updatedAt.toDate() : null;
  return (
    <div className={`doc-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="doc-item-icon">{d.icon || "📄"}</span>
      <div className="doc-item-info">
        <div className="doc-item-title">{d.title || "Untitled"}</div>
        {ts && <div className="doc-item-time">{formatDistanceToNow(ts, { addSuffix: true })}</div>}
      </div>
      <button className="doc-item-menu" onClick={e => { e.stopPropagation(); setMenu(m => !m); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>
        </svg>
      </button>
      {menu && (
        <div className="doc-item-dropdown" onClick={e => e.stopPropagation()}>
          <button onClick={() => { onDelete(); setMenu(false); }} className="dropdown-item danger">Delete</button>
        </div>
      )}
    </div>
  );
}

/* ── Toolbar button ── */
function TB({ title, active, onClick, children }) {
  return (
    <button className={`editor-tb-btn ${active ? "active" : ""}`} title={title} onMouseDown={e => { e.preventDefault(); onClick(); }}>
      {children}
    </button>
  );
}

/* ── Main ── */
export default function DocsPage() {
  const { user, profile } = useAuth();
  const { activeWs } = useWorkspace();
  const wsId = activeWs?.id;

  const [docs, setDocs]         = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [title, setTitle]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const editorRef               = useRef(null);
  const saveTimer               = useRef(null);

  /* Load docs */
  useEffect(() => {
    if (!wsId) return;
    const q = query(collection(db, "workspaces", wsId, "docs"), orderBy("updatedAt", "desc"));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocs(list);
    });
  }, [wsId]);

  /* Load doc content into editor */
  useEffect(() => {
    if (!activeDoc) return;
    setTitle(activeDoc.title || "");
    if (editorRef.current) {
      editorRef.current.innerHTML = activeDoc.content || "<p><br></p>";
    }
  }, [activeDoc?.id]); // eslint-disable-line

  /* Auto-save */
  const triggerSave = useCallback(() => {
    if (!activeDoc || !wsId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateDoc(doc(db, "workspaces", wsId, "docs", activeDoc.id), {
          title: title || "Untitled",
          content: editorRef.current?.innerHTML || "",
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
        setActiveDoc(d => d ? { ...d, title: title || "Untitled" } : d);
      } catch (e) { console.error(e); }
      finally { setSaving(false); }
    }, 1200);
  }, [activeDoc, wsId, title, user]);

  const createDoc = async () => {
    if (!wsId) return;
    const ref = await addDoc(collection(db, "workspaces", wsId, "docs"), {
      title:     "Untitled",
      content:   "<p><br></p>",
      icon:      ICONS[Math.floor(Math.random() * ICONS.length)],
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    const newDoc = { id: ref.id, title: "Untitled", content: "<p><br></p>", icon: "📄" };
    setActiveDoc(newDoc);
  };

  const deleteDoc_ = async (d) => {
    if (!window.confirm(`Delete "${d.title || "Untitled"}"?`)) return;
    await deleteDoc(doc(db, "workspaces", wsId, "docs", d.id));
    if (activeDoc?.id === d.id) setActiveDoc(null);
  };

  /* Rich text commands */
  const cmd = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    triggerSave();
  };

  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const filteredDocs = docs.filter(d =>
    !search || (d.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="docs-shell">
      {/* Sidebar */}
      <div className="docs-sidebar">
        <div className="docs-sidebar-head">
          <div className="docs-search-wrap">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-3)", flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input placeholder="Search docs…" value={search} onChange={e => setSearch(e.target.value)} className="docs-search-input" />
          </div>
          <button className="btn-primary btn-sm" onClick={createDoc} style={{ flexShrink: 0 }}>+ New</button>
        </div>
        <div className="docs-list">
          {filteredDocs.length === 0 && (
            <div style={{ padding: "24px 16px", color: "var(--text-3)", fontSize: 12, textAlign: "center" }}>
              {search ? "No results" : "No documents yet"}
            </div>
          )}
          {filteredDocs.map(d => (
            <DocItem key={d.id} doc={d} active={activeDoc?.id === d.id}
              onClick={() => setActiveDoc(d)}
              onDelete={() => deleteDoc_(d)} />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="docs-editor-area">
        {activeDoc ? (
          <>
            {/* Toolbar */}
            <div className="editor-toolbar">
              <div className="editor-tb-group">
                <TB title="Bold (Ctrl+B)"      active={isActive("bold")}      onClick={() => cmd("bold")}>
                  <strong style={{ fontSize: 13 }}>B</strong>
                </TB>
                <TB title="Italic (Ctrl+I)"    active={isActive("italic")}    onClick={() => cmd("italic")}>
                  <em style={{ fontSize: 13 }}>I</em>
                </TB>
                <TB title="Underline (Ctrl+U)" active={isActive("underline")} onClick={() => cmd("underline")}>
                  <span style={{ textDecoration: "underline", fontSize: 13 }}>U</span>
                </TB>
                <TB title="Strikethrough"      active={isActive("strikeThrough")} onClick={() => cmd("strikeThrough")}>
                  <span style={{ textDecoration: "line-through", fontSize: 13 }}>S</span>
                </TB>
              </div>
              <div className="editor-tb-divider" />
              <div className="editor-tb-group">
                <TB title="Heading 1" onClick={() => cmd("formatBlock", "H1")}>H1</TB>
                <TB title="Heading 2" onClick={() => cmd("formatBlock", "H2")}>H2</TB>
                <TB title="Heading 3" onClick={() => cmd("formatBlock", "H3")}>H3</TB>
                <TB title="Paragraph" onClick={() => cmd("formatBlock", "P")}>¶</TB>
              </div>
              <div className="editor-tb-divider" />
              <div className="editor-tb-group">
                <TB title="Bullet list"   active={isActive("insertUnorderedList")} onClick={() => cmd("insertUnorderedList")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="4" cy="6" r="2" fill="currentColor"/><path d="M10 6h11M10 12h11M10 18h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="4" cy="12" r="2" fill="currentColor"/><circle cx="4" cy="18" r="2" fill="currentColor"/></svg>
                </TB>
                <TB title="Numbered list" active={isActive("insertOrderedList")}   onClick={() => cmd("insertOrderedList")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M10 6h11M10 12h11M10 18h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 7V4l-1.5 1M4 13H2.5l1.5-1.5c.5-.5.5-1.5-.5-1.5S2 11 2 11M3 17v2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </TB>
                <TB title="Blockquote" onClick={() => cmd("formatBlock", "BLOCKQUOTE")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" stroke="currentColor" strokeWidth="1.6"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" stroke="currentColor" strokeWidth="1.6"/></svg>
                </TB>
              </div>
              <div className="editor-tb-divider" />
              <div className="editor-tb-group">
                <TB title="Align left"   onClick={() => cmd("justifyLeft")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h12M3 18h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </TB>
                <TB title="Align center" onClick={() => cmd("justifyCenter")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M6 12h12M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </TB>
              </div>
              <div style={{ flex: 1 }} />
              <div className="editor-save-status">
                {saving ? (
                  <><div className="spinner" style={{ width: 12, height: 12 }} /> Saving…</>
                ) : (
                  <><span style={{ color: "var(--emerald)" }}>●</span> Saved</>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="editor-title-wrap">
              <input
                className="editor-title"
                value={title}
                placeholder="Untitled"
                onChange={e => { setTitle(e.target.value); triggerSave(); }}
              />
              <div className="editor-meta">
                <div className="editor-meta-avatar" title={profile?.name}>
                  {getInitials(profile?.name)}
                </div>
                <span>Edited by you</span>
              </div>
            </div>

            {/* Content */}
            <div
              ref={editorRef}
              className="editor-content"
              contentEditable
              suppressContentEditableWarning
              onInput={triggerSave}
              onKeyDown={triggerSave}
            />
          </>
        ) : (
          <div className="docs-empty">
            <div className="docs-empty-icon">📝</div>
            <h3>Select a document</h3>
            <p>Choose a document from the sidebar or create a new one.</p>
            <button className="btn-primary" onClick={createDoc}>Create document</button>
          </div>
        )}
      </div>
    </div>
  );
}
