import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  FileText,
  Pill,
  Receipt,
  UserRound,
  ArrowLeft,
} from "lucide-react-native";
import {
  getPatientAppointments,
  getPatientBilling,
  getPatientMedicalRecords,
  getPatientPrescriptions,
  getPatientProfile,
} from "../api/api";
import { useAuth } from "../context/AuthContext";

const C = {
  navy: "#0B1736", blue: "#315FEF", purple: "#7C3AED",
  bg: "#F5F7FB", white: "#FFFFFF", text: "#172033",
  muted: "#7B8798", border: "#E5EAF1", blueSoft: "#E8EEFF",
  purpleSoft: "#F1ECFF", greenSoft: "#E9F9F0", orangeSoft: "#FFF3E8",
  green: "#159A61", orange: "#C96A16",
};

type Section = "appointments" | "medical-records" | "prescriptions" | "billing" | "profile";

const CONFIG: Record<Section, any> = {
  appointments: { title: "My Appointments", subtitle: "View your upcoming and previous appointments.", icon: CalendarDays, color: C.blue },
  "medical-records": { title: "Medical Records", subtitle: "View your medical history and clinical records.", icon: FileText, color: C.purple },
  prescriptions: { title: "Prescriptions", subtitle: "View medicines prescribed by your doctors.", icon: Pill, color: C.green },
  billing: { title: "Billing", subtitle: "View your bills and payment information.", icon: Receipt, color: C.orange },
  profile: { title: "My Profile", subtitle: "View your personal and patient information.", icon: UserRound, color: C.blue },
};

function unwrap(value: any) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function fmtDate(value: any) {
  if (!value) return "Date not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PatientPortalSection({ section }: { section: Section }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const config = CONFIG[section];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      let result: any;
      if (section === "appointments") result = await getPatientAppointments();
      else if (section === "medical-records") result = await getPatientMedicalRecords();
      else if (section === "prescriptions") result = await getPatientPrescriptions();
      else if (section === "billing") result = await getPatientBilling();
      else result = await getPatientProfile();
      setData(result);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Unable to load this information.");
    } finally { setLoading(false); }
  }, [section]);

  useEffect(() => { load(); }, [load]);

  const nav = (s: Section) => router.replace(`/${s}` as any);
  const doLogout = async () => { await logout(); router.replace("/role-selection"); };
  const Icon = config.icon;
  const items = unwrap(data);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/role-dashboard")} style={styles.back}>
            <ArrowLeft size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.brandIcon}><Text style={styles.plus}>+</Text></View>
          <View style={{ flex: 1 }}><Text style={styles.brand}>CareSync</Text><Text style={styles.brandSub}>PATIENT PORTAL</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{String(user?.name || "P").charAt(0).toUpperCase()}</Text></View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.blue} />}
        >
          <Text style={styles.eyebrow}>PATIENT PORTAL</Text>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          <View style={styles.identityCard}>
            <View style={[styles.bigIcon, { backgroundColor: C.blueSoft }]}><Icon size={25} color={config.color} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{user?.name || "Patient"}</Text>
              <Text style={styles.cardMuted}>{user?.email || ""}</Text>
              <Text style={styles.cardMuted}>{user?.phone || ""}</Text>
            </View>
          </View>

          <View style={styles.navRow}>
            {(["appointments", "medical-records", "prescriptions", "billing"] as Section[]).map((s) => {
              const active = s === section; const I = CONFIG[s].icon;
              return <TouchableOpacity key={s} onPress={() => nav(s)} style={[styles.navChip, active && styles.navChipActive]}>
                <I size={16} color={active ? C.white : C.blue} /><Text style={[styles.navChipText, active && { color: C.white }]}>{CONFIG[s].title.replace("My ", "")}</Text>
              </TouchableOpacity>;
            })}
          </View>

          {loading ? <View style={styles.center}><ActivityIndicator size="large" color={C.blue} /><Text style={styles.muted}>Loading...</Text></View> : error ? <View style={styles.error}><Text style={styles.errorTitle}>Something went wrong</Text><Text style={styles.muted}>{error}</Text><TouchableOpacity style={styles.primary} onPress={load}><Text style={styles.primaryText}>Try Again</Text></TouchableOpacity></View> : section === "profile" ? (
            <View style={styles.profileCard}>
              {Object.entries(data?.data || data || {}).filter(([k]) => !["_id", "user"].includes(k)).map(([k, v]) => <View style={styles.profileRow} key={k}><Text style={styles.profileKey}>{k.replace(/([A-Z])/g, " $1").replace(/^./, x => x.toUpperCase())}</Text><Text style={styles.profileValue}>{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</Text></View>)}
            </View>
          ) : (
            <View>
              {items.length === 0 ? <View style={styles.empty}><View style={styles.emptyIcon}><Icon size={24} color={config.color} /></View><Text style={styles.cardTitle}>No {config.title.toLowerCase()} yet</Text><Text style={styles.muted}>Your information will appear here when available.</Text></View> : items.map((item: any, index: number) => <View key={item?._id || index} style={styles.item}>
                <View style={[styles.itemIcon, { backgroundColor: section === "prescriptions" ? C.greenSoft : section === "billing" ? C.orangeSoft : C.blueSoft }]}><Icon size={21} color={config.color} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{section === "appointments" ? `Dr. ${item?.doctor?.name || item?.doctorName || "Doctor"}` : section === "medical-records" ? (item?.diagnosis || item?.title || "Medical Record") : section === "prescriptions" ? (item?.medicineName || item?.medication || item?.medicine || "Prescription") : `Bill ${item?.billNumber || item?.invoiceNumber || ""}`}</Text>
                  <Text style={styles.cardMuted}>{fmtDate(item?.appointmentDate || item?.createdAt || item?.date)}</Text>
                  <Text style={styles.cardMuted}>{item?.status || item?.description || item?.notes || item?.paymentStatus || "View details"}</Text>
                </View>
              </View>)}
            </View>
          )}

          <TouchableOpacity style={styles.logout} onPress={doLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},root:{flex:1},header:{height:76,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border,flexDirection:"row",alignItems:"center",paddingHorizontal:16,gap:10},back:{width:38,height:38,borderRadius:12,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"},brandIcon:{width:38,height:38,borderRadius:12,backgroundColor:C.blue,alignItems:"center",justifyContent:"center"},plus:{color:C.white,fontSize:25,fontWeight:"900"},brand:{fontSize:17,fontWeight:"900",color:C.text},brandSub:{fontSize:9,fontWeight:"800",letterSpacing:1.2,color:C.muted,marginTop:1},avatar:{width:40,height:40,borderRadius:20,backgroundColor:C.blueSoft,alignItems:"center",justifyContent:"center"},avatarText:{color:C.blue,fontWeight:"900",fontSize:16},content:{padding:18,paddingBottom:40},eyebrow:{fontSize:11,fontWeight:"900",letterSpacing:1.5,color:C.blue,marginTop:8},title:{fontSize:28,fontWeight:"900",color:C.text,marginTop:6},subtitle:{fontSize:13,color:C.muted,marginTop:5,marginBottom:18},identityCard:{backgroundColor:C.white,borderRadius:18,borderWidth:1,borderColor:C.border,padding:16,flexDirection:"row",alignItems:"center",gap:12,marginBottom:14},bigIcon:{width:50,height:50,borderRadius:16,alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:15,fontWeight:"900",color:C.text},cardMuted:{fontSize:12,color:C.muted,marginTop:3},navRow:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:16},navChip:{flexDirection:"row",alignItems:"center",gap:6,borderWidth:1,borderColor:C.border,backgroundColor:C.white,borderRadius:10,paddingHorizontal:11,paddingVertical:9},navChipActive:{backgroundColor:C.blue,borderColor:C.blue},navChipText:{fontSize:11,fontWeight:"800",color:C.text},center:{alignItems:"center",paddingVertical:70,gap:12},muted:{fontSize:12,color:C.muted,marginTop:4},item:{backgroundColor:C.white,borderWidth:1,borderColor:C.border,borderRadius:16,padding:14,flexDirection:"row",alignItems:"center",gap:12,marginBottom:10},itemIcon:{width:44,height:44,borderRadius:14,alignItems:"center",justifyContent:"center"},empty:{backgroundColor:C.white,borderRadius:18,borderWidth:1,borderColor:C.border,padding:35,alignItems:"center",marginTop:4},emptyIcon:{width:54,height:54,borderRadius:18,backgroundColor:C.blueSoft,alignItems:"center",justifyContent:"center",marginBottom:12},error:{backgroundColor:C.white,borderRadius:18,borderWidth:1,borderColor:C.border,padding:22,alignItems:"center"},errorTitle:{fontSize:18,fontWeight:"900",color:C.text},primary:{backgroundColor:C.blue,borderRadius:11,paddingHorizontal:20,paddingVertical:12,marginTop:15},primaryText:{color:C.white,fontWeight:"900"},profileCard:{backgroundColor:C.white,borderRadius:18,borderWidth:1,borderColor:C.border,padding:16},profileRow:{borderBottomWidth:1,borderBottomColor:C.border,paddingVertical:12},profileKey:{fontSize:11,fontWeight:"800",color:C.muted},profileValue:{fontSize:14,fontWeight:"700",color:C.text,marginTop:3},logout:{height:50,borderRadius:12,backgroundColor:"#EEF1F6",alignItems:"center",justifyContent:"center",marginTop:20},logoutText:{fontWeight:"900",color:"#475467"}}
);
