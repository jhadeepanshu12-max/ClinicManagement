import React from "react";

import PatientPortalSection from "../components/PatientPortalSection";
import { useAuth } from "../context/AuthContext";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getPatientPortal } from "../api/api";


function Profile() {
  const router = useRouter();

  const { user } = useAuth();

  const [profile, setProfile] =
    React.useState<any>(user || {});

  const [loading, setLoading] =
    React.useState(false);

  React.useEffect(() => {
    loadProfile();
  }, [user?.role]);

  const loadProfile = async () => {
    try {
      if (user?.role === "patient") {
        setLoading(true);

        const result =
          await getPatientPortal();

        setProfile(
          result?.patient ||
            result?.user ||
            result ||
            user
        );
      } else {
        setProfile(user || {});
      }
    } catch (error) {
      console.log(
        "Profile error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const updateLocal = async (
    field: string,
    value: string
  ) => {
    const updated = {
      ...profile,
      [field]: value,
    };

    setProfile(updated);

    const stored =
      await AsyncStorage.getItem(
        "clinic_user"
      );

    if (stored) {
      const oldUser = JSON.parse(stored);

      await AsyncStorage.setItem(
        "clinic_user",
        JSON.stringify({
          ...oldUser,
          [field]: value,
        })
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.back}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          My Profile
        </Text>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {profile?.name
            ?.charAt(0)
            ?.toUpperCase() || "U"}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          Name
        </Text>

        <TextInput
          style={styles.input}
          value={profile?.name || ""}
          editable={false}
        />

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          value={profile?.email || ""}
          editable={false}
        />

        <Text style={styles.label}>
          Phone
        </Text>

        <TextInput
          style={styles.input}
          value={profile?.phone || ""}
          placeholder="Phone number"
          placeholderTextColor="#9CA3AF"
          onChangeText={(value) =>
            updateLocal("phone", value)
          }
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>
          Role
        </Text>

        <TextInput
          style={styles.input}
          value={profile?.role || user?.role || ""}
          editable={false}
        />

        {loading && (
          <Text style={styles.loading}>
            Loading profile...
          </Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Alert.alert(
              "Profile",
              "Profile information is saved locally for this session."
            )
          }
        >
          <Text style={styles.buttonText}>
            Save Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  back: {
    color: "#2563EB",
    fontWeight: "700",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 35,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 35,
    fontWeight: "900",
  },

  form: {
    marginTop: 30,
  },

  label: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
    marginTop: 12,
  },

  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    color: "#111827",
  },

  loading: {
    color: "#6B7280",
    marginTop: 10,
  },

  button: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});

export default function ProfileScreen() {
  const role = useAuthRole();
  if (role === "patient") return <PatientPortalSection section="profile" />;
  return <Profile />;
}

function useAuthRole() {
  const { user } = useAuth();
  return String(user?.role || "").toLowerCase();
}
