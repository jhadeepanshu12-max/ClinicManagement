import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import {
  getAppointments,
  getBilling,
  getDoctors,
  getMedicalRecords,
  getPatients,
  getPrescriptions,
  getPatientPortal,
} from "../api/api";

const C = {
  navy: "#0B1736", blue: "#2563EB", purple: "#7C3AED", green: "#059669",
  orange: "#EA580C", red: "#DC2626", bg: "#F5F8FC", white: "#FFFFFF",
  text: "#172033", muted: "#64748B", border: "#E5EAF1", blueSoft: "#EFF6FF",
  greenSoft: "#ECFDF5", purpleSoft: "#F5F3FF", orangeSoft: "#FFF7ED",
};

const roleConfig: Record<string, { title: string; subtitle: string; nav: { label: string; route: string; icon: string }[] }> = {
  doctor: {
    title: "Doctor Dashboard", subtitle: "Doctor Portal",
    nav: [
      { label: "Dashboard", route: "/role-dashboard", icon: "⌂" },
      { label: "My Appointments", route: "/appointments", icon: "▣" },
      { label: "My Patients", route: "/patients", icon: "♙" },
      { label: "Medical Records", route: "/medical-records", icon: "▤" },
      { label: "Prescriptions", route: "/prescriptions", icon: "Rx" },
      { label: "Billing", route: "/billing", icon: "₹" },
      { label: "My Profile", route: "/profile", icon: "⚙" },
    ],
  },
  receptionist: {
    title: "Staff Dashboard", subtitle: "Staff Portal",
    nav: [
      { label: "Dashboard", route: "/role-dashboard", icon: "⌂" },
      { label: "Patients", route: "/patients", icon: "♙" },
      { label: "Appointments", route: "/appointments", icon: "▣" },
      { label: "Billing", route: "/billing", icon: "₹" },
      { label: "Inventory", route: "/inventory", icon: "▤" },
      { label: "Expenses", route: "/expenses", icon: "◈" },
      { label: "Doctors", route: "/doctors", icon: "⚕" },
      { label: "My Profile", route: "/profile", icon: "⚙" },
    ],
  },
  patient: {
    title: "Patient Dashboard", subtitle: "Patient Portal",
    nav: [
      { label: "Dashboard", route: "/role-dashboard", icon: "▦" },
      { label: "My Appointments", route: "/appointments", icon: "▣" },
      { label: "Medical Records", route: "/medical-records", icon: "▤" },
      { label: "Prescriptions", route: "/prescriptions", icon: "▥" },
      { label: "Billing", route: "/billing", icon: "₹" },
      { label: "My Profile", route: "/profile", icon: "◉" },
    ],
  },
};

function array(value: any, keys: string[] = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return Array.isArray(value?.data) ? value.data : [];
}

function firstName(user: any) { return String(user?.name || "User").split(" ")[0]; }

export default function RoleDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = String(user?.role || "receptionist").toLowerCase();
  const config = roleConfig[role] || roleConfig.receptionist;
  const [drawer, setDrawer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [portal, setPortal] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (role === "patient") {
        const [p, a, r, rx, b] = await Promise.allSettled([
          getPatientPortal(), getAppointments(), getMedicalRecords(), getPrescriptions(), getBilling(),
        ]);
        if (p.status === "fulfilled") setPortal(p.value);
        if (a.status === "fulfilled") setAppointments(array(a.value, ["appointments"]));
        if (r.status === "fulfilled") setRecords(array(r.value, ["records", "medicalRecords"]));
        if (rx.status === "fulfilled") setPrescriptions(array(rx.value, ["prescriptions"]));
        if (b.status === "fulfilled") setBills(array(b.value, ["billing", "bills"]));
      } else {
        const calls: Promise<any>[] = [getAppointments()];
        if (role === "receptionist") calls.push(getPatients(), getDoctors(), getBilling());
        else calls.push(getPatients(), getMedicalRecords(), getPrescriptions());
        const results = await Promise.allSettled(calls);
        if (results[0]?.status === "fulfilled") setAppointments(array(results[0].value, ["appointments"]));
        if (results[1]?.status === "fulfilled") setPatients(array(results[1].value, ["patients"]));
        if (role === "receptionist") {
          if (results[2]?.status === "fulfilled") setDoctors(array(results[2].value, ["doctors"]));
          if (results[3]?.status === "fulfilled") setBills(array(results[3].value, ["billing", "bills"]));
        } else {
          if (results[2]?.status === "fulfilled") setRecords(array(results[2].value, ["records", "medicalRecords"]));
          if (results[3]?.status === "fulfilled") setPrescriptions(array(results[3].value, ["prescriptions"]));
        }
      }
    } catch (e) {
      console.log("Role dashboard load error", e);
    } finally { setLoading(false); }
  }, [role]);

  useEffect(() => { load(); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const go = (route: string) => { setDrawer(false); router.push(route as any); };
  const doLogout = async () => { await logout(); router.replace("/role-selection"); };

  const statCards = useMemo(() => {
    if (role === "patient") {
      const stats = portal?.statistics || {};
      return [
        ["Total Appointments", stats.totalAppointments ?? appointments.length, C.blue, C.blueSoft],
        ["Upcoming Appointments", stats.upcomingAppointments ?? 0, C.green, C.greenSoft],
        ["Medical Records", stats.medicalRecords ?? records.length, C.purple, C.purpleSoft],
        ["Prescriptions", stats.prescriptions ?? prescriptions.length, C.orange, C.orangeSoft],
      ];
    }
    if (role === "doctor") return [
      ["My Appointments", appointments.length, C.blue, C.blueSoft],
      ["My Patients", patients.length, C.green, C.greenSoft],
      ["Medical Records", records.length, C.purple, C.purpleSoft],
      ["Prescriptions", prescriptions.length, C.orange, C.orangeSoft],
    ];
    return [
      ["Patients", patients.length, C.blue, C.blueSoft],
      ["Appointments", appointments.length, C.green, C.greenSoft],
      ["Doctors", doctors.length, C.purple, C.purpleSoft],
      ["Bills", bills.length, C.orange, C.orangeSoft],
    ];
  }, [role, portal, appointments, patients, doctors, records, prescriptions, bills]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={styles.root}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.menu} onPress={() => setDrawer(true)}><Text style={styles.menuText}>☰</Text></TouchableOpacity>
          <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>+</Text></View><View><Text style={styles.brandName}>CareSync</Text><Text style={styles.brandSub}>{config.subtitle.toUpperCase()}</Text></View></View>
          <TouchableOpacity style={styles.profileMini} onPress={() => go("/profile")}><Text style={styles.profileText}>{firstName(user).charAt(0).toUpperCase()}</Text></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}>
          <Text style={styles.eyebrow}>{config.subtitle}</Text>
          <Text style={styles.title}>Good afternoon, {firstName(user)}</Text>
          <Text style={styles.subtitle}>{role === "patient" ? "Manage your appointments, medical records and healthcare information." : "Here is what is happening at your clinic today."}</Text>

          {role === "patient" && portal?.patient && (
            <View style={styles.patientIdentity}>
              <View style={styles.patientAvatar}><Text style={styles.patientAvatarText}>{String(portal.patient.name || user?.name || "P").charAt(0).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{portal.patient.name || user?.name || "Patient"}</Text>
                <Text style={styles.patientMeta}>Patient ID: {portal.patient.patientId || "Not available"}</Text>
                <Text style={styles.patientMeta}>{portal.patient.email || user?.email || ""} • {portal.patient.phone || user?.phone || ""}</Text>
              </View>
            </View>
          )}

          <View style={styles.statsGrid}>
            {statCards.map(([label, value, color, bg]: any) => (
              <View key={label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: bg }]}><Text style={[styles.statIconText, { color }]}>{String(label).charAt(0)}</Text></View>
                <Text style={styles.statValue}>{loading ? "..." : String(value)}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Section title={role === "patient" ? "Your Care" : "Quick Actions"} subtitle={role === "patient" ? "Access the same patient services available on the CareSync web portal." : "Use the same modules available on the CareSync web portal"}>
            {config.nav.filter(x => x.route !== "/role-dashboard" && x.label !== "My Profile").map(item => (
              <TouchableOpacity key={item.route + item.label} style={styles.action} onPress={() => go(item.route)}>
                <View style={styles.actionIcon}><Text style={styles.actionIconText}>{item.icon}</Text></View>
                <View style={styles.actionInfo}><Text style={styles.actionTitle}>{item.label}</Text><Text style={styles.actionSub}>Open {item.label.toLowerCase()}</Text></View><Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </Section>

          <Section title="Recent Activity" subtitle="Latest information from your account">
            {appointments.length === 0 && records.length === 0 && prescriptions.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyTitle}>{loading ? "Loading..." : "No recent activity"}</Text><Text style={styles.emptyText}>Data will appear here when available.</Text></View>
            ) : (
              appointments.slice(0, 4).map((a, i) => <View key={a?._id || i} style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{a?.patient?.name || a?.patientName || a?.doctorName || "Appointment"}</Text><Text style={styles.rowSub}>{a?.appointmentDate || a?.date || "Appointment"}</Text></View><Text style={styles.rowStatus}>{String(a?.status || "Scheduled")}</Text></View>)
            )}
          </Section>

          {role === "patient" && portal?.patient && <Section title="Patient Profile" subtitle="Your registered information"><View style={styles.profileCard}><Text style={styles.profileName}>{portal.patient.name || user?.name || "Patient"}</Text><Text style={styles.profileMeta}>{portal.patient.email || user?.email || ""}</Text><TouchableOpacity style={styles.primary} onPress={() => go("/profile")}><Text style={styles.primaryText}>View Profile</Text></TouchableOpacity></View></Section>}
        </ScrollView>

        <View style={styles.bottom}><TouchableOpacity style={styles.bottomItem} onPress={() => go("/role-dashboard")}><Text style={styles.bottomIcon}>⌂</Text><Text style={styles.bottomLabel}>Home</Text></TouchableOpacity><TouchableOpacity style={styles.bottomItem} onPress={() => go(role === "patient" ? "/appointments" : "/appointments")}><Text style={styles.bottomIcon}>▣</Text><Text style={styles.bottomLabel}>Appointments</Text></TouchableOpacity><TouchableOpacity style={styles.bottomItem} onPress={() => go("/profile")}><Text style={styles.bottomIcon}>◉</Text><Text style={styles.bottomLabel}>Profile</Text></TouchableOpacity></View>

        {drawer && <View style={styles.overlay}><TouchableOpacity style={styles.outside} onPress={() => setDrawer(false)} /><View style={styles.drawer}><View style={styles.drawerHeader}><View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>+</Text></View><View><Text style={styles.brandName}>CareSync</Text><Text style={styles.brandSub}>{config.subtitle.toUpperCase()}</Text></View></View><TouchableOpacity onPress={() => setDrawer(false)}><Text style={styles.close}>×</Text></TouchableOpacity></View><View style={styles.clinic}><Text style={styles.clinicIcon}>+</Text><View><Text style={styles.clinicName}>CityCare Clinic</Text><Text style={styles.clinicRole}>{role}</Text></View></View><ScrollView>{config.nav.map(item => <TouchableOpacity key={item.label} style={[styles.navItem, item.route === "/role-dashboard" && styles.navActive]} onPress={() => go(item.route)}><Text style={styles.navIcon}>{item.icon}</Text><Text style={[styles.navText, item.route === "/role-dashboard" && styles.navTextActive]}>{item.label}</Text></TouchableOpacity>)}<TouchableOpacity style={styles.logout} onPress={doLogout}><Text style={styles.logoutText}>↪  Logout</Text></TouchableOpacity></ScrollView></View></View>}
      </View>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: any) { return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSub}>{subtitle}</Text></View>{children}</View>; }

const styles = StyleSheet.create({
  patientIdentity:{backgroundColor:C.white,borderRadius:17,borderWidth:1,borderColor:C.border,padding:14,flexDirection:"row",alignItems:"center",gap:11,marginBottom:12},patientAvatar:{width:48,height:48,borderRadius:15,backgroundColor:C.blueSoft,alignItems:"center",justifyContent:"center"},patientAvatarText:{color:C.blue,fontWeight:"900",fontSize:18},patientName:{fontSize:15,fontWeight:"900",color:C.text},patientMeta:{fontSize:10,color:C.muted,marginTop:3},safe:{flex:1,backgroundColor:C.bg},root:{flex:1,backgroundColor:C.bg},topbar:{height:74,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border,flexDirection:"row",alignItems:"center",paddingHorizontal:16},menu:{width:42,height:42,borderRadius:12,backgroundColor:C.blueSoft,alignItems:"center",justifyContent:"center"},menuText:{fontSize:21,color:C.blue},brand:{flex:1,flexDirection:"row",alignItems:"center",marginLeft:12},logo:{width:38,height:38,borderRadius:12,backgroundColor:C.navy,alignItems:"center",justifyContent:"center"},logoText:{color:"#60A5FA",fontSize:23,fontWeight:"900"},brandName:{fontSize:16,fontWeight:"900",color:C.text},brandSub:{fontSize:8,fontWeight:"800",letterSpacing:1,color:C.muted,marginTop:2},profileMini:{width:38,height:38,borderRadius:12,backgroundColor:C.blue,alignItems:"center",justifyContent:"center"},profileText:{color:C.white,fontWeight:"900"},content:{padding:18,paddingBottom:100},eyebrow:{color:C.blue,fontSize:11,fontWeight:"900",textTransform:"uppercase",letterSpacing:1,marginTop:6},title:{fontSize:27,fontWeight:"900",color:C.text,marginTop:6},subtitle:{color:C.muted,fontSize:13,marginTop:5,marginBottom:20},statsGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between"},statCard:{width:"48.2%",backgroundColor:C.white,borderRadius:17,padding:14,marginBottom:12,borderWidth:1,borderColor:C.border},statIcon:{width:34,height:34,borderRadius:10,alignItems:"center",justifyContent:"center",marginBottom:10},statIconText:{fontWeight:"900"},statValue:{fontSize:23,fontWeight:"900",color:C.text},statLabel:{fontSize:11,color:C.muted,marginTop:3},section:{backgroundColor:C.white,borderRadius:18,borderWidth:1,borderColor:C.border,padding:15,marginTop:8,marginBottom:14},sectionHeader:{marginBottom:9},sectionTitle:{fontSize:17,fontWeight:"900",color:C.text},sectionSub:{fontSize:10,color:C.muted,marginTop:3},action:{flexDirection:"row",alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#F1F5F9"},actionIcon:{width:38,height:38,borderRadius:11,backgroundColor:C.blueSoft,alignItems:"center",justifyContent:"center"},actionIconText:{color:C.blue,fontWeight:"900"},actionInfo:{flex:1,marginLeft:11},actionTitle:{fontSize:13,fontWeight:"800",color:C.text},actionSub:{fontSize:10,color:C.muted,marginTop:2},arrow:{fontSize:25,color:C.muted},row:{flexDirection:"row",alignItems:"center",paddingVertical:11,borderBottomWidth:1,borderBottomColor:"#F1F5F9"},avatar:{width:38,height:38,borderRadius:12,backgroundColor:C.blueSoft,alignItems:"center",justifyContent:"center"},avatarText:{color:C.blue,fontWeight:"900"},rowTitle:{fontSize:12,fontWeight:"800",color:C.text,marginLeft:10},rowSub:{fontSize:10,color:C.muted,marginLeft:10,marginTop:2},rowStatus:{fontSize:9,color:C.blue,fontWeight:"800",textTransform:"capitalize"},empty:{padding:20,alignItems:"center"},emptyTitle:{fontWeight:"800",color:C.text},emptyText:{fontSize:11,color:C.muted,marginTop:4},profileCard:{paddingTop:3},profileName:{fontSize:16,fontWeight:"900",color:C.text},profileMeta:{fontSize:11,color:C.muted,marginTop:3},primary:{backgroundColor:C.blue,height:44,borderRadius:11,alignItems:"center",justifyContent:"center",marginTop:13},primaryText:{color:C.white,fontWeight:"800"},bottom:{position:"absolute",left:0,right:0,bottom:0,height:66,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.border,flexDirection:"row",justifyContent:"space-around",alignItems:"center"},bottomItem:{alignItems:"center",justifyContent:"center",minWidth:80},bottomIcon:{fontSize:18,color:C.blue,fontWeight:"900"},bottomLabel:{fontSize:9,color:C.muted,marginTop:2,fontWeight:"700"},overlay:{position:"absolute",top:0,left:0,right:0,bottom:0,flexDirection:"row",backgroundColor:"rgba(7,15,35,0.45)"},outside:{flex:1},drawer:{width:290,backgroundColor:C.navy,paddingTop:48,paddingHorizontal:15},drawerHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:18},close:{fontSize:30,color:"#CBD5E1"},clinic:{backgroundColor:"#111F45",borderRadius:15,padding:12,flexDirection:"row",alignItems:"center",marginBottom:16},clinicIcon:{width:38,height:38,borderRadius:11,backgroundColor:C.blue,alignItems:"center",justifyContent:"center",color:C.white,fontSize:20,textAlign:"center",paddingTop:6},clinicName:{color:C.white,fontWeight:"800",fontSize:12,marginLeft:10},clinicRole:{color:"#8FA0BD",fontSize:9,marginLeft:10,marginTop:2,textTransform:"capitalize"},navItem:{height:45,borderRadius:11,flexDirection:"row",alignItems:"center",paddingHorizontal:11,marginBottom:4},navActive:{backgroundColor:"rgba(37,99,235,0.18)"},navIcon:{width:28,color:"#8FA0BD",fontWeight:"900",fontSize:13},navText:{color:"#AAB7CC",fontSize:12,fontWeight:"600"},navTextActive:{color:C.white,fontWeight:"800"},logout:{height:45,borderRadius:11,backgroundColor:"rgba(239,68,68,0.1)",alignItems:"center",justifyContent:"center",marginTop:15,marginBottom:30},logoutText:{color:"#F87171",fontWeight:"800"}
});
