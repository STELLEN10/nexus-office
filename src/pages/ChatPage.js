import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp, doc, setDoc, getDoc,
  getDocs, where, updateDoc, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

/* ── Helpers ── */
function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function formatMsgTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
  return format(d, "MMM d, h:mm a");
}

function formatSectionDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

const AVATAR_COLORS = [
  "#6366f1","#10b981","#f59e0b","#0ea5e9","#f43f5e",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4"
];
function avatarColor(uid = "") {
  let n = 0;
  for (let i = 0; i < uid.length; i++) n += uid.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

/* ── Sub-components ── */
function Avatar({ name, uid, size = 32, style = {} }) {
  const color = avatarColor(uid || name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "22", border: `1.5px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color,
      flexShrink: 0, ...style
    }}>
      {getInitials(name)}
    </div>
  );
}

function ChannelItem({ ch, active, unread, onClick }) {
  return (
    <button className={`ch-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="ch-hash">#</span>
      <span className="ch-name">{ch.name}</span>
      {unread > 0 && <span className="ch-badge">{unread > 99 ? "99+" : unread}</span>}
    </button>
  );
}

function DmItem({ dm, active, unread, currentUid, onClick }) {
  const other = dm.memberNames?.find((_, i) => dm.members[i] !== currentUid) || "Unknown";
  const otherUid = dm.members?.find(id => id !== currentUid) || "";
  return (
    <button className={`ch-item ${active ? "active" : ""}`} onClick={onClick}>
      <Avatar name={other} uid={otherUid} size={22} style={{ flexShrink: 0 }} />
      <span className="ch-name" style={{ marginLeft: 8 }}>{other}</span>
      {unread > 0 && <span className="ch-badge">{unread}</span>}
    </button>
  );
}

function MessageBubble({ msg, isOwn, showAvatar, prevSameSender }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`msg-row ${isOwn ? "own" : ""} ${prevSameSender ? "compact" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isOwn && (
        <div className="msg-avatar-col">
          {showAvatar
            ? <Avatar name={msg.senderName} uid={msg.senderId} size={32} />
            : <div style={{ width: 32 }} />}
        </div>
      )}
      <div className="msg-content">
        {showAvatar && !isOwn && (
          <div className="msg-meta">
            <span className="msg-sender">{msg.senderName}</span>
            <span className="msg-time">{formatMsgTime(msg.createdAt)}</span>
          </div>
        )}
        <div className={`msg-bubble ${isOwn ? "own" : ""}`}>
          {msg.text}
        </div>
        {hovered && (
          <div className="msg-time-float">{formatMsgTime(msg.createdAt)}</div>
        )}
      </div>
    </div>
  );
}

function DateDivider({ label }) {
  return (
    <div className="date-divider">
      <div className="date-divider-line" />
      <span>{label}</span>
      <div className="date-divider-line" />
    </div>
  );
}

/* ── New Channel Modal ── */
function NewChannelModal({ wsId, currentUid, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const ref = await addDoc(collection(db, "workspaces", wsId, "channels"), {
        name: slug,
        createdBy: currentUid,
        createdAt: serverTimestamp(),
        members: [currentUid],
      });
      onCreated({ id: ref.id, name: slug });
      onClose();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">New channel</h3>
        <p className="modal-sub">Channel names are lowercase with dashes.</p>
        <div className="modal-field">
          <span className="modal-hash">#</span>
          <input
            className="modal-input"
            autoFocus
            placeholder="e.g. design-feedback"
            value={name}
            onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!name.trim() || loading} onClick={handleCreate}>
            {loading ? <div className="spinner" style={{ margin: "0 auto", width: 16, height: 16 }} /> : "Create channel"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New DM Modal ── */
function NewDmModal({ wsId, currentUid, currentProfile, onClose, onCreated }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "office_users"));
      setMembers(snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.uid !== currentUid));
      setLoading(false);
    };
    load();
  }, [currentUid]);

  const startDm = async (other) => {
    setCreating(true);
    try {
      const ids = [currentUid, other.uid].sort();
      const dmId = `dm_${ids.join("_")}`;
      const ref = doc(db, "workspaces", wsId, "dms", dmId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          members: ids,
          memberNames: ids.map(id => id === currentUid ? currentProfile?.name : other.name),
          createdAt: serverTimestamp(),
        });
      }
      onCreated({ id: dmId, members: ids, memberNames: ids.map(id => id === currentUid ? currentProfile?.name : other.name) });
      onClose();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">New direct message</h3>
        <p className="modal-sub">Select a team member to message.</p>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="dm-member-list">
            {members.length === 0 && (
              <p style={{ color: "var(--text-3)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
                No other users found. Invite teammates to get started.
              </p>
            )}
            {members.map(m => (
              <button key={m.uid} className="dm-member-item" onClick={() => startDm(m)} disabled={creating}>
                <Avatar name={m.name} uid={m.uid} size={34} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{m.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ChatPage ── */
export default function ChatPage() {
  const { user, profile } = useAuth();
  const { activeWs } = useWorkspace();

  const [channels, setChannels] = useState([]);
  const [dms, setDms] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null); // { type: 'channel'|'dm', id, name }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const wsId = activeWs?.id;

  /* Load channels */
  useEffect(() => {
    if (!wsId) return;
    const q = query(collection(db, "workspaces", wsId, "channels"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChannels(list);
      if (!activeConvo && list.length > 0) {
        setActiveConvo({ type: "channel", id: list[0].id, name: list[0].name });
      }
    });
    return unsub;
  // eslint-disable-next-line
  }, [wsId]);

  /* Load DMs */
  useEffect(() => {
    if (!wsId || !user) return;
    const q = query(
      collection(db, "workspaces", wsId, "dms"),
      where("members", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      setDms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [wsId, user]);

  /* Load messages for active convo */
  useEffect(() => {
    if (!wsId || !activeConvo) return;
    setMessages([]);
    const col = activeConvo.type === "channel"
      ? collection(db, "workspaces", wsId, "channels", activeConvo.id, "messages")
      : collection(db, "workspaces", wsId, "dms", activeConvo.id, "messages");
    const q = query(col, orderBy("createdAt", "asc"), limit(100));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [wsId, activeConvo]);

  /* Scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!text.trim() || sending || !wsId || !activeConvo) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      const col = activeConvo.type === "channel"
        ? collection(db, "workspaces", wsId, "channels", activeConvo.id, "messages")
        : collection(db, "workspaces", wsId, "dms", activeConvo.id, "messages");
      await addDoc(col, {
        text: content,
        senderId: user.uid,
        senderName: profile?.name || user.displayName || "Unknown",
        createdAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); setText(content); }
    finally { setSending(false); inputRef.current?.focus(); }
  }, [text, sending, wsId, activeConvo, user, profile]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* Group messages by date + consecutive sender */
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const ts = msg.createdAt;
    const dateLabel = ts ? formatSectionDate(ts) : null;
    if (dateLabel && dateLabel !== lastDate) {
      grouped.push({ type: "divider", label: dateLabel });
      lastDate = dateLabel;
    }
    const prev = messages[i - 1];
    const prevSame = prev && prev.senderId === msg.senderId &&
      ts && prev.createdAt &&
      (ts.toDate ? ts.toDate() : new Date(ts)) - (prev.createdAt.toDate ? prev.createdAt.toDate() : new Date(prev.createdAt)) < 5 * 60 * 1000;
    grouped.push({ type: "msg", msg, prevSame });
  });

  const convoName = activeConvo
    ? activeConvo.type === "channel"
      ? "#" + activeConvo.name
      : activeConvo.name
    : "";

  /* Create default general channel if none exist */
  const ensureGeneralChannel = async () => {
    if (!wsId || channels.length > 0) return;
    await addDoc(collection(db, "workspaces", wsId, "channels"), {
      name: "general",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      members: [user.uid],
    });
  };

  useEffect(() => { ensureGeneralChannel(); }, [wsId, channels.length]); // eslint-disable-line

  return (
    <div className="chat-shell">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-section">
          <div className="chat-sidebar-label">
            <span>Channels</span>
            <button className="chat-sidebar-add" title="New channel" onClick={() => setShowNewChannel(true)}>+</button>
          </div>
          {channels.map(ch => (
            <ChannelItem
              key={ch.id}
              ch={ch}
              active={activeConvo?.id === ch.id}
              unread={0}
              onClick={() => setActiveConvo({ type: "channel", id: ch.id, name: ch.name })}
            />
          ))}
          {channels.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-3)", padding: "4px 10px" }}>No channels yet</p>
          )}
        </div>

        <div className="chat-sidebar-section">
          <div className="chat-sidebar-label">
            <span>Direct Messages</span>
            <button className="chat-sidebar-add" title="New DM" onClick={() => setShowNewDm(true)}>+</button>
          </div>
          {dms.map(dm => (
            <DmItem
              key={dm.id}
              dm={dm}
              active={activeConvo?.id === dm.id}
              unread={0}
              currentUid={user.uid}
              onClick={() => {
                const otherName = dm.memberNames?.find((_, i) => dm.members[i] !== user.uid) || "DM";
                setActiveConvo({ type: "dm", id: dm.id, name: otherName });
              }}
            />
          ))}
          {dms.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-3)", padding: "4px 10px" }}>No DMs yet</p>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="chat-main">
        {activeConvo ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <span className="chat-header-name">
                  {activeConvo.type === "channel" ? (
                    <><span style={{ color: "var(--text-3)", marginRight: 2 }}>#</span>{activeConvo.name}</>
                  ) : activeConvo.name}
                </span>
                {activeConvo.type === "channel" && (
                  <span className="chat-header-sub">
                    {channels.find(c => c.id === activeConvo.id)?.description || "Team channel"}
                  </span>
                )}
              </div>
              <div className="chat-header-actions">
                <button className="topbar-btn" title="Search in channel">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className={`topbar-btn ${membersOpen ? "active" : ""}`}
                  title="Members"
                  onClick={() => setMembersOpen(o => !o)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">
                  <div className="chat-empty-icon">
                    {activeConvo.type === "channel" ? "💬" : "✉️"}
                  </div>
                  <h3>
                    {activeConvo.type === "channel"
                      ? `Welcome to #${activeConvo.name}`
                      : `Your DM with ${activeConvo.name}`}
                  </h3>
                  <p>
                    {activeConvo.type === "channel"
                      ? "This is the start of the channel. Say hello!"
                      : "Send a message to start the conversation."}
                  </p>
                </div>
              )}
              {grouped.map((item, i) =>
                item.type === "divider"
                  ? <DateDivider key={`div-${i}`} label={item.label} />
                  : <MessageBubble
                      key={item.msg.id}
                      msg={item.msg}
                      isOwn={item.msg.senderId === user.uid}
                      showAvatar={!item.prevSame}
                      prevSameSender={item.prevSame}
                    />
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-input-wrap">
              <div className="chat-input-box">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder={`Message ${convoName}`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <div className="chat-input-actions">
                  <button
                    className="chat-send-btn"
                    disabled={!text.trim() || sending}
                    onClick={sendMessage}
                    title="Send (Enter)"
                  >
                    {sending
                      ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                  </button>
                </div>
              </div>
              <p className="chat-input-hint">Enter to send · Shift+Enter for newline</p>
            </div>
          </>
        ) : (
          <div className="chat-empty" style={{ height: "100%" }}>
            <div className="chat-empty-icon">💬</div>
            <h3>Select a channel or DM</h3>
            <p>Pick a conversation from the sidebar to get started.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewChannel && (
        <NewChannelModal
          wsId={wsId}
          currentUid={user.uid}
          onClose={() => setShowNewChannel(false)}
          onCreated={ch => setActiveConvo({ type: "channel", id: ch.id, name: ch.name })}
        />
      )}
      {showNewDm && (
        <NewDmModal
          wsId={wsId}
          currentUid={user.uid}
          currentProfile={profile}
          onClose={() => setShowNewDm(false)}
          onCreated={dm => {
            const otherName = dm.memberNames?.find((_, i) => dm.members[i] !== user.uid) || "DM";
            setActiveConvo({ type: "dm", id: dm.id, name: otherName });
          }}
        />
      )}
    </div>
  );
}
