import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { app } from "../firebase";


// Ensure app is initialized for Auth as well.
// If you're already initializing in firebase.ts a different way, we can adjust later.

const auth = getAuth(app);

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { auth };
