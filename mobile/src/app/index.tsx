import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    const role = String(user?.role || "").toLowerCase();
    router.replace(user ? (role === "admin" ? "/dashboard" : "/role-dashboard") : "/role-selection");
  }, [user, loading]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F8FC" }}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
