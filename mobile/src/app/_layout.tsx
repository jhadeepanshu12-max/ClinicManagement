import React from "react";

import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../context/AuthContext";

function NavigationGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) {
      return;
    }

    const current =
      segments.length > 0
        ? String(segments[segments.length - 1])
        : "";

    // Pages that can be accessed without authentication
    const isAuthPage =
      current === "index" ||
      current === "role-selection" ||
      current === "login" ||
      current === "patient-register";

    // User is not logged in and is trying to access
    // a protected page
    if (!user && !isAuthPage) {
      router.replace("/role-selection");
      return;
    }

    // User is already logged in and tries to open
    // login/auth selection pages
    if (user && isAuthPage) {
      const role = String(user.role || "").toLowerCase();

      router.replace(
        role === "admin"
          ? "/dashboard"
          : "/role-dashboard"
      );
    }
  }, [user, loading, segments]);

  return null;
}

function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          paddingTop: insets.top,
        },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationGuard />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}