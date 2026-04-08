import { createContext, useContext, useEffect, useState } from "react";
import { doc, setDoc, collection, query, where,
         onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces]   = useState([]);
  const [activeWs, setActiveWs]       = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) { setWorkspaces([]); setActiveWs(null); setLoading(false); return; }
    const q = query(collection(db, "workspaces"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWorkspaces(list);
      if (!activeWs && list.length > 0) setActiveWs(list[0]);
      setLoading(false);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createWorkspace = async ({ name, plan = "free" }) => {
    const id = `ws_${Date.now()}_${user.uid.slice(0,6)}`;
    const ws = {
      id, name, plan,
      ownerId: user.uid,
      members: [user.uid],
      memberRoles: { [user.uid]: "owner" },
      createdAt: serverTimestamp(),
      settings: { allowInvites: true },
    };
    await setDoc(doc(db, "workspaces", id), ws);
    setActiveWs({ ...ws, id });
    return id;
  };

  const switchWorkspace = (ws) => setActiveWs(ws);

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWs, loading, createWorkspace, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
