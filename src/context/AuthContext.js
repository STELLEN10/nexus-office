import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, "office_users", u.uid));
        if (snap.exists()) setProfile(snap.data());
      } else { setUser(null); setProfile(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const p = { uid: cred.user.uid, name, email, avatar: "", createdAt: serverTimestamp() };
    await setDoc(doc(db, "office_users", cred.user.uid), p);
    setProfile(p);
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "office_users", cred.user.uid));
    if (snap.exists()) setProfile(snap.data());
  };

  const logout = () => signOut(auth);

  const updateUserProfile = async (updates) => {
    await updateDoc(doc(db, "office_users", user.uid), updates);
    const snap = await getDoc(doc(db, "office_users", user.uid));
    if (snap.exists()) setProfile(snap.data());
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
