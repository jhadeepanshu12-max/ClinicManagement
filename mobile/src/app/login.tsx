import React from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    role?: string;
  }>();

  const role = params.role || "patient";
  const portalRole = role === "staff" ? "receptionist" : role;

  const { login } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [loading, setLoading] =
    React.useState(false);

  const roleName =
    role.charAt(0).toUpperCase() +
    role.slice(1);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const loggedUser = await login(
        email.trim(),
        password
      );

      if (
        loggedUser.role &&
        loggedUser.role !== portalRole
      ) {
        Alert.alert(
          "Role mismatch",
          `This account belongs to ${loggedUser.role}, not ${portalRole}.`
        );

        return;
      }

      router.replace(loggedUser.role === "admin" ? "/dashboard" : "/role-dashboard");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to login. Please try again.";

      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <TouchableOpacity
          onPress={() =>
            router.replace("/role-selection")
          }
        >
          <Text style={styles.back}>
            ← Change role
          </Text>
        </TouchableOpacity>

        <Text style={styles.logo}>CareSync</Text>

        <Text style={styles.title}>
          {roleName} Login
        </Text>

        <Text style={styles.subtitle}>
          Sign in to access your clinic dashboard
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                Login
              </Text>
            )}
          </TouchableOpacity>

          {role === "patient" && (
            <TouchableOpacity
              style={styles.createAccount}
              onPress={() => router.push("/patient-register")}
            >
              <Text style={styles.createText}>Don&apos;t have an account? Create Patient Account</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  box: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  back: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 35,
  },

  logo: {
    color: "#2563EB",
    fontSize: 31,
    fontWeight: "900",
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 30,
  },

  form: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginTop: 10,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    color: "#111827",
  },

  button: {
    height: 54,
    backgroundColor: "#2563EB",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  createAccount: { alignItems: "center", paddingVertical: 14 },

  createText: { color: "#2563EB", fontSize: 13, fontWeight: "800" },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});