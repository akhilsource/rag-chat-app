"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import type { AppUser } from "@/types/auth";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Exchange the current Firebase user's ID token for our own JWT session cookie. */
async function syncSessionCookie(firebaseUser: User) {
  const idToken = await firebaseUser.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error("Failed to establish session");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          name: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signup(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    await syncSessionCookie(credential.user);
    setUser({ uid: credential.user.uid, email, name });
  }

  async function login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await syncSessionCookie(credential.user);
    setUser({
      uid: credential.user.uid,
      email: credential.user.email ?? email,
      name: credential.user.displayName,
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await firebaseSignOut(firebaseAuth);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
