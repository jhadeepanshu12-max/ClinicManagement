import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  login as apiLogin,
  logout as apiLogout,
} from "../api/api";

type User = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem("clinic_token");
      const storedUser = await AsyncStorage.getItem(
        "clinic_user"
      );

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("Session restore error:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ) => {
    const result: any = await apiLogin(email, password);

    const root = result?.data ?? result;

    const token =
      root?.token ||
      root?.accessToken ||
      root?.jwt;

    const loggedUser =
      root?.user ||
      root?.data?.user;

    if (!token) {
      throw new Error("Login token not received");
    }

    if (!loggedUser) {
      throw new Error("User information not received");
    }

    await AsyncStorage.setItem(
      "clinic_token",
      token
    );

    await AsyncStorage.setItem(
      "clinic_user",
      JSON.stringify(loggedUser)
    );

    await AsyncStorage.setItem(
      "authenticated_role",
      loggedUser.role || ""
    );

    setUser(loggedUser);

    return loggedUser;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}