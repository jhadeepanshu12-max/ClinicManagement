import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  createPatient,
  deletePatient,
  getPatients,
  updatePatient,
} from "../api/api";

const initial = {
  name: "", dateOfBirth: "", gender: "", phone: "", email: "",
  address: "", bloodGroup: "unknown", emergencyName: "",
  emergencyPhone: "", emergencyRelationship: "", medicalHistory: "",
  allergies: "", notes: "",
};

const Field = ({ label, value, onChangeText, placeholder, multiline = false }: any) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#98A2B3"
      multiline={multiline}
      style={[styles.input, multiline && styles.textarea]}
    />
  </View>
);

export default function Patients() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(initial);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setItems(await getPatients());
    } catch (e: any) {
      Alert.alert("Patients", e?.response?.data?.message || "Unable to load patients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const set = (key: string, value: string) => setForm((x: any) => ({ ...x, [key]: value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...initial });
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      ...initial,
      name: p.name || "",
      dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : "",
      gender: p.gender || "",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      bloodGroup: p.bloodGroup || "unknown",
      emergencyName: p.emergencyContact?.name || "",
      emergencyPhone: p.emergencyContact?.phone || "",
      emergencyRelationship: p.emergencyContact?.relationship || "",
      medicalHistory: p.medicalHistory || "",
      allergies: Array.isArray(p.allergies) ? p.allergies.join(", ") : "",
      notes: p.notes || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.dateOfBirth || !form.gender || !form.phone.trim()) {
      Alert.alert("Validation", "Name, date of birth, gender and phone are required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender.toLowerCase(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        bloodGroup: form.bloodGroup,
        emergencyContact: {
          name: form.emergencyName.trim() || undefined,
          phone: form.emergencyPhone.trim() || undefined,
          relationship: form.emergencyRelationship.trim() || undefined,
        },
        medicalHistory: form.medicalHistory.trim() || undefined,
        allergies: form.allergies.split(",").map((x: string) => x.trim()).filter(Boolean),
        notes: form.notes.trim() || undefined,
      };
      if (editing?._id) await updatePatient(editing._id, payload);
      else await createPatient(payload);
      setShowForm(false);
      await load();
      Alert.alert("Success", editing ? "Patient updated successfully." : "Patient added successfully.");
    } catch (e: any) {
      Alert.alert("Patient", e?.response?.data?.message || "Unable to save patient.");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = (p: any) =>
    Alert.alert("Deactivate patient", `Deactivate ${p.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Deactivate", style: "destructive", onPress: async () => {
        try { await deletePatient(p._id); await load(); }
        catch (e: any) { Alert.alert("Error", e?.response?.data?.message || "Unable to deactivate."); }
      }},
    ]);

  const filtered = items.filter((p) =>
    `${p.name || ""} ${p.patientId || ""} ${p.phone || ""} ${p.email || ""}`
      .toLowerCase().includes(search.toLowerCase())
  );

  if (showForm) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{editing ? "Edit Patient" : "Add New Patient"}</Text>
            <Text style={styles.subtitle}>CareSync • Patient Management</Text>
            <Field label="Full Name *" value={form.name} onChangeText={(v: string) => set("name", v)} placeholder="Patient full name" />
            <Field label="Date of Birth *" value={form.dateOfBirth} onChangeText={(v: string) => set("dateOfBirth", v)} placeholder="YYYY-MM-DD" />
            <Field label="Gender *" value={form.gender} onChangeText={(v: string) => set("gender", v)} placeholder="male / female / other" />
            <Field label="Phone *" value={form.phone} onChangeText={(v: string) => set("phone", v)} placeholder="9876543210" />
            <Field label="Email" value={form.email} onChangeText={(v: string) => set("email", v)} placeholder="patient@email.com" />
            <Field label="Address" value={form.address} onChangeText={(v: string) => set("address", v)} placeholder="Address" multiline />
            <Field label="Blood Group" value={form.bloodGroup} onChangeText={(v: string) => set("bloodGroup", v)} placeholder="O+" />
            <Text style={styles.section}>Emergency Contact</Text>
            <Field label="Name" value={form.emergencyName} onChangeText={(v: string) => set("emergencyName", v)} placeholder="Contact name" />
            <Field label="Phone" value={form.emergencyPhone} onChangeText={(v: string) => set("emergencyPhone", v)} placeholder="Phone" />
            <Field label="Relationship" value={form.emergencyRelationship} onChangeText={(v: string) => set("emergencyRelationship", v)} placeholder="Father / Mother / Spouse" />
            <Text style={styles.section}>Medical Information</Text>
            <Field label="Medical History" value={form.medicalHistory} onChangeText={(v: string) => set("medicalHistory", v)} placeholder="Medical history" multiline />
            <Field label="Allergies" value={form.allergies} onChangeText={(v: string) => set("allergies", v)} placeholder="Comma separated" />
            <Field label="Notes" value={form.notes} onChangeText={(v: string) => set("notes", v)} placeholder="Notes" multiline />
            <TouchableOpacity style={styles.primary} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editing ? "Update Patient" : "Create Patient"}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={() => setShowForm(false)} disabled={saving}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View><Text style={styles.title}>Patients</Text><Text style={styles.subtitle}>{filtered.length} patients</Text></View>
          <TouchableOpacity style={styles.smallButton} onPress={openAdd}><Text style={styles.smallButtonText}>+ Add</Text></TouchableOpacity>
        </View>
        <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="Search patients..." placeholderTextColor="#98A2B3" />
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#315FEF" /> : (
          <FlatList
            data={filtered}
            keyExtractor={(x) => x._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); }} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{String(item.name || "?").charAt(0).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name || "Unnamed"}</Text>
                  <Text style={styles.muted}>{item.patientId || "No ID"} • {item.phone || "No phone"}</Text>
                  <Text style={styles.muted}>{item.gender || "—"} • {item.bloodGroup || "Unknown"}</Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(item)}><Text style={styles.action}>Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deactivate(item)}><Text style={styles.danger}>Off</Text></TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No patients found.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F5F7FB"},container:{padding:18,paddingBottom:40,flexGrow:1},
  headerRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:14},
  title:{fontSize:28,fontWeight:"900",color:"#172033"},subtitle:{fontSize:13,color:"#7B8798",marginTop:3},
  input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#E5EAF1",borderRadius:12,paddingHorizontal:14,height:48,color:"#172033",marginBottom:12},
  field:{marginBottom:12},label:{fontSize:12,fontWeight:"800",color:"#4B5565",marginBottom:6},
  textarea:{height:90,textAlignVertical:"top",paddingTop:12},section:{fontSize:17,fontWeight:"900",color:"#172033",marginVertical:12},
  primary:{height:50,borderRadius:12,backgroundColor:"#315FEF",alignItems:"center",justifyContent:"center",marginTop:8},
  primaryText:{color:"#fff",fontWeight:"900",fontSize:15},secondary:{height:50,borderRadius:12,backgroundColor:"#E9EDF4",alignItems:"center",justifyContent:"center",marginTop:10},
  secondaryText:{color:"#334155",fontWeight:"800"},smallButton:{backgroundColor:"#315FEF",paddingHorizontal:16,paddingVertical:11,borderRadius:11},smallButtonText:{color:"#fff",fontWeight:"900"},
  card:{backgroundColor:"#fff",borderRadius:16,padding:14,marginBottom:10,flexDirection:"row",alignItems:"center",gap:9},
  avatar:{width:44,height:44,borderRadius:14,backgroundColor:"#E8EEFF",alignItems:"center",justifyContent:"center"},avatarText:{color:"#315FEF",fontWeight:"900",fontSize:18},
  cardTitle:{fontSize:15,fontWeight:"900",color:"#172033"},muted:{fontSize:11,color:"#7B8798",marginTop:3},action:{color:"#315FEF",fontWeight:"900",fontSize:12},danger:{color:"#D92D20",fontWeight:"900",fontSize:12},empty:{textAlign:"center",marginTop:40,color:"#7B8798"},
});
