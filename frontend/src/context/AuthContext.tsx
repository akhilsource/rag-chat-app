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
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import type { AppUser } from "@/types/auth";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** @deprecated Use signOut instead */
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
    if (!firebaseAuth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          name: firebaseUser.displayName,
        });
        void syncSessionCookie(firebaseUser).catch(() => {
          // Keep the client session alive even if the server cookie sync fails.
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signup(name: string, email: string, password: string) {
    if (!firebaseAuth) {
      throw new Error("Firebase is not configured yet. Add your Firebase config to the frontend .env file.");
    }

    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    await syncSessionCookie(credential.user);
    setUser({ uid: credential.user.uid, email, name });
  }

  async function login(email: string, password: string) {
    if (!firebaseAuth) {
      throw new Error("Firebase is not configured yet. Add your Firebase config to the frontend .env file.");
    }

    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await syncSessionCookie(credential.user);
    setUser({
      uid: credential.user.uid,
      email: credential.user.email ?? email,
      name: credential.user.displayName,
    });
  }

  async function loginWithGoogle() {
    if (!firebaseAuth) {
      throw new Error("Firebase is not configured yet. Add your Firebase config to the frontend .env file.");
    }

    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(firebaseAuth, provider);
    await syncSessionCookie(credential.user);
    setUser({
      uid: credential.user.uid,
      email: credential.user.email ?? "",
      name: credential.user.displayName,
    });
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      if (firebaseAuth) {
        await firebaseSignOut(firebaseAuth);
      }
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signup, login, loginWithGoogle, signOut, logout: signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
