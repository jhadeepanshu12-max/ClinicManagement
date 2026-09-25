import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>CareSync</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and application preferences.</Text>
        <View style={styles.card}>
          <Text style={styles.heading}>Account</Text>
          <Text style={styles.label}>Name</Text><Text style={styles.value}>{user?.name || "—"}</Text>
          <Text style={styles.label}>Email</Text><Text style={styles.value}>{user?.email || "—"}</Text>
          <Text style={styles.label}>Role</Text><Text style={styles.value}>{user?.role || "—"}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/profile")}><Text style={styles.profileText}>Open Profile</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F5F8FC"},content:{padding:20},back:{color:"#2563EB",fontWeight:"800",marginBottom:22},eyebrow:{fontSize:11,color:"#2563EB",fontWeight:"900",letterSpacing:1},title:{fontSize:30,fontWeight:"900",color:"#172033",marginTop:5},subtitle:{color:"#64748B",marginTop:6,marginBottom:20},card:{backgroundColor:"#FFF",borderRadius:18,borderWidth:1,borderColor:"#E5EAF1",padding:18},heading:{fontSize:18,fontWeight:"900",color:"#172033",marginBottom:12},label:{fontSize:11,color:"#64748B",fontWeight:"700",marginTop:10},value:{fontSize:14,color:"#172033",fontWeight:"700",marginTop:3},profileButton:{height:48,borderRadius:12,backgroundColor:"#2563EB",alignItems:"center",justifyContent:"center",marginTop:15},profileText:{color:"#FFF",fontWeight:"800"}});
